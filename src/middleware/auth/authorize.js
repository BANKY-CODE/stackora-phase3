const { error } = require('../../utils/response');

/**
 * Require one or more roles.
 * Usage: router.delete('/users/:id', authenticate, requireRole('admin'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, { message: 'Authentication required', status: 401 });
    }
    const userRoles = req.user.roles || [];
    const hasRole   = roles.some(role => userRoles.includes(role));
    if (!hasRole) {
      return error(res, {
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
        status:  403,
      });
    }
    next();
  };
}

/**
 * Require email verification.
 * Usage: router.post('/courses', authenticate, requireVerified, handler)
 */
function requireVerified(req, res, next) {
  if (!req.user) return error(res, { message: 'Authentication required', status: 401 });
  if (!req.user.is_email_verified) {
    return error(res, { message: 'Email verification required', status: 403 });
  }
  next();
}

/**
 * Require the user to be the owner of a resource OR an admin/moderator.
 * Usage: attach after authenticate, check req.user.id === req.params.id
 */
function requireOwnerOrAdmin(req, res, next) {
  if (!req.user) return error(res, { message: 'Authentication required', status: 401 });
  const isOwner = req.user.id === req.params.id;
  const isAdmin = (req.user.roles || []).some(r => ['admin', 'moderator'].includes(r));
  if (!isOwner && !isAdmin) {
    return error(res, { message: 'Access denied', status: 403 });
  }
  next();
}

module.exports = { requireRole, requireVerified, requireOwnerOrAdmin };
