import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.js';
import { createWorkspace, getUserWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace, addMember, removeMember } from '../services/workspace.service.js';
import { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema } from '@selfhostchat/validators';
import { User } from '../models/index.js';

const workspaces = new Hono<{ Variables: AuthVariables }>();

// GET /workspaces - List all workspaces for current user
workspaces.get('/', async (c) => {
  const userId = c.get('userId');
  const workspaces_data = await getUserWorkspaces(userId);

  return c.json({ data: workspaces_data });
});

// POST /workspaces - Create workspace
workspaces.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = createWorkspaceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const workspace = await createWorkspace(parsed.data, userId);
  return c.json({ data: workspace }, 201);
});

// GET /workspaces/:id
workspaces.get('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const workspace = await getWorkspaceById(id, userId);

  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404);
  }

  return c.json({ data: workspace });
});

// PATCH /workspaces/:id
workspaces.patch('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = updateWorkspaceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const workspace = await updateWorkspace(id, userId, parsed.data);
  if (!workspace) {
    return c.json({ error: 'Workspace not found or access denied' }, 404);
  }

  return c.json({ data: workspace });
});

// DELETE /workspaces/:id
workspaces.delete('/:id', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');

  const deleted = await deleteWorkspace(id, userId);
  if (!deleted) {
    return c.json({ error: 'Workspace not found or access denied' }, 404);
  }

  return c.json({ message: 'Workspace deleted' });
});

// POST /workspaces/:id/members - Invite member
workspaces.post('/:id/members', async (c) => {
  const { id } = c.req.param();
  const userId = c.get('userId');
  const body = await c.req.json();
  const parsed = inviteMemberSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const workspace = await addMember(id, userId, parsed.data.email, parsed.data.role);
  if (!workspace) {
    return c.json({ error: 'Workspace not found or user not found' }, 404);
  }

  return c.json({ data: workspace });
});

// DELETE /workspaces/:id/members/:userId - Remove member
workspaces.delete('/:id/members/:userId', async (c) => {
  const { id, userId } = c.req.param();
  const currentUserId = c.get('userId');

  const workspace = await removeMember(id, currentUserId, userId);
  if (!workspace) {
    return c.json({ error: 'Workspace not found or access denied' }, 404);
  }

  return c.json({ data: workspace });
});

export default workspaces;
