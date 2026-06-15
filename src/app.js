const express        = require('express');
const helmet         = require('helmet');
const cors           = require('cors');
const compression    = require('compression');
const morgan         = require('morgan');
const swaggerUi      = require('swagger-ui-express');

const config         = require('./config/env');
const swaggerSpec    = require('./config/swagger');
const logger         = require('./utils/logger');
const requestId      = require('./middleware/requestId');
const { globalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const v1Routes       = require('./routes/v1/index');

const app = express();

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: config.isDev ? false : undefined,
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin(origin, cb) {
    if (!origin || config.cors.allowedOrigins.includes(origin)) return cb(null, true);
    logger.warn(`CORS blocked: ${origin}`);
    cb(new Error(`Origin ${origin} not allowed`));
  },
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
}));

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request ID ────────────────────────────────────────────────
app.use(requestId);

// ── HTTP request logging ──────────────────────────────────────
app.use(morgan(config.isDev ? 'dev' : 'combined', { stream: logger.stream }));

// ── Rate limiting ─────────────────────────────────────────────
app.use(globalLimiter);

// ── API routes ────────────────────────────────────────────────
const apiBase = `/api/${config.server.apiVersion}`;
app.use(apiBase, v1Routes);

// ── Swagger UI ────────────────────────────────────────────────
if (config.swagger.enabled) {
  app.use(`${apiBase}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Stackora API Docs',
    customCss: '.swagger-ui .topbar { background: #6c5ce7; }',
    swaggerOptions: { persistAuthorization: true },
  }));
  logger.info(`📖 Swagger docs: http://localhost:${config.server.port}${apiBase}/docs`);
}

// ── Root route ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name:        'Stackora API',
    version:     '2.0.0',
    phase:       'Phase 2 — Infrastructure',
    apiBase,
    docs:        `${apiBase}/docs`,
    health:      `${apiBase}/health`,
    timestamp:   new Date().toISOString(),
  });
});

// ── 404 & error handlers (must be last) ──────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
