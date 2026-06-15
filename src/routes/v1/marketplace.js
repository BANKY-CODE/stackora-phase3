const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { strictLimiter } = require('../../middleware/rateLimiter');
const { uuidParam, paginationQuery, productPrice } = require('../../validators/common');
const { success, created, paginated, notFound } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

/**
 * @swagger
 * tags:
 *   name: Marketplace
 *   description: Digital products, listings, and orders
 *
 * /marketplace/products:
 *   get:
 *     summary: List all products
 *     tags: [Marketplace]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated product list
 */
router.get('/products', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Products fetched' });
});

/**
 * @swagger
 * /marketplace/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Marketplace]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/products/:id', uuidParam(), validate, (req, res) => {
  return notFound(res, 'Product');
});

/**
 * @swagger
 * /marketplace/products:
 *   post:
 *     summary: List a new product
 *     tags: [Marketplace]
 *     responses:
 *       201:
 *         description: Product listed
 */
router.post('/products', strictLimiter, [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 characters'),
  body('category').notEmpty().withMessage('Category is required'),
  productPrice,
], validate, (req, res) => {
  return created(res, { data: { id: 'placeholder-uuid', ...req.body }, message: 'Product listed (placeholder)' });
});

/**
 * @swagger
 * /marketplace/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Marketplace]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Product updated
 */
router.put('/products/:id', uuidParam(), validate, (req, res) => {
  return success(res, { message: 'Product updated (placeholder)', data: { id: req.params.id } });
});

/**
 * @swagger
 * /marketplace/products/{id}:
 *   delete:
 *     summary: Remove a product
 *     tags: [Marketplace]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Product removed
 */
router.delete('/products/:id', uuidParam(), validate, (req, res) => {
  return success(res, { message: 'Product removed (placeholder)', data: { id: req.params.id } });
});

/**
 * @swagger
 * /marketplace/orders:
 *   get:
 *     summary: List orders
 *     tags: [Marketplace]
 *     responses:
 *       200:
 *         description: Paginated order list
 */
router.get('/orders', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Orders fetched' });
});

/**
 * @swagger
 * /marketplace/categories:
 *   get:
 *     summary: List product categories
 *     tags: [Marketplace]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', (req, res) => {
  return success(res, {
    message: 'Categories fetched',
    data: ['templates', 'tools-scripts', 'accounts', 'courses', 'subscriptions', 'ebooks'],
  });
});

module.exports = router;
