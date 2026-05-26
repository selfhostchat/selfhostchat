import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.js';
import { uploadFile, getFileUrl, deleteFile } from '../services/storage.service.js';

const files = new Hono<{ Variables: AuthVariables }>();

// POST /files/upload
files.post('/upload', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.parseBody({ all: true });
  const file = body['file'] as File;

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No file provided' }, 400);
  }

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ error: 'File too large (max 50MB)' }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadFile(file.name, file.type, buffer, userId);

  return c.json({ data: result }, 201);
});

// GET /files/:objectName
files.get('/:objectName(*)', async (c) => {
  const { objectName } = c.req.param();

  const url = await getFileUrl(objectName);
  if (!url) {
    return c.json({ error: 'File not found' }, 404);
  }

  return c.json({ data: { url } });
});

// DELETE /files/:objectName
files.delete('/:objectName(*)', async (c) => {
  const { objectName } = c.req.param();
  const userId = c.get('userId');

  const deleted = await deleteFile(objectName, userId);
  if (!deleted) {
    return c.json({ error: 'File not found or access denied' }, 404);
  }

  return c.json({ message: 'File deleted' });
});

export default files;
