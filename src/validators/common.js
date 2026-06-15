const { body, param, query } = require('express-validator');

// ── UUID param ────────────────────────────────────────────────
const uuidParam = (field = 'id') =>
  param(field).isUUID().withMessage(`${field} must be a valid UUID`);

// ── Pagination query ──────────────────────────────────────────
const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

// ── User fields ───────────────────────────────────────────────
const usernameField = body('username')
  .trim()
  .isLength({ min: 3, max: 30 })
  .withMessage('Username must be 3–30 characters')
  .matches(/^[a-zA-Z0-9_]+$/)
  .withMessage('Username may only contain letters, numbers, and underscores');

const emailField = body('email')
  .trim()
  .isEmail()
  .withMessage('A valid email address is required')
  .normalizeEmail();

// ── Course fields ─────────────────────────────────────────────
const courseTitle = body('title')
  .trim()
  .isLength({ min: 5, max: 150 })
  .withMessage('Title must be 5–150 characters');

const courseLevel = body('level')
  .isIn(['beginner', 'intermediate', 'advanced'])
  .withMessage('Level must be beginner, intermediate, or advanced');

// ── Product fields ────────────────────────────────────────────
const productPrice = body('price')
  .isFloat({ min: 0 })
  .withMessage('Price must be a non-negative number');

// ── Wallet fields ─────────────────────────────────────────────
const walletAmount = body('amount')
  .isFloat({ min: 100 })
  .withMessage('Amount must be at least ₦100');

const serviceType = body('serviceType')
  .isIn(['airtime', 'data', 'electricity', 'cable', 'water', 'sms', 'exam'])
  .withMessage('Invalid service type');

module.exports = {
  uuidParam,
  paginationQuery,
  usernameField,
  emailField,
  courseTitle,
  courseLevel,
  productPrice,
  walletAmount,
  serviceType,
};
