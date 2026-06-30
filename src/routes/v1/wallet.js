const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth/authenticate');
const { walletLimiter, strictLimiter } = require('../../middleware/rateLimiter');
const { uuidParam, paginationQuery, walletAmount, serviceType } = require('../../validators/common');
const { success, created, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const walletService = require('../../services/walletService');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Fintech, VTU services, and transaction management
 *
 * /wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 */
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
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: List wallet transactions
 *     tags: [Wallet]
 */
router.get('/transactions', authenticate, paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Transactions fetched' });
});

/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund wallet
 *     tags: [Wallet]
 */
router.post('/fund', authenticate, walletLimiter, [walletAmount], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', amount: req.body.amount, status: 'pending' },
    message: 'Wallet funding initiated (placeholder)',
  });
});

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Withdraw from wallet
 *     tags: [Wallet]
 */
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

/**
 * @swagger
 * /wallet/transfer:
 *   post:
 *     summary: Transfer to another user
 *     tags: [Wallet]
 */
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
    return created(res, {
      message: 'Transfer successful',
      data: result,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
});

/**
 * @swagger
 * /wallet/vtu:
 *   post:
 *     summary: Purchase a VTU service (airtime, data, bills)
 *     tags: [Wallet]
 */
router.post('/vtu', authenticate, walletLimiter, [serviceType, walletAmount], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', serviceType: req.body.serviceType, status: 'pending' },
    message: 'VTU service initiated (placeholder)',
  });
});

module.exports = router;
