import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { uploadFile, getFileUrl, deleteFile } from '../services/storage.service.js';

const files = new OpenAPIHono();

const FileUploadResponseSchema = z.object({
  objectName: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
}).openapi('FileUploadResponse');

const FileUrlResponseSchema = z.object({
  url: z.string().url(),
}).openapi('FileUrlResponse');

const ErrorSchema = z.object({ error: z.string() }).openapi('Error');

// POST /files/upload
files.openapi(
  createRoute({
    method: 'post',
    path: '/upload',
    tags: ['Files'],
    summary: 'Upload file',
    description: 'Uploads a file (max 50MB)',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              file: z.string().describe('File binary'),
            }),
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: z.object({ data: FileUploadResponseSchema }) } },
        description: 'File uploaded',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'No file provided or file too large',
      },
    },
  }),
  async (c) => {
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
  }
);

// GET /files/:objectName
files.openapi(
  createRoute({
    method: 'get',
    path: '/{objectName*}',
    tags: ['Files'],
    summary: 'Get file URL',
    description: 'Returns a presigned URL for the file',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ objectName: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: FileUrlResponseSchema } },
        description: 'File URL',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'File not found',
      },
    },
  }),
  async (c) => {
    const { objectName } = c.req.valid('param');
    const url = await getFileUrl(objectName);
    if (!url) {
      return c.json({ error: 'File not found' }, 404);
    }
    return c.json({ data: { url } });
  }
);

// DELETE /files/:objectName
files.openapi(
  createRoute({
    method: 'delete',
    path: '/{objectName*}',
    tags: ['Files'],
    summary: 'Delete file',
    description: 'Deletes a file',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ objectName: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        description: 'File deleted',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'File not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { objectName } = c.req.valid('param');
    const deleted = await deleteFile(objectName, userId);
    if (!deleted) {
      return c.json({ error: 'File not found or access denied' }, 404);
    }
    return c.json({ message: 'File deleted' });
  }
);

export default files;
