const bcrypt       = require('bcryptjs');
const UserModel    = require('../models/User');
const TokenModel   = require('../models/Token');
const JwtService   = require('./jwtService');
const EmailService = require('./emailService');
const AuditLog     = require('../models/AuditLog');
const config       = require('../config/env');
const logger       = require('../utils/logger');

const SALT_ROUNDS = 12;

class AuthService {

  // ── Register ────────────────────────────────────────────────
  static async register({ username, email, password, firstName, lastName, country }, ipAddress) {
    // Check for existing email/username
    const existingEmail    = await UserModel.findByEmail(email);
    if (existingEmail) throw Object.assign(new Error('Email already in use'), { status: 409 });

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) throw Object.assign(new Error('Username already taken'), { status: 409 });

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await UserModel.create({ username, email, passwordHash, firstName, lastName, country });

    // Assign default 'user' role
    await UserModel.assignRole(user.id, 'user');

    // Send email verification
    const verifyToken = await TokenModel.createEmailVerificationToken(user.id);
    await EmailService.sendVerificationEmail(user, verifyToken);

    await AuditLog.log({ userId: user.id, action: 'user.register', entity: 'users', entityId: user.id, ipAddress });

    logger.info(`New user registered: ${user.email}`);
    return UserModel.sanitize(user);
  }

  // ── Login ───────────────────────────────────────────────────
  static async login({ email, password }, { ipAddress, deviceInfo } = {}) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

    // Check if account is active
    if (!user.is_active) throw Object.assign(new Error('Account is deactivated'), { status: 403 });

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const mins = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      throw Object.assign(new Error(`Account locked. Try again in ${mins} minute(s)`), { status: 423 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await UserModel.incrementLoginAttempts(user.id);
      throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    }

    // Record successful login
    await UserModel.recordLogin(user.id, ipAddress);

    // Generate tokens
    const tokenPayload = { sub: user.id, email: user.email, roles: user.roles };
    const accessToken  = JwtService.signAccess(tokenPayload);
    const refreshExpiry = JwtService.expiryDate(config.jwt.refreshExpires);
    const refreshTokenRaw = await TokenModel.createRefreshToken(user.id, {
      expiresAt: refreshExpiry,
      deviceInfo,
      ipAddress,
    });

    await AuditLog.log({ userId: user.id, action: 'user.login', entity: 'users', entityId: user.id, ipAddress });

    return {
      user:         UserModel.sanitize(user),
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn:    config.jwt.accessExpires,
    };
  }

  // ── Refresh Access Token ─────────────────────────────────────
  static async refreshToken(rawRefreshToken) {
    // Validate the stored token record
    const tokenRecord = await TokenModel.findRefreshToken(rawRefreshToken);
    if (!tokenRecord) throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });

    // Verify JWT signature
    let payload;
    try {
      payload = JwtService.verifyRefresh(rawRefreshToken);
    } catch {
      await TokenModel.revokeRefreshToken(rawRefreshToken);
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }

    const user = await UserModel.findById(tokenRecord.user_id);
    if (!user || !user.is_active) {
      throw Object.assign(new Error('User not found or inactive'), { status: 401 });
    }

    // Rotate: revoke old, issue new
    await TokenModel.revokeRefreshToken(rawRefreshToken);
    const newAccessToken = JwtService.signAccess({ sub: user.id, email: user.email, roles: user.roles });
    const refreshExpiry  = JwtService.expiryDate(config.jwt.refreshExpires);
    const newRefreshRaw  = await TokenModel.createRefreshToken(user.id, {
      expiresAt:  refreshExpiry,
      deviceInfo: tokenRecord.device_info,
      ipAddress:  tokenRecord.ip_address,
    });

    return {
      accessToken:  newAccessToken,
      refreshToken: newRefreshRaw,
      expiresIn:    config.jwt.accessExpires,
    };
  }

  // ── Logout ──────────────────────────────────────────────────
  static async logout(userId, rawRefreshToken) {
    if (rawRefreshToken) {
      await TokenModel.revokeRefreshToken(rawRefreshToken);
    }
    await AuditLog.log({ userId, action: 'user.logout', entity: 'users', entityId: userId });
  }

  // ── Logout All Devices ──────────────────────────────────────
  static async logoutAll(userId) {
    await TokenModel.revokeAllUserRefreshTokens(userId);
    await AuditLog.log({ userId, action: 'user.logout_all', entity: 'users', entityId: userId });
  }

  // ── Verify Email ────────────────────────────────────────────
  static async verifyEmail(token) {
    const record = await TokenModel.findEmailVerificationToken(token);
    if (!record) throw Object.assign(new Error('Invalid or expired verification token'), { status: 400 });

    await UserModel.verifyEmail(record.user_id);
    await TokenModel.markEmailVerificationUsed(token);

    const user = await UserModel.findById(record.user_id);
    await EmailService.sendWelcomeEmail(user);
    await AuditLog.log({ userId: record.user_id, action: 'user.email_verified', entity: 'users', entityId: record.user_id });

    return UserModel.sanitize(user);
  }

  // ── Resend Verification Email ────────────────────────────────
  static async resendVerification(userId) {
    const user = await UserModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    if (user.is_email_verified) throw Object.assign(new Error('Email already verified'), { status: 400 });

    const token = await TokenModel.createEmailVerificationToken(userId);
    await EmailService.sendVerificationEmail(user, token);
  }

  // ── Forgot Password ──────────────────────────────────────────
  static async forgotPassword(email, ipAddress) {
    const user = await UserModel.findByEmail(email);
    // Always return success to avoid user enumeration
    if (!user || !user.is_active) return;

    const token = await TokenModel.createPasswordResetToken(user.id, ipAddress);
    await EmailService.sendPasswordResetEmail(user, token);
    await AuditLog.log({ userId: user.id, action: 'user.password_reset_requested', ipAddress });

    logger.info(`Password reset requested for: ${user.email}`);
  }

  // ── Reset Password ───────────────────────────────────────────
  static async resetPassword(token, newPassword) {
    const record = await TokenModel.findPasswordResetToken(token);
    if (!record) throw Object.assign(new Error('Invalid or expired reset token'), { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword(record.user_id, passwordHash);
    await TokenModel.markPasswordResetUsed(token);
    await TokenModel.revokeAllUserRefreshTokens(record.user_id);
    await AuditLog.log({ userId: record.user_id, action: 'user.password_reset', entity: 'users', entityId: record.user_id });

    logger.info(`Password reset completed for user: ${record.user_id}`);
  }

  // ── Change Password ──────────────────────────────────────────
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await UserModel.findById(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 400 });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserModel.updatePassword(userId, passwordHash);
    await TokenModel.revokeAllUserRefreshTokens(userId);
    await AuditLog.log({ userId, action: 'user.password_changed', entity: 'users', entityId: userId });
  }
}

module.exports = AuthService;
