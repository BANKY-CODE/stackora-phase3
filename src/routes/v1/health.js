const router  = require('express').Router();
const { testConnection } = require('../../config/database');
const { success }        = require('../../utils/response');
const config             = require('../../config/env');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/', async (req, res) => {
  const dbOk = await testConnection().catch(() => false);
  return success(res, {
    message: 'Stackora API is running 🚀',
    data: {
      platform:       'Stackora',
      version:        '2.0.0',
      environment:    config.env,
      apiBase:        `/api/${config.server.apiVersion}`,
      uptime_seconds: Math.floor(process.uptime()),
      database:       dbOk ? 'connected' : 'unreachable',
      timestamp:      new Date().toISOString(),
      docs:           `/api/${config.server.apiVersion}/docs`,
    },
  });
});

module.exports = router;
