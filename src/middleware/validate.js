const { validationResult } = require('express-validator');
const { badRequest }       = require('../utils/response');

/**
 * Run after express-validator chains.
 * If there are errors, return 400 with field-level details.
 * Otherwise call next().
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(e => ({
      field:   e.path || e.param,
      message: e.msg,
      value:   e.value,
    }));
    return badRequest(res, 'Validation failed', formatted);
  }
  next();
}

module.exports = validate;
