import multer from "multer";

export const errorHandler = (err, req, res, next) => {
  console.error("❌ ERROR:", {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id || null,
    ip: req.ip,
    message: err.message,
  });

  // 🔥 decide status
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // 🔥 Multer Errors
  if (err instanceof multer.MulterError || err.name === "MulterError") {
    status = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File too large. Maximum size allowed is 5 MB.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected file field: ${err.field}`;
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = `Too many files uploaded for field: ${err.field}`;
    } else {
      message = err.message;
    }
  }

  // 🔥 Joi validation error
  if (err.isJoi) {
    status = 400;
    message = err.details[0].message;
  }

  res.status(status).json({
    success: false,
    message,
    requestId: req.requestId,
  });
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error(`[${req.requestId || "NO_ID"}] GLOBAL ERROR`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
};
