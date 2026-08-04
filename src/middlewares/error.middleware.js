// export const errorHandler = (err, req, res, next) => {
//   console.error(err);
//   res.status(500).json({ message: "Server error" });
// };

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
