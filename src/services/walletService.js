/**
 * Stackora — Wallet Service
 * All real wallet money logic lives here.
 * Money is stored as whole kobo (₦1 = 100 kobo) using BIGINT.
 */

const { pool, query } = require('../config/database');
const crypto = require('crypto');

/**
 * Generate a unique transaction reference.
 * Example: STK-1719876543210-a1b2c3
 */
function generateReference(prefix = 'STK') {
  const time = Date.now();
  const rand = crypto.randomBytes(3).toString('hex');
  return `${prefix}-${time}-${rand}`;
}

/**
 * Get a user's wallet. Creates one automatically if it doesn't exist yet.
 * Returns the wallet row { id, user_id, balance, currency, is_frozen, ... }.
 */
async function getOrCreateWallet(userId) {
  // Try to find existing wallet
  const found = await query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );
  if (found.rows.length > 0) {
    return found.rows[0];
  }

  // None exists — create one. ON CONFLICT guards against a race where
  // two requests try to create the same wallet at the same time.
  const createdWallet = await query(
    `INSERT INTO wallets (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [userId]
  );
  return createdWallet.rows[0];
}

/**
 * Get a user's balance in kobo (integer) and naira (for display).
 */
async function getBalance(userId) {
  const wallet = await getOrCreateWallet(userId);
  return {
    balanceKobo:  Number(wallet.balance),
    balanceNaira: Number(wallet.balance) / 100,
    currency:     wallet.currency,
    isFrozen:     wallet.is_frozen,
  };
}

module.exports = {
  generateReference,
  getOrCreateWallet,
  getBalance,
};
