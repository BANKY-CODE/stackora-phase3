/**
 * Stackora Phase 3 — Database Migration
 * Creates all authentication, user management, and wallet tables.
 * Run: node src/database/migrate.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const logger  = require('../utils/logger');



const migrations = [

  // ── 1. Roles ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS roles (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB       NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 2. Users ────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username            VARCHAR(30) NOT NULL UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    avatar_url          TEXT,
    bio                 TEXT,
    phone               VARCHAR(20),
    country             VARCHAR(100) DEFAULT 'Nigeria',
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN NOT NULL DEFAULT FALSE,
    is_2fa_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at       TIMESTAMPTZ,
    last_login_ip       VARCHAR(45),
    login_attempts      INTEGER NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 3. User Roles (junction) ─────────────────────────────────
  `CREATE TABLE IF NOT EXISTS user_roles (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id    UUID        NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID        REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
  )`,

  // ── 4. Refresh Tokens ────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address  VARCHAR(45),
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 5. Email Verifications ───────────────────────────────────
  `CREATE TABLE IF NOT EXISTS email_verifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 6. Password Resets ───────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS password_resets (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 7. Audit Log ─────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(100) NOT NULL,
    entity     VARCHAR(100),
    entity_id  UUID,
    metadata   JSONB        DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 8. Wallets ───────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS wallets (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance     BIGINT      NOT NULL DEFAULT 0,
    currency    VARCHAR(3)  NOT NULL DEFAULT 'NGN',
    is_frozen   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

  // ── 9. Transactions ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS transactions (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(20)  NOT NULL,
    direction       VARCHAR(6)   NOT NULL,
    amount          BIGINT       NOT NULL,
    balance_after   BIGINT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
    currency        VARCHAR(3)   NOT NULL DEFAULT 'NGN',
    reference       VARCHAR(100) NOT NULL UNIQUE,
    provider        VARCHAR(30),
    provider_ref    VARCHAR(150),
    counterparty_id UUID         REFERENCES users(id) ON DELETE SET NULL,
    description     TEXT,
    metadata        JSONB        NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  )`,

  // ── Indexes ──────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
  `CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_password_resets_hash ON password_resets(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_email_verifications_hash ON email_verifications(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference)`,

  // ── updated_at trigger ───────────────────────────────────────
  `CREATE OR REPLACE FUNCTION update_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
   $$ LANGUAGE plpgsql`,

  `DROP TRIGGER IF EXISTS set_updated_at ON users`,
  `CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
   FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,

  `DROP TRIGGER IF EXISTS set_updated_at ON roles`,
  `CREATE TRIGGER set_updated_at BEFORE UPDATE ON roles
   FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,

  `DROP TRIGGER IF EXISTS set_updated_at ON wallets`,
  `CREATE TRIGGER set_updated_at BEFORE UPDATE ON wallets
   FOR EACH ROW EXECUTE FUNCTION update_updated_at()`,
];

// ── Seed default roles ────────────────────────────────────────
const seedRoles = `
  INSERT INTO roles (name, description, permissions) VALUES
    ('user',       'Standard platform user',              '["read:own","write:own"]'),
    ('instructor', 'Academy course instructor',           '["read:own","write:own","create:course","manage:course"]'),
    ('vendor',     'Marketplace product seller',          '["read:own","write:own","create:product","manage:product"]'),
    ('moderator',  'Community and content moderator',     '["read:all","moderate:community","manage:reports"]'),
    ('admin',      'Full platform administrator',         '["read:all","write:all","manage:users","manage:platform"]')
  ON CONFLICT (name) DO NOTHING
`;

async function migrate() {
  const client = await pool.connect();
  try {
    logger.info('🔄 Running Phase 3 migrations…');
    await client.query('BEGIN');
    for (const sql of migrations) {
      await client.query(sql);
    }
    await client.query(seedRoles);
    await client.query('COMMIT');
    logger.info('✅ All migrations completed successfully');
    logger.info('✅ Default roles seeded: user, instructor, vendor, moderator, admin');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err.message);
  process.exit(1);
});
