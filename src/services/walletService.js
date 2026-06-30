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
  const found = await query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );
  if (found.rows.length > 0) {
    return found.rows[0];
  }

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

/**
 * Find a user by their username (case-insensitive).
 * Returns { id, username } or null if not found.
 */
async function findUserByUsername(username) {
  const clean = String(username || '').trim().replace(/^@/, '');
  const result = await query(
    'SELECT id, username FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1',
    [clean]
  );
  return result.rows[0] || null;
}

/**
 * Transfer money from one user to another (wallet-to-wallet).
 * amountKobo must be a positive integer (whole kobo).
 * Runs as one atomic DB transaction: either everything succeeds or nothing changes.
 * Records TWO transaction rows — a debit for the sender, a credit for the receiver.
 */
async function transfer(senderId, recipientUsername, amountKobo, note) {
  // --- Validate amount ---
  amountKobo = Number(amountKobo);
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    const e = new Error('Invalid amount'); e.status = 400; throw e;
  }

  // --- Find recipient ---
  const recipient = await findUserByUsername(recipientUsername);
  if (!recipient) {
    const e = new Error('Recipient not found'); e.status = 404; throw e;
  }
  if (recipient.id === senderId) {
    const e = new Error('You cannot send money to yourself'); e.status = 400; throw e;
  }

  // Make sure both wallets exist before we open the transaction
  await getOrCreateWallet(senderId);
  await getOrCreateWallet(recipient.id);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the sender's wallet row so two transfers can't race
    const senderRes = await client.query(
      'SELECT balance, is_frozen FROM wallets WHERE user_id = $1 FOR UPDATE',
      [senderId]
    );
    const sender = senderRes.rows[0];

    if (sender.is_frozen) {
      const e = new Error('Your wallet is frozen'); e.status = 403; throw e;
    }
    if (Number(sender.balance) < amountKobo) {
      const e = new Error('Insufficient balance'); e.status = 400; throw e;
    }

    // Deduct from sender
    const newSender = await client.query(
      'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2 RETURNING balance',
      [amountKobo, senderId]
    );
    const senderBalanceAfter = Number(newSender.rows[0].balance);

    // Credit recipient
    const newRecipient = await client.query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 RETURNING balance',
      [amountKobo, recipient.id]
    );
    const recipientBalanceAfter = Number(newRecipient.rows[0].balance);

    // Record sender's debit row
    const senderRef = generateReference('SND');
    await client.query(
      `INSERT INTO transactions
         (user_id, type, direction, amount, balance_after, status, reference, counterparty_id, description)
       VALUES ($1, 'transfer', 'debit', $2, $3, 'success', $4, $5, $6)`,
      [senderId, amountKobo, senderBalanceAfter, senderRef, recipient.id, note || `Sent to @${recipient.username}`]
    );

    // Record recipient's credit row
    const recipientRef = generateReference('RCV');
    await client.query(
      `INSERT INTO transactions
         (user_id, type, direction, amount, balance_after, status, reference, counterparty_id, description)
       VALUES ($1, 'transfer', 'credit', $2, $3, 'success', $4, $5, $6)`,
      [recipient.id, amountKobo, recipientBalanceAfter, recipientRef, senderId, note || `Received from sender`]
    );

    await client.query('COMMIT');

    return {
      reference:         senderRef,
      amountKobo,
      amountNaira:       amountKobo / 100,
      recipient:         recipient.username,
      balanceAfterKobo:  senderBalanceAfter,
      balanceAfterNaira: senderBalanceAfter / 100,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  generateReference,
  getOrCreateWallet,
  getBalance,
  findUserByUsername,
  transfer,
};
