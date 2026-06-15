const jwt    = require('jsonwebtoken');
const config = require('../config/env');

class JwtService {

  /** Sign an access token (short-lived) */
  static signAccess(payload) {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpires,
      issuer:    'stackora',
      audience:  'stackora-client',
    });
  }

  /** Sign a refresh token (long-lived) */
  static signRefresh(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpires,
      issuer:    'stackora',
      audience:  'stackora-client',
    });
  }

  /** Verify an access token */
  static verifyAccess(token) {
    return jwt.verify(token, config.jwt.accessSecret, {
      issuer:   'stackora',
      audience: 'stackora-client',
    });
  }

  /** Verify a refresh token */
  static verifyRefresh(token) {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer:   'stackora',
      audience: 'stackora-client',
    });
  }

  /** Decode without verification (for expired token inspection) */
  static decode(token) {
    return jwt.decode(token);
  }

  /** Calculate expiry date from JWT expires string */
  static expiryDate(expiresIn) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [, num, unit] = match;
    const ms = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
    return new Date(Date.now() + parseInt(num) * ms);
  }
}

module.exports = JwtService;
