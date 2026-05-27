import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import {
  createMessage,
  getMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
} from '../services/message.service.js';

const messages = new OpenAPIHono();

const ReactionSchema = z.object({
  emoji: z.string(),
  userIds: z.array(z.string()),
});

const MessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  userId: z.string(),
  content: z.string(),
  replyTo: z.string().nullable(),
  reactions: z.array(ReactionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Message');

const CreateMessageSchema = z.object({
  channelId: z.string(),
  content: z.string().min(1).max(10000),
  replyTo: z.string().optional(),
}).openapi('CreateMessageRequest');

const UpdateMessageSchema = z.object({
  content: z.string().min(1).max(10000),
}).openapi('UpdateMessageRequest');

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

const ErrorSchema = z.object({ error: z.string() }).openapi('Error');

function serializeMessage(m: any) {
  return {
    id: m._id.toString(),
    channelId: m.channelId.toString(),
    userId: typeof m.senderId === 'object' ? m.senderId._id.toString() : m.senderId?.toString() ?? '',
    content: m.content,
    replyTo: m.replyTo
      ? (typeof m.replyTo === 'object' ? m.replyTo._id.toString() : m.replyTo.toString())
      : null,
    reactions: (m.reactions || []).map((r: any) => ({
      emoji: r.emoji,
      userIds: r.userIds.map((u: any) => u.toString()),
    })),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

// GET /messages?channelId=xxx&page=1&pageSize=50
messages.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Messages'],
    summary: 'List messages',
    description: 'Returns paginated messages for a channel',
    security: [{ bearerAuth: [] }],
    request: {
      query: PaginationSchema.extend({ channelId: z.string() }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(MessageSchema),
              total: z.number(),
              page: z.number(),
              pageSize: z.number(),
              hasMore: z.boolean(),
            }),
          },
        },
        description: 'Message list',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'channelId required',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { channelId, page, pageSize } = c.req.valid('query');
    const result = await getMessages(channelId, userId, page, pageSize);
    return c.json({
      data: result.data.map(serializeMessage),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    });
  }
);

// POST /messages
messages.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Messages'],
    summary: 'Create message',
    description: 'Creates a new message in a channel',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: CreateMessageSchema } }, required: true },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: z.object({ data: MessageSchema }) } },
        description: 'Message created',
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
    const message = await createMessage(body, userId);
    return c.json({ data: serializeMessage(message) }, 201);
  }
);

// GET /messages/:id
messages.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Messages'],
    summary: 'Get message',
    description: 'Returns a message by ID',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: MessageSchema }) } },
        description: 'Message',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Message not found',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const message = await getMessageById(id, userId);
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }
    return c.json({ data: serializeMessage(message) });
  }
);

// PATCH /messages/:id
messages.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}',
    tags: ['Messages'],
    summary: 'Update message',
    description: 'Updates message content',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { 'application/json': { schema: UpdateMessageSchema } }, required: true },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: MessageSchema }) } },
        description: 'Message updated',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Message not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const message = await updateMessage(id, userId, body.content);
    if (!message) {
      return c.json({ error: 'Message not found or access denied' }, 404);
    }
    return c.json({ data: serializeMessage(message) });
  }
);

// DELETE /messages/:id
messages.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Messages'],
    summary: 'Delete message',
    description: 'Deletes a message',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        description: 'Message deleted',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Message not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const deleted = await deleteMessage(id, userId);
    if (!deleted) {
      return c.json({ error: 'Message not found or access denied' }, 404);
    }
    return c.json({ message: 'Message deleted' });
  }
);

export default messages;
