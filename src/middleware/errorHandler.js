const logger  = require('../utils/logger');
const { error } = require('../utils/response');

/**
 * Global error handler — must be registered last in Express.
 * Catches all errors thrown or passed via next(err).
 */
function errorHandler(err, req, res, next) {
  // Already sent a response
  if (res.headersSent) return next(err);

  const requestId = req.id || 'unknown';
  const status    = err.status || err.statusCode || 500;
  const message   = err.expose || status < 500
    ? err.message
    : 'Internal server error';

  // Log the full error
  if (status >= 500) {
    logger.error(`[${requestId}] ${req.method} ${req.originalUrl} → ${status}: ${err.message}`, {
      stack:  err.stack,
      body:   req.body,
      params: req.params,
      query:  req.query,
    });
  } else {
    logger.warn(`[${requestId}] ${req.method} ${req.originalUrl} → ${status}: ${err.message}`);
  }

  return error(res, { message, status, requestId });
}

/**
 * 404 handler — register before errorHandler to catch unknown routes.
 */
function notFoundHandler(req, res) {
  logger.warn(`404 — ${req.method} ${req.originalUrl}`);
  return error(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    status:  404,
  });
}

module.exports = { errorHandler, notFoundHandler };
