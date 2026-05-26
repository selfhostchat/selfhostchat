import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.js';
import { createChannel, getChannels, getChannelById, updateChannel, deleteChannel } from '../services/channel.service.js';
import { createChannelSchema, updateChannelSchema } from '@selfhostchat/validators';

const channels = new Hono<{ Variables: AuthVariables }>();

// GET /channels?workspaceId=xxx
channels.get('/', async (c) => {
  const userId = c.get('userId');
  const workspaceId = c.req.query('workspaceId');

  if (!workspaceId) {
    return c.json({ error: 'workspaceId is required' }, 400);
  }

  const channels_data = await getChannels(workspaceId, userId);
  return c.json({ data: channels_data });
});

// POST /channels
channels.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = createChannelSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const channel = await createChannel({ ...parsed.data, workspaceId: parsed.data.workspaceId || body.workspaceId }, userId);
  return c.json({ data: channel }, 201);
});

// GET /channels/:id
channels.get('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');

  const channel = await getChannelById(id, userId);
  if (!channel) {
    return c.json({ error: 'Channel not found' }, 404);
  }

  return c.json({ data: channel });
});

// PATCH /channels/:id
channels.patch('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = updateChannelSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const channel = await updateChannel(id, userId, parsed.data);
  if (!channel) {
    return c.json({ error: 'Channel not found or access denied' }, 404);
  }

  return c.json({ data: channel });
});

// DELETE /channels/:id
channels.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');

  const deleted = await deleteChannel(id, userId);
  if (!deleted) {
    return c.json({ error: 'Channel not found or access denied' }, 404);
  }

  return c.json({ message: 'Channel deleted' });
});

export default channels;
