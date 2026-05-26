import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.js';
import {
  createMessage,
  getMessages,
  getMessageById,
  updateMessage,
  deleteMessage,
} from '../services/message.service.js';
import { createMessageSchema, updateMessageSchema, paginationSchema } from '@selfhostchat/validators';

const messages = new Hono<{ Variables: AuthVariables }>();

// GET /messages?channelId=xxx&page=1&pageSize=50
messages.get('/', async (c) => {
  const userId = c.get('userId');
  const channelId = c.req.query('channelId');
  const query = paginationSchema.safeParse(c.req.query());

  if (!channelId) {
    return c.json({ error: 'channelId is required' }, 400);
  }

  const { page = 1, pageSize = 50 } = query.success ? query.data : { page: 1, pageSize: 50 };

  const result = await getMessages(channelId, userId, page, pageSize);
  return c.json(result);
});

// POST /messages
messages.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = createMessageSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const message = await createMessage(parsed.data, userId);
  return c.json({ data: message }, 201);
});

// GET /messages/:id
messages.get('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');

  const message = await getMessageById(id, userId);
  if (!message) {
    return c.json({ error: 'Message not found' }, 404);
  }

  return c.json({ data: message });
});

// PATCH /messages/:id
messages.patch('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = updateMessageSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const message = await updateMessage(id, userId, parsed.data.content);
  if (!message) {
    return c.json({ error: 'Message not found or access denied' }, 404);
  }

  return c.json({ data: message });
});

// DELETE /messages/:id
messages.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');

  const deleted = await deleteMessage(id, userId);
  if (!deleted) {
    return c.json({ error: 'Message not found or access denied' }, 404);
  }

  return c.json({ message: 'Message deleted' });
});

export default messages;
