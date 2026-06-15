# Stackora Backend — Phase 3
> Authentication & User Management System

## New in Phase 3
- 7 database tables (users, roles, user_roles, refresh_tokens, email_verifications, password_resets, audit_logs)
- JWT access + refresh token system with rotation
- bcrypt password hashing (12 rounds)
- 5 roles: user, instructor, vendor, moderator, admin
- 11 auth endpoints + 6 user management endpoints
- Email verification + password reset workflows
- Account lockout after 5 failed attempts
- Audit logging for all auth events
- Full Swagger documentation with Bearer auth

## Run
```
npm install
npm run dev
```
Open: http://localhost:5000/api/v1/docs

## Test in Swagger
1. POST /auth/register
2. POST /auth/login → copy accessToken
3. Click Authorize button → paste token
4. Try GET /auth/me
