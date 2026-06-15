const router      = require('express').Router();
const AuthController = require('../../controllers/authController');
const { authenticate } = require('../../middleware/auth/authenticate');
const { requireVerified } = require('../../middleware/auth/authorize');
const validate    = require('../../middleware/validate');
const { strictLimiter } = require('../../middleware/rateLimiter');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('../../validators/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:  { type: string, example: adeokafor }
 *               email:     { type: string, example: ade@stackora.ng }
 *               password:  { type: string, example: SecurePass1 }
 *               firstName: { type: string, example: Ade }
 *               lastName:  { type: string, example: Okafor }
 *               country:   { type: string, example: Nigeria }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Email or username already exists
 *       400:
 *         description: Validation error
 */
router.post('/register', strictLimiter, registerValidator, validate, AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive access + refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: ade@stackora.ng }
 *               password: { type: string, example: SecurePass1 }
 *     responses:
 *       200:
 *         description: Login successful — returns accessToken and refreshToken
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account temporarily locked
 */
router.post('/login', strictLimiter, loginValidator, validate, AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Get a new access token using a refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access and refresh tokens issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', AuthController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices
 */
router.post('/logout-all', authenticate, AuthController.logoutAll);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify email address using token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', AuthController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 */
router.post('/resend-verification', authenticate, AuthController.resendVerification);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 */
router.post('/forgot-password', strictLimiter, forgotPasswordValidator, validate, AuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:    { type: string }
 *               password: { type: string, example: NewSecurePass1 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', strictLimiter, resetPasswordValidator, validate, AuthController.resetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (must be logged in)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string }
 *     responses:
 *       200:
 *         description: Password changed — all sessions revoked
 *       400:
 *         description: Current password incorrect
 */
router.post('/change-password', authenticate, changePasswordValidator, validate, AuthController.changePassword);

module.exports = router;
