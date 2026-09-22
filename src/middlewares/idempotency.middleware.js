import crypto from "crypto";
import { getDB } from "../config/db.js";

/**
 * ==============================================================================
 * Idempotency Middleware
 * ==============================================================================
 * Guarantees request-level deduplication for financial and state-mutating operations.
 *
 * Header: `Idempotency-Key` or `X-Idempotency-Key`
 * Storage: `idempotency_keys` MySQL table
 * Expiration: Configurable TTL (default 24 hours)
 */
export const requireIdempotency = (options = { required: false, ttlHours: 24 }) => {
  return async (req, res, next) => {
    // 1. Extract Idempotency Key from headers
    const rawKey =
      req.headers["idempotency-key"] ||
      req.headers["x-idempotency-key"] ||
      req.body?.idempotency_key;

    if (!rawKey) {
      if (options.required) {
        return res.status(400).json({
          success: false,
          message: "Idempotency-Key header is required for this operation.",
        });
      }
      return next();
    }

    const idempotencyKey = String(rawKey).trim();
    if (idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Idempotency-Key must be between 8 and 128 characters long.",
      });
    }

    // 2. Compute canonical request hash
    const requestPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const payloadToHash = {
      method: req.method,
      path: requestPath,
      body: req.body || {},
      query: req.query || {},
      userId: req.user?.id || null,
    };
    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(payloadToHash))
      .digest("hex");

    try {
      const db = getDB();

      // 3. Check for existing idempotency key
      const [rows] = await db.query(
        `SELECT response_status, response_body, request_hash 
         FROM idempotency_keys 
         WHERE idempotency_key = ? 
           AND expires_at > NOW()`,
        [idempotencyKey]
      );

      if (rows.length > 0) {
        const cached = rows[0];

        // Mismatch detection: Key reused with differing payload
        if (cached.request_hash !== requestHash) {
          return res.status(409).json({
            success: false,
            message:
              "Idempotency conflict: Key was previously used with a different request payload.",
          });
        }

        // Exact match: Return cached response immediately
        res.setHeader("X-Cache", "IDEMPOTENT-HIT");
        res.setHeader("X-Idempotency-Key", idempotencyKey);
        const parsedBody =
          typeof cached.response_body === "string"
            ? JSON.parse(cached.response_body)
            : cached.response_body;

        return res.status(cached.response_status).json(parsedBody);
      }

      // 4. Intercept response to store idempotency record on completion
      res.setHeader("X-Cache", "IDEMPOTENT-MISS");
      res.setHeader("X-Idempotency-Key", idempotencyKey);

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        // Asynchronously persist without blocking response transmission
        if (res.statusCode >= 200 && res.statusCode < 500) {
          const ttlHours = options.ttlHours || 24;
          db.query(
            `INSERT INTO idempotency_keys (
              idempotency_key, request_path, request_hash,
              response_status, response_body, expires_at
            ) VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))
            ON DUPLICATE KEY UPDATE 
              response_status = VALUES(response_status),
              response_body = VALUES(response_body)`,
            [
              idempotencyKey,
              requestPath.substring(0, 255),
              requestHash,
              res.statusCode,
              JSON.stringify(body),
              ttlHours,
            ]
          ).catch((saveErr) => {
            console.error(
              "⚠️ [Idempotency] Failed saving idempotency key cache:",
              saveErr.message
            );
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.error("⚠️ [Idempotency] Middleware check failed:", err.message);
      // Fail-open for middleware infrastructure errors to avoid blocking business operations,
      // but log error prominently
      next();
    }
  };
};

export default requireIdempotency;
