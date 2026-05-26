import { randomBytes } from 'node:crypto';

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString('hex');
  return `${timestamp}-${random}`;
}

export function generateShortId(): string {
  return randomBytes(6).toString('hex');
}

export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = randomBytes(12).toString('hex');
  return `${timestamp}${random}`;
}
