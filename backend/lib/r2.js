const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const mockStore = new Map();

// Seed initial bill photo key for mock mode testing
mockStore.set('bills/s1/1785518400112-d6ez17.jpg', {
  buffer: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01]),
  contentType: 'image/jpeg',
  uploadedAt: '2026-08-01T00:00:00.000Z'
});

function isR2Configured() {
  if (process.env.R2_MOCK === 'false') {
    return Boolean(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );
  }
  return true;
}

function isMockMode() {
  if (process.env.R2_MOCK === 'false') return false;
  if (process.env.R2_MOCK === 'true') return true;
  return !Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

function getExt(contentType) {
  if (contentType === 'image/png') return '.png';
  if (contentType === 'image/webp') return '.webp';
  return '.jpg';
}

function getS3Client() {
  if (!process.env.R2_ACCOUNT_ID) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}

async function uploadBillPhoto(buffer, contentType, keyPrefix = 'bills') {
  if (!isR2Configured()) {
    throw new Error('R2 is not configured and R2_MOCK is not enabled');
  }

  const ext = getExt(contentType);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const timestamp = Date.now();
  const cleanPrefix = keyPrefix.replace(/^\/+|\/+$/g, '');
  const key = `${cleanPrefix}/${timestamp}-${randomSuffix}${ext}`;

  const publicBase = (process.env.R2_PUBLIC_URL_BASE || 'https://pub-mock.r2.dev').replace(/\/+$/, '');
  const publicUrl = `${publicBase}/${key}`;

  if (isMockMode()) {
    mockStore.set(key, {
      buffer,
      contentType,
      uploadedAt: new Date().toISOString()
    });
    return { key, publicUrl };
  }

  const s3 = getS3Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType
  });

  await s3.send(command);
  return { key, publicUrl };
}

async function getSignedReadUrl(key, expirySeconds = 3600) {
  const publicBase = (process.env.R2_PUBLIC_URL_BASE || 'https://pub-mock.r2.dev').replace(/\/+$/, '');

  if (process.env.R2_MOCK === 'true' || !process.env.R2_ACCOUNT_ID) {
    const exp = Date.now() + expirySeconds * 1000;
    return `${publicBase}/${key}?signed=true&expires=${exp}`;
  }

  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key
  });

  return await getSignedUrl(s3, command, { expiresIn: expirySeconds });
}

module.exports = {
  isR2Configured,
  uploadBillPhoto,
  getSignedReadUrl,
  mockStore
};
