const { v4: uuidv4 } = require('uuid');

/**
 * Attaches a unique request ID to every incoming request.
 * Used for logging correlation and error tracing.
 */
function requestId(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

module.exports = requestId;
