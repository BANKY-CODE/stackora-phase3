const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { strictLimiter } = require('../../middleware/rateLimiter');
const { uuidParam, paginationQuery } = require('../../validators/common');
const { success, created, paginated, notFound } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

/**
 * @swagger
 * tags:
 *   name: Community
 *   description: Posts, groups, discussions, and mentorship
 *
 * /community/posts:
 *   get:
 *     summary: List community posts
 *     tags: [Community]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated post list
 */
router.get('/posts', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Posts fetched' });
});

/**
 * @swagger
 * /community/posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Community]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 */
router.get('/posts/:id', uuidParam(), validate, (req, res) => {
  return notFound(res, 'Post');
});

/**
 * @swagger
 * /community/posts:
 *   post:
 *     summary: Create a post
 *     tags: [Community]
 *     responses:
 *       201:
 *         description: Post created
 */
router.post('/posts', strictLimiter, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5–200 characters'),
  body('body').trim().isLength({ min: 10 }).withMessage('Body must be at least 10 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
], validate, (req, res) => {
  return created(res, { data: { id: 'placeholder-uuid', ...req.body }, message: 'Post created (placeholder)' });
});

/**
 * @swagger
 * /community/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Community]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Post deleted
 */
router.delete('/posts/:id', uuidParam(), validate, (req, res) => {
  return success(res, { message: 'Post deleted (placeholder)', data: { id: req.params.id } });
});

/**
 * @swagger
 * /community/groups:
 *   get:
 *     summary: List community groups
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: List of groups
 */
router.get('/groups', paginationQuery, validate, (req, res) => {
  const { page, limit } = getPagination(req.query);
  return paginated(res, { data: [], total: 0, page, limit, message: 'Groups fetched' });
});

/**
 * @swagger
 * /community/leaderboard:
 *   get:
 *     summary: Community leaderboard
 *     tags: [Community]
 *     responses:
 *       200:
 *         description: Top community members
 */
router.get('/leaderboard', (req, res) => {
  return success(res, { message: 'Leaderboard fetched (placeholder)', data: [] });
});

module.exports = router;
