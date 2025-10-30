// src/s3.js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { timePromise } from './metrics.js';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function s3Put(params) {
  return timePromise('s3.PutObject.duration_ms', s3.send(new PutObjectCommand(params)));
}

export async function s3Get(params) {
  return timePromise('s3.GetObject.duration_ms', s3.send(new GetObjectCommand(params)));
}

export async function s3Delete(params) {
  return timePromise('s3.DeleteObject.duration_ms', s3.send(new DeleteObjectCommand(params)));
}
