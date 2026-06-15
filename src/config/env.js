require('dotenv').config();

const config = {
  env:   process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  server: {
    port:       parseInt(process.env.PORT, 10) || 5000,
    apiVersion: process.env.API_VERSION || 'v1',
    appUrl:     process.env.APP_URL || 'http://localhost:3000',
    apiUrl:     process.env.API_URL || 'http://localhost:5000',
  },

  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    name:     process.env.DB_NAME     || 'stackora_db',
    user:     process.env.DB_USER     || 'stackora_user',
    password: process.env.DB_PASSWORD || '',
    ssl:      process.env.DB_SSL === 'true',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    },
  },

  jwt: {
    accessSecret:  process.env.JWT_ACCESS_SECRET  || 'fallback_access_secret_dev_only',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dev_only',
    accessExpires:  process.env.JWT_ACCESS_EXPIRES  || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host:    process.env.SMTP_HOST || 'smtp.gmail.com',
    port:    parseInt(process.env.SMTP_PORT, 10) || 587,
    user:    process.env.SMTP_USER || '',
    pass:    process.env.SMTP_PASS || '',
    from:    process.env.EMAIL_FROM || 'Stackora <noreply@stackora.ng>',
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
      .split(',').map(o => o.trim()),
  },

  rateLimit: {
    windowMs:    parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)    || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    dir:   process.env.LOG_DIR   || 'logs',
  },

  swagger: { enabled: process.env.SWAGGER_ENABLED !== 'false' },
};

module.exports = config;
