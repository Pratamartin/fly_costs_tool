export default {
  NODE_ENV: 'test',
  PORT: 3001,
  LOG_LEVEL: 'silent',
  JWT_SECRET: 'test-secret',
  JWT_EXPIRES_IN: 3600,
  SALT_ROUNDS: 1,
  ALLOWED_ORIGINS: ['http://localhost:3000'],
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/flycostsdb',
  FRONTEND_URL: 'http://localhost:3000',
}
