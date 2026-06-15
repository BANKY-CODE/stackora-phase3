const swaggerJsdoc = require('swagger-jsdoc');
const config       = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Stackora API',
      version:     '3.0.0',
      description: 'Stackora Backend API — Phase 3: Authentication & User Management',
      contact: { name: 'Stackora Team', email: 'support@stackora.ng' },
    },
    servers: [
      { url: `http://localhost:${config.server.port}/api/${config.server.apiVersion}`, description: 'Development server' },
      { url: `https://api.stackora.ng/api/${config.server.apiVersion}`, description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
          description:  'Enter your access token. Get one from POST /auth/login',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success:   { type: 'boolean', example: true },
            message:   { type: 'string' },
            data:      { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success:   { type: 'boolean', example: false },
            message:   { type: 'string' },
            errors:    { type: 'array', items: { type: 'object' } },
            requestId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' }, page: { type: 'integer' },
            limit: { type: 'integer' }, totalPages: { type: 'integer' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:               { type: 'string', format: 'uuid' },
            username:         { type: 'string' },
            email:            { type: 'string', format: 'email' },
            firstName:        { type: 'string' },
            lastName:         { type: 'string' },
            bio:              { type: 'string' },
            phone:            { type: 'string' },
            country:          { type: 'string' },
            isActive:         { type: 'boolean' },
            isEmailVerified:  { type: 'boolean' },
            roles:            { type: 'array', items: { type: 'string' } },
            lastLoginAt:      { type: 'string', format: 'date-time' },
            createdAt:        { type: 'string', format: 'date-time' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            user:         { '$ref': '#/components/schemas/User' },
            accessToken:  { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn:    { type: 'string', example: '15m' },
          },
        },
      },
      parameters: {
        PageParam:  { in: 'query', name: 'page',  schema: { type: 'integer', default: 1 },   description: 'Page number' },
        LimitParam: { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 },  description: 'Items per page' },
        IdParam:    { in: 'path',  name: 'id', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Resource UUID' },
      },
    },
    tags: [
      { name: 'Health',      description: 'API health and status' },
      { name: 'Auth',        description: 'Authentication — register, login, tokens, password' },
      { name: 'Users',       description: 'User profile and account management' },
      { name: 'Academy',     description: 'Cybersecurity courses (Phase 4)' },
      { name: 'Marketplace', description: 'Digital products (Phase 4)' },
      { name: 'Community',   description: 'Posts and groups (Phase 4)' },
      { name: 'Wallet',      description: 'Fintech and VTU (Phase 5)' },
      { name: 'Analytics',   description: 'Platform analytics (Phase 5)' },
      { name: 'AI',          description: 'AI assistant (Phase 6)' },
    ],
  },
  apis: ['./src/routes/v1/*.js'],
};

module.exports = swaggerJsdoc(options);
