/**
 * Thrown by services/controllers for expected, client-facing failures.
 * Caught by middleware/errorHandler.js and turned into a consistent JSON response.
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = AppError;
