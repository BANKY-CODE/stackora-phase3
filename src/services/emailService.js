const nodemailer = require('nodemailer');
const config     = require('../config/env');
const logger     = require('../utils/logger');

class EmailService {

  static getTransporter() {
    if (!config.email.enabled) return null;
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass },
    });
  }

  static async send({ to, subject, html, text }) {
    if (!config.email.enabled) {
      logger.info(`[EMAIL - DEV MODE] To: ${to} | Subject: ${subject}`);
      logger.info(`[EMAIL CONTENT]: ${text || html}`);
      return { messageId: 'dev-mode' };
    }
    const transporter = EmailService.getTransporter();
    const info = await transporter.sendMail({
      from: config.email.from,
      to, subject, html, text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  }

  // ── Templates ───────────────────────────────────────────────

  static async sendVerificationEmail(user, token) {
    const url = `${config.server.appUrl}/verify-email?token=${token}`;
    return EmailService.send({
      to:      user.email,
      subject: 'Verify your Stackora account',
      text:    `Hi ${user.first_name || user.username},\n\nVerify your email: ${url}\n\nThis link expires in 24 hours.`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#6c5ce7">Welcome to Stackora!</h2>
          <p>Hi <strong>${user.first_name || user.username}</strong>,</p>
          <p>Click the button below to verify your email address.</p>
          <a href="${url}" style="display:inline-block;padding:12px 28px;background:#6c5ce7;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;margin:16px 0">
            Verify Email
          </a>
          <p style="color:#999;font-size:13px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">Stackora · Africa's Digital Ecosystem</p>
        </div>
      `,
    });
  }

  static async sendPasswordResetEmail(user, token) {
    const url = `${config.server.appUrl}/reset-password?token=${token}`;
    return EmailService.send({
      to:      user.email,
      subject: 'Reset your Stackora password',
      text:    `Hi ${user.first_name || user.username},\n\nReset your password: ${url}\n\nThis link expires in 1 hour.`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#6c5ce7">Password Reset</h2>
          <p>Hi <strong>${user.first_name || user.username}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${url}" style="display:inline-block;padding:12px 28px;background:#6c5ce7;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#999;font-size:13px">If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">Stackora · Africa's Digital Ecosystem</p>
        </div>
      `,
    });
  }

  static async sendWelcomeEmail(user) {
    return EmailService.send({
      to:      user.email,
      subject: 'Welcome to Stackora 🚀',
      text:    `Welcome to Stackora, ${user.first_name || user.username}! Your account is ready.`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#6c5ce7">You're in! 🚀</h2>
          <p>Hi <strong>${user.first_name || user.username}</strong>,</p>
          <p>Your Stackora account is verified and ready. You can now access all modules — Academy, Marketplace, Wallet, Community, and more.</p>
          <a href="${config.server.appUrl}/dashboard" style="display:inline-block;padding:12px 28px;background:#f6c90e;color:#0a0a1f;border-radius:999px;text-decoration:none;font-weight:700;margin:16px 0">
            Go to Dashboard →
          </a>
          <hr style="border:none;border-top:1px solid #eee">
          <p style="color:#999;font-size:12px">Stackora · Africa's Digital Ecosystem</p>
        </div>
      `,
    });
  }
}

module.exports = EmailService;
