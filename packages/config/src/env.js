const { z } = require('zod');

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  APP_URL: z.string().url().default('http://localhost:8081'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  UPLOAD_PROVIDER: z.enum(['cloudinary', 's3']).default('cloudinary'),
  UPLOAD_MAX_FILE_SIZE_MB: z.coerce.number().positive().max(25).default(12),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default('oficios'),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.string().url().optional(),
  S3_UPLOAD_PREFIX: z.string().default('oficios'),
  SELECTION_TIMEOUT_HOURS: z.coerce.number().positive().default(24),
});

const mobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
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
