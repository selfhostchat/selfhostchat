import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { createConfig, getConfigByAdminUsername } from '../services/config.service.js';

const config = new OpenAPIHono();

const ConfigSettingsSchema = z.object({
  allowSignups: z.boolean(),
  requireEmailVerification: z.boolean(),
  maxChannelsPerWorkspace: z.number(),
  maxMembersPerWorkspace: z.number(),
  storageLimitMB: z.number(),
  logoUrl: z.string().nullable(),
  primaryColor: z.string().nullable(),
}).openapi('ConfigSettings');

const ConfigSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  organizationName: z.string(),
  adminUsername: z.string(),
  settings: ConfigSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Config');

const SetupSchema = z.object({
  organizationName: z.string().min(1).max(100),
  adminUsername: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username only letters, numbers, underscore'),
  adminPassword: z.string().min(6).max(100),
}).openapi('SetupRequest');

const ErrorSchema = z.object({ error: z.string() }).openapi('Error');

function serializeConfig(c: any) {
  return {
    id: c._id.toString(),
    workspaceId: c.workspaceId.toString(),
    organizationName: c.organizationName,
    adminUsername: c.adminUsername,
    settings: {
      allowSignups: c.settings?.allowSignups ?? true,
      requireEmailVerification: c.settings?.requireEmailVerification ?? false,
      maxChannelsPerWorkspace: c.settings?.maxChannelsPerWorkspace ?? 100,
      maxMembersPerWorkspace: c.settings?.maxMembersPerWorkspace ?? 50,
      storageLimitMB: c.settings?.storageLimitMB ?? 1024,
      logoUrl: c.settings?.logoUrl ?? null,
      primaryColor: c.settings?.primaryColor ?? null,
    },
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// POST /config/setup - Create initial config (no auth required)
config.openapi(
  createRoute({
    method: 'post',
    path: '/setup',
    tags: ['Config'],
    summary: 'Setup initial configuration',
    description: 'Creates workspace, admin user, and config on first launch',
    security: [],
    request: {
      body: { content: { 'application/json': { schema: SetupSchema } }, required: true },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: z.object({ data: ConfigSchema }) } },
        description: 'Setup completed',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid input',
      },
      409: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Already configured or admin username exists',
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');

    const existing = await getConfigByAdminUsername(body.adminUsername);
    if (existing) {
      return c.json({ error: 'Admin username already exists' }, 409);
    }

    const newConfig = await createConfig({
      organizationName: body.organizationName,
      adminUsername: body.adminUsername,
      adminPassword: body.adminPassword,
    });

    return c.json({ data: serializeConfig(newConfig) }, 201);
  }
);

// GET /config/status - Check if already configured (no auth required)
config.openapi(
  createRoute({
    method: 'get',
    path: '/status',
    tags: ['Config'],
    summary: 'Check setup status',
    description: 'Returns whether the system has been configured',
    security: [],
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ configured: z.boolean() }) } },
        description: 'Setup status',
      },
    },
  }),
  async (c) => {
    const { Config } = await import('../models/config.model.js');
    const count = await Config.countDocuments();
    return c.json({ configured: count > 0 });
  }
);

export default config;
