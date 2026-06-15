const router   = require('express').Router();
const { body } = require('express-validator');
const validate = require('../../middleware/validate');
const { strictLimiter } = require('../../middleware/rateLimiter');
const { success } = require('../../utils/response');

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI assistant endpoints — implementation pending Phase 6
 *
 * /ai/chat:
 *   post:
 *     summary: Send a message to the AI assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, maxLength: 2000 }
 *               context: { type: string, enum: [general, academy, marketplace, wallet] }
 *     responses:
 *       200:
 *         description: AI response
 *       503:
 *         description: AI not yet implemented
 */
router.post('/chat', strictLimiter, [
  body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be 1–2000 characters'),
  body('context').optional().isIn(['general', 'academy', 'marketplace', 'wallet']),
], validate, (req, res) => {
  return success(res, {
    message: 'AI assistant — coming in Phase 6',
    data: {
      reply:     'AI integration is not yet implemented. Check back in Phase 6.',
      status:    'placeholder',
      requestId: req.id,
    },
  });
});

/**
 * @swagger
 * /ai/recommendations:
 *   get:
 *     summary: Get personalised recommendations
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Recommendations
 */
router.get('/recommendations', (req, res) => {
  return success(res, {
    message: 'AI recommendations — coming in Phase 6',
    data: { courses: [], products: [], communities: [] },
  });
});

/**
 * @swagger
 * /ai/summarise:
 *   post:
 *     summary: Summarise content using AI
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Summary
 */
router.post('/summarise', strictLimiter, [
  body('content').trim().isLength({ min: 50 }).withMessage('Content too short to summarise'),
], validate, (req, res) => {
  return success(res, {
    message: 'AI summarisation — coming in Phase 6',
    data: { summary: null, status: 'placeholder' },
  });
});

module.exports = router;
