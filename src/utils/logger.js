const winston = require('winston');
const path    = require('path');
const fs      = require('fs');
const config  = require('../config/env');

// Ensure logs directory exists
const logDir = path.resolve(config.logging.dir);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// ── Console format (dev) ──────────────────────────────────────
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack }) =>
    stack
      ? `[${ts}] ${level}: ${message}\n${stack}`
      : `[${ts}] ${level}: ${message}`
  )
);

// ── File format (JSON, structured) ───────────────────────────
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const transports = [
  new winston.transports.Console({ format: consoleFormat }),
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level:    'error',
    format:   fileFormat,
    maxsize:  10 * 1024 * 1024, // 10MB
    maxFiles: 5,
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format:   fileFormat,
    maxsize:  20 * 1024 * 1024,
    maxFiles: 5,
  }),
];

const logger = winston.createLogger({
  level:      config.logging.level,
  transports,
  exitOnError: false,
});

// Morgan stream adapter
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
