const JwtService = require('../../services/jwtService');
const UserModel  = require('../../models/User');
const { error }  = require('../../utils/response');
const logger     = require('../../utils/logger');

/**
 * Verify JWT access token and attach user to req.user.
 * Usage: router.get('/protected', authenticate, handler)
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, { message: 'Authentication required', status: 401 });
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = JwtService.verifyAccess(token);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError'
        ? 'Access token expired'
        : 'Invalid access token';
      return error(res, { message: msg, status: 401 });
    }

    // Load fresh user from DB
    const user = await UserModel.findById(payload.sub);
    if (!user || !user.is_active) {
      return error(res, { message: 'User not found or inactive', status: 401 });
    }

    req.user      = UserModel.sanitize(user);
    req.tokenData = payload;
    next();
  } catch (err) {
    logger.error('authenticate middleware error:', err.message);
    return error(res, { message: 'Authentication error', status: 500 });
  }
}

/**
 * Optional authentication — attaches user if token present, never blocks.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = JwtService.verifyAccess(token);
        const user    = await UserModel.findById(payload.sub);
        if (user && user.is_active) req.user = UserModel.sanitize(user);
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  next();
}

module.exports = { authenticate, optionalAuth };
