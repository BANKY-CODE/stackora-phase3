const rateLimit = require('express-rate-limit');
const config    = require('../config/env');
const logger    = require('../utils/logger');

// ── Global limiter (all routes) ──────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:   false,
    message:   'Too many requests — please try again later.',
    timestamp: new Date().toISOString(),
  },
  handler(req, res, next, options) {
    logger.warn(`Rate limit hit: ${req.ip} → ${req.method} ${req.originalUrl}`);
    res.status(429).json(options.message);
  },
});

// ── Strict limiter (write operations) ────────────────────────
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:   false,
    message:   'Too many requests on this endpoint — slow down.',
    timestamp: new Date().toISOString(),
  },
});

// ── VTU / wallet limiter (financial operations) ───────────────
const walletLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success:   false,
    message:   'Too many wallet requests — please wait a moment.',
    timestamp: new Date().toISOString(),
  },
});

module.exports = { globalLimiter, strictLimiter, walletLimiter };
