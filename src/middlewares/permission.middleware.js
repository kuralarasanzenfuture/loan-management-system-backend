import { getDB } from "../config/db.js";

/**
 * Granular Permission Checking Middleware
 *
 * Verifies whether the authenticated user has permission to perform
 * a specific action on a module based on the system's RBAC & PBAC hierarchy:
 *   1. Super Admin / Admin role bypasses all checks (full access).
 *   2. User-specific permission overrides role-specific permission (user_permissions).
 *   3. Role-level permission defines base access (role_permissions).
 *
 * Priority logic:
 *   COALESCE(up.is_allowed, rp.is_allowed, 0)
 *
 * @param {string} moduleCode - Code of the module in 'modules' table (e.g., 'MOD_INTEREST_LOAN_PLANS')
 * @param {string} actionCode - Action code in 'module_actions' table (e.g., 'VIEW', 'CREATE', 'EDIT', 'DELETE')
 */
export const checkPermission = (moduleCode, actionCode) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const roleName = (req.user.role || "").trim().toUpperCase();

      // 1. Full Admin Bypass
      if (
        roleName === "ADMIN" ||
        roleName === "SUPER_ADMIN" ||
        roleName === "SUPERADMIN"
      ) {
        return next();
      }

      const userId = req.user.id;
      const roleId = req.user.role_id;

      if (!userId || !roleId) {
        return res.status(403).json({
          success: false,
          message: "User session lacks valid role identification",
        });
      }

      const db = getDB();

      // 2. Query effective permission (user override > role default)
      const [rows] = await db.query(
        `
        SELECT 
          COALESCE(up.is_allowed, rp.is_allowed, 0) AS is_allowed
        FROM modules m
        JOIN module_actions ma 
          ON ma.module_id = m.id 
         AND ma.is_active = 1
        LEFT JOIN role_permissions rp 
          ON rp.action_id = ma.id 
         AND rp.role_id = ?
        LEFT JOIN user_permissions up 
          ON up.action_id = ma.id 
         AND up.user_id = ?
        WHERE m.code = ?
          AND ma.action_code = ?
          AND m.is_active = 1
        LIMIT 1
        `,
        [roleId, userId, moduleCode, actionCode],
      );

      const isAllowed = rows.length > 0 && Boolean(rows[0].is_allowed);

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You do not have permission to perform this action (${moduleCode}:${actionCode}).`,
        });
      }

      next();
    } catch (err) {
      console.error(
        `Permission check error [${moduleCode}:${actionCode}]:`,
        err.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to verify access permissions",
      });
    }
  };
};

export default checkPermission;
