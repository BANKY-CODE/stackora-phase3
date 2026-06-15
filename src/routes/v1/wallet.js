const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { walletLimiter, strictLimiter } = require('../../middleware/rateLimiter');
const { uuidParam, paginationQuery, walletAmount, serviceType } = require('../../validators/common');
const { success, created, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

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
 *     responses:
 *       200:
 *         description: Current balance
 */
router.get('/balance', (req, res) => {
  return success(res, {
    message: 'Balance fetched (placeholder)',
    data: { balance: 0, currency: 'NGN', userId: 'placeholder-uuid' },
  });
});

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: List wallet transactions
 *     tags: [Wallet]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated transaction list
 */
router.get('/transactions', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Transactions fetched' });
});

/**
 * @swagger
 * /wallet/fund:
 *   post:
 *     summary: Fund wallet
 *     tags: [Wallet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, minimum: 100 }
 *     responses:
 *       201:
 *         description: Funding initiated
 */
router.post('/fund', walletLimiter, [walletAmount], validate, (req, res) => {
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
 *     responses:
 *       201:
 *         description: Withdrawal initiated
 */
router.post('/withdraw', walletLimiter, [
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
 *     responses:
 *       201:
 *         description: Transfer initiated
 */
router.post('/transfer', walletLimiter, [
  walletAmount,
  body('recipientId').isUUID().withMessage('recipientId must be a valid UUID'),
], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', amount: req.body.amount, status: 'pending' },
    message: 'Transfer initiated (placeholder)',
  });
});

/**
 * @swagger
 * /wallet/vtu:
 *   post:
 *     summary: Purchase a VTU service (airtime, data, bills)
 *     tags: [Wallet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceType, amount]
 *             properties:
 *               serviceType:
 *                 type: string
 *                 enum: [airtime, data, electricity, cable, water, sms, exam]
 *               amount: { type: number }
 *               phone:  { type: string }
 *               network: { type: string }
 *     responses:
 *       201:
 *         description: VTU transaction initiated
 */
router.post('/vtu', walletLimiter, [serviceType, walletAmount], validate, (req, res) => {
  return created(res, {
    data:    { reference: 'placeholder-ref', serviceType: req.body.serviceType, status: 'pending' },
    message: 'VTU service initiated (placeholder)',
  });
});

module.exports = router;
