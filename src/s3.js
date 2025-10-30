// src/s3.js
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET;

// Create the client only outside of tests (avoids sockets in CI)
const s3 = process.env.NODE_ENV === 'test' ? null : new S3Client({ region: REGION });

// Upload a buffer to S3 at key, with optional contentType
export async function uploadToS3(key, buffer, contentType = 'application/octet-stream') {
  if (process.env.NODE_ENV === 'test') return { ETag: 'test-etag' }; // no-op in tests
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });
  return s3.send(cmd);
}

// Delete an object by key
export async function deleteImageFromS3(key) {
  if (process.env.NODE_ENV === 'test') return; // no-op in tests
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(cmd);
}

// Head-object (exists/metadata)
export async function headObject(key) {
  if (process.env.NODE_ENV === 'test') return { ContentLength: 1 }; // pretend exists in tests
  const cmd = new HeadObjectCommand({ Bucket: BUCKET, Key: key });
  return s3.send(cmd);
}

// Optional: default export, if any code imports default
export default { uploadToS3, deleteImageFromS3, headObject };
