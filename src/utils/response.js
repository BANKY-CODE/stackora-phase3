/**
 * Standardised API response helpers.
 * All endpoints use these to guarantee a consistent shape.
 */

/**
 * 200 / 201 success response
 */
function success(res, { data = null, message = 'Success', meta = null, status = 200 } = {}) {
  const body = {
    success:   true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

/**
 * 201 created shorthand
 */
function created(res, { data = null, message = 'Resource created' } = {}) {
  return success(res, { data, message, status: 201 });
}

/**
 * Paginated list response
 */
function paginated(res, { data, total, page, limit, message = 'Success' } = {}) {
  return success(res, {
    data,
    message,
    meta: {
      total,
      page:       parseInt(page, 10),
      limit:      parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * 4xx / 5xx error response
 */
function error(res, { message = 'An error occurred', errors = null, status = 500, requestId = null } = {}) {
  const body = {
    success:   false,
    message,
    timestamp: new Date().toISOString(),
  };
  if (errors)    body.errors    = errors;
  if (requestId) body.requestId = requestId;
  return res.status(status).json(body);
}

/**
 * 404 not found shorthand
 */
function notFound(res, resource = 'Resource') {
  return error(res, { message: `${resource} not found`, status: 404 });
}

/**
 * 400 bad request shorthand
 */
function badRequest(res, message = 'Bad request', errors = null) {
  return error(res, { message, errors, status: 400 });
}

module.exports = { success, created, paginated, error, notFound, badRequest };
