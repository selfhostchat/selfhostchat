import { Client } from 'minio';
import { nanoid } from 'nanoid';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || '',
});

const BUCKET = process.env.MINIO_BUCKET || 'selfhostchat';
const BUCKET_INITIALIZED = Symbol('bucket_initialized');
let bucketReady: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return bucketReady;

  bucketReady = (async () => {
    try {
      const exists = await minioClient.bucketExists(BUCKET);
      if (!exists) {
        await minioClient.makeBucket(BUCKET);
      }
    } catch (error) {
      console.error('MinIO bucket init error:', error);
      bucketReady = null;
    }
  })();

  return bucketReady;
}

export interface UploadResult {
  objectName: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export async function uploadFile(
  filename: string,
  mimeType: string,
  buffer: Buffer,
  userId: string
): Promise<UploadResult> {
  await ensureBucket();

  const objectName = `uploads/${userId}/${Date.now()}-${nanoid(8)}-${filename}`;

  await minioClient.putObject(BUCKET, objectName, buffer, buffer.length, mimeType);

  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  const url = `${protocol}://${endpoint}:${port}/${BUCKET}/${objectName}`;

  return {
    objectName,
    url,
    filename,
    size: buffer.length,
    mimeType,
  };
}

export async function getFileUrl(objectName: string): Promise<string | null> {
  try {
    await ensureBucket();
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `${protocol}://${endpoint}:${port}/${BUCKET}/${objectName}`;
  } catch {
    return null;
  }
}

export async function deleteFile(
  objectName: string,
  userId: string
): Promise<boolean> {
  try {
    await ensureBucket();

    if (!objectName.startsWith(`uploads/${userId}/`)) {
      return false;
    }

    await minioClient.removeObject(BUCKET, objectName);
    return true;
  } catch {
    return false;
  }
}
