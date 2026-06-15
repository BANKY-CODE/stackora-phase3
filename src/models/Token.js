const crypto = require('crypto');
const { query } = require('../config/database');

class TokenModel {

  // ── Helpers ────────────────────────────────────────────────
  static generateRaw() {
    return crypto.randomBytes(48).toString('hex');
  }

  static hash(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  // ── Refresh Tokens ─────────────────────────────────────────
  static async createRefreshToken(userId, { expiresAt, deviceInfo, ipAddress } = {}) {
    const raw  = TokenModel.generateRaw();
    const hash = TokenModel.hash(raw);
    await query(`
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, hash, expiresAt, deviceInfo || null, ipAddress || null]);
    return raw;
  }

  static async findRefreshToken(raw) {
    const hash = TokenModel.hash(raw);
    const result = await query(`
      SELECT * FROM refresh_tokens
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
    `, [hash]);
    return result.rows[0] || null;
  }

  static async revokeRefreshToken(raw) {
    const hash = TokenModel.hash(raw);
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
      [hash]
    );
  }

  static async revokeAllUserRefreshTokens(userId) {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  // ── Email Verification Tokens ──────────────────────────────
  static async createEmailVerificationToken(userId) {
    // Invalidate any existing tokens
    await query(
      'DELETE FROM email_verifications WHERE user_id = $1',
      [userId]
    );
    const raw  = TokenModel.generateRaw();
    const hash = TokenModel.hash(raw);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await query(`
      INSERT INTO email_verifications (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `, [userId, hash, expiresAt]);
    return raw;
  }

  static async findEmailVerificationToken(raw) {
    const hash = TokenModel.hash(raw);
    const result = await query(`
      SELECT * FROM email_verifications
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
    `, [hash]);
    return result.rows[0] || null;
  }

  static async markEmailVerificationUsed(raw) {
    const hash = TokenModel.hash(raw);
    await query(
      'UPDATE email_verifications SET used_at = NOW() WHERE token_hash = $1',
      [hash]
    );
  }

  // ── Password Reset Tokens ──────────────────────────────────
  static async createPasswordResetToken(userId, ipAddress) {
    // Invalidate any existing tokens
    await query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    const raw  = TokenModel.generateRaw();
    const hash = TokenModel.hash(raw);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await query(`
      INSERT INTO password_resets (user_id, token_hash, expires_at, ip_address)
      VALUES ($1, $2, $3, $4)
    `, [userId, hash, expiresAt, ipAddress || null]);
    return raw;
  }

  static async findPasswordResetToken(raw) {
    const hash = TokenModel.hash(raw);
    const result = await query(`
      SELECT * FROM password_resets
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
    `, [hash]);
    return result.rows[0] || null;
  }

  static async markPasswordResetUsed(raw) {
    const hash = TokenModel.hash(raw);
    await query(
      'UPDATE password_resets SET used_at = NOW() WHERE token_hash = $1',
      [hash]
    );
  }
}

module.exports = TokenModel;
