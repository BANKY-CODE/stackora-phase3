const AuthService = require('../services/authService');
const { success, created, error } = require('../utils/response');
const logger = require('../utils/logger');

class AuthController {

  static async register(req, res, next) {
    try {
      const { username, email, password, firstName, lastName, country } = req.body;
      const user = await AuthService.register(
        { username, email, password, firstName, lastName, country },
        req.ip
      );
      return created(res, {
        message: 'Account created. Please check your email to verify your account.',
        data:    { user },
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(
        { email, password },
        { ipAddress: req.ip, deviceInfo: req.headers['user-agent'] }
      );
      return success(res, {
        message: 'Login successful',
        data:    result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return error(res, { message: 'Refresh token is required', status: 400 });
      const tokens = await AuthService.refreshToken(refreshToken);
      return success(res, { message: 'Token refreshed', data: tokens });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(req.user.id, refreshToken);
      return success(res, { message: 'Logged out successfully', data: null });
    } catch (err) {
      next(err);
    }
  }

  static async logoutAll(req, res, next) {
    try {
      await AuthService.logoutAll(req.user.id);
      return success(res, { message: 'Logged out from all devices', data: null });
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) return error(res, { message: 'Verification token is required', status: 400 });
      const user = await AuthService.verifyEmail(token);
      return success(res, { message: 'Email verified successfully', data: { user } });
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req, res, next) {
    try {
      await AuthService.resendVerification(req.user.id);
      return success(res, { message: 'Verification email sent', data: null });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email, req.ip);
      // Always return success to avoid user enumeration
      return success(res, {
        message: 'If an account with that email exists, a password reset link has been sent.',
        data:    null,
      });
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);
      return success(res, { message: 'Password reset successfully. Please log in.', data: null });
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      return success(res, { message: 'Password changed successfully. All sessions have been revoked.', data: null });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res) {
    return success(res, { message: 'Current user', data: { user: req.user } });
  }
}

module.exports = AuthController;
