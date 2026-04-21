const crypto = require('crypto');
const { env } = require('../config/env');
const { AppError } = require('../utils/app-error');

function slugifySegment(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sanitizeFileName(fileName, mimeType) {
  const safeName = String(fileName || 'upload')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (safeName.includes('.')) {
    return safeName.slice(0, 120);
  }

  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  return `${safeName || 'upload'}.${extension}`;
}

function buildUploadPath(scope, user) {
  const profileSegment = slugifySegment(user.professionalProfile?.id || user.id);
  const scopeSegment = slugifySegment(scope);

  return ['professionals', profileSegment, scopeSegment].join('/');
}

function signCloudinaryParams(params) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return crypto.createHash('sha1').update(`${serialized}${env.CLOUDINARY_API_SECRET}`).digest('hex');
}

function createCloudinaryImageUploadIntent({ scope, fileName, mimeType, user }) {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError('Cloudinary upload is not configured', 503);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const safeFileName = sanitizeFileName(fileName, mimeType);
  const folder = [env.CLOUDINARY_UPLOAD_FOLDER, buildUploadPath(scope, user)].filter(Boolean).join('/');
  const publicIdBase = safeFileName.replace(/\.[a-z0-9]+$/i, '');
  const publicId = `${publicIdBase}-${Date.now()}`;
  const tags = ['oficios', slugifySegment(scope), `user-${user.id}`].filter(Boolean).join(',');
  const context = `scope=${scope}|userId=${user.id}`;
  const signedParams = {
    context,
    folder,
    public_id: publicId,
    tags,
    timestamp,
  };

  return {
    provider: 'cloudinary',
    upload: {
      url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      method: 'POST',
      fileField: 'file',
      fields: {
        api_key: env.CLOUDINARY_API_KEY,
        context,
        folder,
        public_id: publicId,
        signature: signCloudinaryParams(signedParams),
        tags,
        timestamp: String(timestamp),
      },
    },
    resolve: {
      strategy: 'json-field',
      urlField: 'secure_url',
      idField: 'public_id',
      widthField: 'width',
      heightField: 'height',
    },
    constraints: {
      acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSizeMb: env.UPLOAD_MAX_FILE_SIZE_MB,
      maxFiles: 8,
    },
  };
}

function hmac(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest();
}

function getAwsSigningKey(secret, dateStamp, region) {
  const dateKey = hmac(`AWS4${secret}`, dateStamp);
  const regionKey = hmac(dateKey, region);
  const serviceKey = hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}

function createS3ImageUploadIntent({ scope, fileName, mimeType, user }) {
  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new AppError('S3 upload is not configured', 503);
  }

  const now = new Date();
  const safeFileName = sanitizeFileName(fileName, mimeType);
  const uploadPrefix = [env.S3_UPLOAD_PREFIX, buildUploadPath(scope, user)].filter(Boolean).join('/');
  const key = `${uploadPrefix}/${Date.now()}-${safeFileName}`;
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const credential = `${env.S3_ACCESS_KEY_ID}/${dateStamp}/${env.S3_REGION}/s3/aws4_request`;
  const expiration = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const contentType = mimeType || 'image/jpeg';
  const policy = {
    expiration,
    conditions: [
      { bucket: env.S3_BUCKET },
      { key },
      { 'Content-Type': contentType },
      { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
      { 'x-amz-credential': credential },
      { 'x-amz-date': amzDate },
      ['content-length-range', 1024, env.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024],
    ],
  };
  const encodedPolicy = Buffer.from(JSON.stringify(policy)).toString('base64');
  const signature = crypto
    .createHmac('sha256', getAwsSigningKey(env.S3_SECRET_ACCESS_KEY, dateStamp, env.S3_REGION))
    .update(encodedPolicy)
    .digest('hex');
  const publicBaseUrl = (env.S3_PUBLIC_BASE_URL || `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`).replace(
    /\/$/,
    '',
  );

  return {
    provider: 's3',
    upload: {
      url: `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`,
      method: 'POST',
      fileField: 'file',
      fields: {
        'Content-Type': contentType,
        key,
        policy: encodedPolicy,
        'x-amz-algorithm': 'AWS4-HMAC-SHA256',
        'x-amz-credential': credential,
        'x-amz-date': amzDate,
        'x-amz-signature': signature,
      },
    },
    resolve: {
      strategy: 'static',
      url: `${publicBaseUrl}/${key}`,
    },
    constraints: {
      acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSizeMb: env.UPLOAD_MAX_FILE_SIZE_MB,
      maxFiles: 8,
    },
  };
}

function createImageUploadIntent({ scope, fileName, mimeType, user }) {
  if (!user) {
    throw new AppError('Authenticated user required for upload intents', 401);
  }

  if (env.UPLOAD_PROVIDER === 'cloudinary') {
    return createCloudinaryImageUploadIntent({ scope, fileName, mimeType, user });
  }

  if (env.UPLOAD_PROVIDER === 's3') {
    return createS3ImageUploadIntent({ scope, fileName, mimeType, user });
  }

  throw new AppError('Unsupported upload provider', 500);
}

module.exports = {
  createImageUploadIntent,
};
