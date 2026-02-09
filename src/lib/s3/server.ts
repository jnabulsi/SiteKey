import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/env";

const PRESIGN_GET_EXPIRY_SECONDS = 120;
const PRESIGN_PUT_EXPIRY_SECONDS = 300;

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function presignGetObject(storageKey: string) {
  const cmd = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: storageKey,
  });

  return getSignedUrl(s3, cmd, { expiresIn: PRESIGN_GET_EXPIRY_SECONDS });
}

export async function presignPutObject(
  storageKey: string,
  contentType: string,
  contentLength: number
) {
  const cmd = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: storageKey,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  return getSignedUrl(s3, cmd, { expiresIn: PRESIGN_PUT_EXPIRY_SECONDS });
}

export async function headObject(storageKey: string) {
  const cmd = new HeadObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: storageKey,
  });

  return s3.send(cmd);
}

export async function deleteObject(storageKey: string) {
  const cmd = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: storageKey,
  });

  return s3.send(cmd);
}

