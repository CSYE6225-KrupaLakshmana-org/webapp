import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function uploadImageToS3({ bucket, key, buffer, contentType, metadata }) {
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata || {},
  }));
}

export async function deleteImageFromS3({ bucket, key }) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
