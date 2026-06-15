const { query } = require('../config/database');

class UserModel {

  /** Find user by ID (with roles) */
  static async findById(id) {
    const result = await query(`
      SELECT u.*,
        COALESCE(
          json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r       ON r.id = ur.role_id
      WHERE u.id = $1
      GROUP BY u.id
    `, [id]);
    return result.rows[0] || null;
  }

  /** Find user by email */
  static async findByEmail(email) {
    const result = await query(`
      SELECT u.*,
        COALESCE(
          json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]'
        ) AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r       ON r.id = ur.role_id
      WHERE LOWER(u.email) = LOWER($1)
      GROUP BY u.id
    `, [email]);
    return result.rows[0] || null;
  }

  /** Find user by username */
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1)',
      [username]
    );
    return result.rows[0] || null;
  }

  /** Create a new user */
  static async create({ username, email, passwordHash, firstName, lastName, country }) {
    const result = await query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, country)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [username, email, passwordHash, firstName || null, lastName || null, country || 'Nigeria']);
    return result.rows[0];
  }

  /** Assign a role to user */
  static async assignRole(userId, roleName, grantedBy = null) {
    const roleResult = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (!roleResult.rows[0]) throw new Error(`Role '${roleName}' not found`);
    const roleId = roleResult.rows[0].id;
    await query(`
      INSERT INTO user_roles (user_id, role_id, granted_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [userId, roleId, grantedBy]);
  }

  /** Update user fields */
  static async update(id, fields) {
    const allowed = ['first_name','last_name','bio','phone','avatar_url','country'];
    const sets = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
      if (allowed.includes(k)) { sets.push(`${k} = $${i++}`); vals.push(v); }
    }
    if (!sets.length) return null;
    vals.push(id);
    const result = await query(
      `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      vals
    );
    return result.rows[0];
  }

  /** Mark email as verified */
  static async verifyEmail(id) {
    await query(
      'UPDATE users SET is_email_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }

  /** Update password */
  static async updatePassword(id, passwordHash) {
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, id]
    );
  }

  /** Update login metadata */
  static async recordLogin(id, ip) {
    await query(`
      UPDATE users
      SET last_login_at = NOW(), last_login_ip = $1, login_attempts = 0
      WHERE id = $2
    `, [ip, id]);
  }

  /** Increment failed login attempts; lock if >= 5 */
  static async incrementLoginAttempts(id) {
    await query(`
      UPDATE users
      SET login_attempts = login_attempts + 1,
          locked_until = CASE
            WHEN login_attempts + 1 >= 5
            THEN NOW() + INTERVAL '30 minutes'
            ELSE locked_until
          END
      WHERE id = $1
    `, [id]);
  }

  /** Reset login attempts */
  static async resetLoginAttempts(id) {
    await query(
      'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = $1',
      [id]
    );
  }

  /** Deactivate account */
  static async deactivate(id) {
    await query(
      'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
      [id]
    );
  }

  /** List users (paginated) */
  static async findAll({ limit, offset, search } = {}) {
    let sql = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name,
             u.is_active, u.is_email_verified, u.created_at,
             COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r       ON r.id = ur.role_id
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      sql += ` WHERE u.username ILIKE $${params.length} OR u.email ILIKE $${params.length}`;
    }
    sql += ` GROUP BY u.id ORDER BY u.created_at DESC`;
    params.push(limit);  sql += ` LIMIT $${params.length}`;
    params.push(offset); sql += ` OFFSET $${params.length}`;
    const result = await query(sql, params);
    return result.rows;
  }

  /** Count users */
  static async count(search) {
    let sql = 'SELECT COUNT(*) FROM users';
    const params = [];
    if (search) { params.push(`%${search}%`); sql += ` WHERE username ILIKE $1 OR email ILIKE $1`; }
    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }

  /** Strip sensitive fields */
  static sanitize(user) {
    if (!user) return null;
    const { password_hash, login_attempts, locked_until, ...safe } = user;
    return safe;
  }
}

module.exports = UserModel;
