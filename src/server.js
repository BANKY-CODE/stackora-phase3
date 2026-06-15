const app    = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/database');

const PORT    = config.server.port;
const API_VER = config.server.apiVersion;

async function start() {
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('  Stackora API — Phase 3');
  logger.info('  Auth & User Management System');
  logger.info(`  Environment : ${config.env}`);
  logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await testConnection();

  const server = app.listen(PORT, () => {
    logger.info(`✅ Server running   → http://localhost:${PORT}`);
    logger.info(`🔀 API base         → http://localhost:${PORT}/api/${API_VER}`);
    logger.info(`❤️  Health check     → http://localhost:${PORT}/api/${API_VER}/health`);
    logger.info(`🔐 Auth endpoints   → http://localhost:${PORT}/api/${API_VER}/auth`);
    logger.info(`📖 Swagger docs     → http://localhost:${PORT}/api/${API_VER}/docs`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (!config.isDev || true) {
      logger.info('💡 DB not required to start — runs in mock mode');
      logger.info('   To enable DB: update .env and run: npm run migrate');
    }
  });

  const shutdown = (signal) => {
    logger.info(`${signal} — shutting down…`);
    server.close(() => { logger.info('Closed'); process.exit(0); });
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (r) => logger.error('Unhandled rejection:', r));
  process.on('uncaughtException',  (e) => { logger.error('Uncaught exception:', e); process.exit(1); });
}

start();
