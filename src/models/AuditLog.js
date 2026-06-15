const { query } = require('../config/database');

class AuditLog {
  static async log({ userId, action, entity, entityId, metadata, ipAddress, userAgent }) {
    try {
      await query(`
        INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId    || null,
        action,
        entity    || null,
        entityId  || null,
        JSON.stringify(metadata || {}),
        ipAddress || null,
        userAgent || null,
      ]);
    } catch (err) {
      // Never crash the app for audit log failures
    }
  }
}

module.exports = AuditLog;
