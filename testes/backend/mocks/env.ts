export default {
  NODE_ENV: 'test',
  PORT: 3001,
  LOG_LEVEL: 'silent',
  JWT_SECRET: 'test-secret',
  JWT_EXPIRES_IN: 3600,
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  REFRESH_TOKEN_EXPIRES_DAYS: 14,
  SALT_ROUNDS: 1,
  COOKIE_SAME_SITE: 'Lax',
  ALLOWED_ORIGINS: ['http://localhost:3000'],
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/flycostsdb',
  FRONTEND_URL: 'http://localhost:3000',
}
