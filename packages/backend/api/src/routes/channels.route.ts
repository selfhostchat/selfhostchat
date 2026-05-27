import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import {
  createChannel,
  getChannels,
  getChannelById,
  updateChannel,
  deleteChannel,
} from '../services/channel.service.js';

const channels = new OpenAPIHono();

const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['public', 'private', 'direct']),
  workspaceId: z.string(),
  members: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Channel');

const CreateChannelSchema = z.object({
  workspaceId: z.string().openapi({ description: 'Workspace ID to create channel in' }),
  name: z.string().min(1).max(100),
  type: z.enum(['public', 'private', 'direct']).default('public'),
}).openapi('CreateChannelRequest');

const UpdateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
}).openapi('UpdateChannelRequest');

const ErrorSchema = z.object({ error: z.string() }).openapi('Error');

// GET /channels?workspaceId=xxx
channels.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Channels'],
    summary: 'List channels',
    description: 'Returns all channels in a workspace',
    security: [{ bearerAuth: [] }],
    request: {
      query: z.object({ workspaceId: z.string() }),
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: z.array(ChannelSchema) }) } },
        description: 'Channel list',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'workspaceId required',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { workspaceId } = c.req.valid('query');
    const data = await getChannels(workspaceId, userId);
    return c.json({
      data: data.map((ch) => ({
        id: ch._id.toString(),
        name: ch.name,
        type: ch.type,
        workspaceId: ch.workspaceId.toString(),
        members: ch.members.map((m) => m.toString()),
        createdAt: ch.createdAt.toISOString(),
        updatedAt: ch.updatedAt.toISOString(),
      })),
    });
  }
);

// POST /channels
channels.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Channels'],
    summary: 'Create channel',
    description: 'Creates a new channel in a workspace',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: { 'application/json': { schema: CreateChannelSchema } },
        required: true,
      },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: z.object({ data: ChannelSchema }) } },
        description: 'Channel created',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid input or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const channel = await createChannel(body, userId);
    return c.json({
      data: {
        id: channel._id.toString(),
        name: channel.name,
        type: channel.type,
        workspaceId: channel.workspaceId.toString(),
        members: channel.members.map((m) => m.toString()),
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
      },
    }, 201);
  }
);

// GET /channels/:id
channels.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Channels'],
    summary: 'Get channel',
    description: 'Returns a channel by ID',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: ChannelSchema }) } },
        description: 'Channel',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Channel not found',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const channel = await getChannelById(id, userId);
    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }
    return c.json({
      data: {
        id: channel._id.toString(),
        name: channel.name,
        type: channel.type,
        workspaceId: channel.workspaceId.toString(),
        members: channel.members.map((m) => m.toString()),
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
      },
    });
  }
);

// PATCH /channels/:id
channels.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}',
    tags: ['Channels'],
    summary: 'Update channel',
    description: 'Updates a channel name',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { 'application/json': { schema: UpdateChannelSchema } }, required: false },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: ChannelSchema }) } },
        description: 'Channel updated',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Channel not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json') ?? {};
    const channel = await updateChannel(id, userId, body);
    if (!channel) {
      return c.json({ error: 'Channel not found or access denied' }, 404);
    }
    return c.json({
      data: {
        id: channel._id.toString(),
        name: channel.name,
        type: channel.type,
        workspaceId: channel.workspaceId.toString(),
        members: channel.members.map((m) => m.toString()),
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
      },
    });
  }
);

// DELETE /channels/:id
channels.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Channels'],
    summary: 'Delete channel',
    description: 'Deletes a channel',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        description: 'Channel deleted',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Channel not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const deleted = await deleteChannel(id, userId);
    if (!deleted) {
      return c.json({ error: 'Channel not found or access denied' }, 404);
    }
    return c.json({ message: 'Channel deleted' });
  }
);

export default channels;
