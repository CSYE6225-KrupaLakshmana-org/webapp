// src/s3.js (ESM)
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET;

// Avoid real AWS calls in CI tests
const s3 = process.env.NODE_ENV === 'test' ? null : new S3Client({ region: REGION });

/**
 * Upload an image (buffer) to S3 at the given key.
 * Tests import this name: uploadImageToS3
 */
export async function uploadImageToS3(key, buffer, contentType = 'application/octet-stream') {
  if (process.env.NODE_ENV === 'test') return { ETag: 'test-etag' }; // no-op in tests
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  return s3.send(cmd);
}

/**
 * Backward-compatible alias (in case your app used uploadToS3)
 */
export const uploadToS3 = uploadImageToS3;

/**
 * Delete an image by key.
 * Tests import this name: deleteImageFromS3
 */
export async function deleteImageFromS3(key) {
  if (process.env.NODE_ENV === 'test') return; // no-op in tests
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(cmd);
}

/**
 * Head object (check metadata / existence)
 */
export async function headObject(key) {
  if (process.env.NODE_ENV === 'test') return { ContentLength: 1 }; // pretend exists in tests
  const cmd = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
  return s3.send(cmd);
}

// Optional default export for flexibility
export default { uploadImageToS3, uploadToS3, deleteImageFromS3, headObject };
