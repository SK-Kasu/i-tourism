const logger = require("../config/logger");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  if (status >= 500) {
    logger.error(err.message, { stack: err.stack, path: req.path });
  }

  res.status(status).json({
    success: false,
    code: err.code || "INTERNAL_ERROR",
    message: status >= 500 ? "An unexpected error occurred." : err.message,
  });
}

module.exports = errorHandler;
