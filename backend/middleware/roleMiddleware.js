/**
 * Check if user has creator role
 * Must be used after protect middleware
 */
const creatorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (req.user.role !== 'creator') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only creators can perform this action.',
    });
  }

  next();
};

/**
 * Check if user has specific role(s)
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }

    next();
  };
};

export { creatorOnly, authorize };
