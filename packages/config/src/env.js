const { z } = require('zod');

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  APP_URL: z.string().url().default('http://localhost:8081'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
});

const mobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
});

function parseApiEnv(env) {
  return apiEnvSchema.parse(env);
}

function parseMobileEnv(env) {
  return mobileEnvSchema.parse(env);
}

module.exports = {
  parseApiEnv,
  parseMobileEnv,
};
