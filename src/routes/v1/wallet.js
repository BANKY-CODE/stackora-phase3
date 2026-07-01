const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth/authenticate');
const { walletLimiter, strictLimiter } = require('../../middleware/rateLimiter');
const { uuidParam, paginationQuery, walletAmount, serviceType } = require('../../validators/common');
const { success, created, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const walletService = require('../../services/walletService');
const { query } = require('../../config/database');

router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const result = await walletService.getBalance(req.user.id);
    return success(res, {
      message: 'Balance fetched',
      data: {
        balance:     result.balanceNaira,
        balanceKobo: result.balanceKobo,
        currency:    result.currency,
        isFrozen:    result.isFrozen,
      },
    });
  } catch (err) { next(err); }
});

// ──────────────────────────────────────────────────────────────
// ⚠️ TEMPORARY TEST ROUTE — DELETE BEFORE GOING LIVE
// ──────────────────────────────────────────────────────────────
router.post('/test-credit', authenticate, async (req, res, next) => {
  try {
    const amountKobo = Math.round(Number(req.body.amount) * 100);
    if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    await walletService.getOrCreateWallet(req.user.id);
    const updated = await query(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 RETURNING balance',
      [amountKobo, req.user.id]
    );
    const balanceKobo = Number(updated.rows[0].balance);
    const ref = walletService.generateReference('TST');
    await query(
      `INSERT INTO transactions
         (user_id, type, direction, amount, balance_after, status, reference, description)
       VALUES ($1, 'fund', 'credit', $2, $3, 'success', $4, 'Test credit')`,
      [req.user.id, amountKobo, balanceKobo, ref]
    );
    return success(res, {
      message: 'Test credit added',
      data: { balanceKobo, balanceNaira: balanceKobo / 100, reference: ref },
    });
  } catch (err) { next(err); }
});

router.get('/transactions', authenticate, paginationQuery, validate, async (req, res, next) => {
  try {
    const { page, limit } = getPagination(req.query);
    const offset = (page - 1) * limit;
    const { transactions, total } = await walletService.getTransactions(req.user.id, limit, offset);
    return paginated(res, { data: transactions, total, page, limit, message: 'Transactions fetched' });
  } catch (err) { next(err); }
});

router.post('/fund', authenticate, walletLimiter, [walletAmount], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', amount: req.body.amount, status: 'pending' },
    message: 'Wallet funding initiated (placeholder)',
  });
});

router.post('/withdraw', authenticate, walletLimiter, [
  walletAmount,
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('bankCode').notEmpty().withMessage('Bank code is required'),
], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', amount: req.body.amount, status: 'pending' },
    message: 'Withdrawal initiated (placeholder)',
  });
});

router.post('/transfer', authenticate, walletLimiter, [
  walletAmount,
  body('recipientUsername').notEmpty().withMessage('recipientUsername is required'),
], validate, async (req, res, next) => {
  try {
    const amountKobo = Math.round(Number(req.body.amount) * 100);
    const result = await walletService.transfer(
      req.user.id,
      req.body.recipientUsername,
      amountKobo,
      req.body.note
    );
    return created(res, { message: 'Transfer successful', data: result });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
});

router.post('/vtu', authenticate, walletLimiter, [serviceType, walletAmount], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', serviceType: req.body.serviceType, status: 'pending' },
    message: 'VTU service initiated (placeholder)',
  });
});

module.exports = router;
