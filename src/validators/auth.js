const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3–30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1–100 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be 1–100 characters'),

  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be 2–100 characters'),
];

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .normalizeEmail(),
];

const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

const updateProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be 1–100 characters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be 1–100 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be under 500 characters'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('A valid phone number is required'),

  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Country must be 2–100 characters'),
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  updateProfileValidator,
};
