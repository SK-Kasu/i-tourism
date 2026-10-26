const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../lib/AppError");

// Reads the JWT from the httpOnly cookie (see auth.controller.js on login).
function authenticate(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next(new AppError("Not authenticated", 401, "NOT_AUTHENTICATED"));

  try {
    req.user = jwt.verify(token, env.jwtSecret); // { id, role }
    next();
  } catch {
    next(new AppError("Invalid or expired session", 401, "INVALID_TOKEN"));
  }
}

module.exports = authenticate;
