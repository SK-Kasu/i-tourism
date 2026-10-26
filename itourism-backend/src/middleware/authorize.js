const AppError = require("../lib/AppError");

// Usage: router.post('/properties', authenticate, authorize('OWNER'), controller)
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return next(new AppError("Not authorized for this action", 403, "NOT_AUTHORIZED"));
    }
    next();
  };
}

module.exports = authorize;
