import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
} from '../services/workspace.service.js';

const workspaces = new OpenAPIHono();

const MemberSchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'admin', 'member', 'guest']),
  joinedAt: z.string(),
});

const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ownerId: z.string(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  members: z.array(MemberSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('Workspace');

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
}).openapi('CreateWorkspaceRequest');

const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
}).openapi('UpdateWorkspaceRequest');

const InviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
}).openapi('InviteMemberRequest');

const ErrorSchema = z.object({ error: z.string() }).openapi('Error');

function serializeWorkspace(w: any) {
  return {
    id: w._id.toString(),
    name: w.name,
    description: w.description ?? null,
    ownerId: w.ownerId?._id?.toString() ?? w.ownerId?.toString() ?? '',
    plan: w.plan,
    members: w.members.map((m: any) => ({
      userId: m.userId?._id?.toString() ?? m.userId?.toString() ?? '',
      role: m.role,
      joinedAt: new Date(m.joinedAt).toISOString(),
    })),
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

// GET /workspaces
workspaces.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Workspaces'],
    summary: 'List workspaces',
    description: 'Returns all workspaces for the authenticated user',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: z.array(WorkspaceSchema) }) } },
        description: 'Workspace list',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const data = await getUserWorkspaces(userId);
    return c.json({ data: data.map(serializeWorkspace) });
  }
);

// POST /workspaces
workspaces.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Workspaces'],
    summary: 'Create workspace',
    description: 'Creates a new workspace',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: CreateWorkspaceSchema } }, required: true },
    },
    responses: {
      201: {
        content: { 'application/json': { schema: z.object({ data: WorkspaceSchema }) } },
        description: 'Workspace created',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid input',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const workspace = await createWorkspace(body, userId);
    return c.json({ data: serializeWorkspace(workspace) }, 201);
  }
);

// GET /workspaces/:id
workspaces.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Workspaces'],
    summary: 'Get workspace',
    description: 'Returns a workspace by ID',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: WorkspaceSchema }) } },
        description: 'Workspace',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Workspace not found',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const workspace = await getWorkspaceById(id, userId);
    if (!workspace) {
      return c.json({ error: 'Workspace not found' }, 404);
    }
    return c.json({ data: serializeWorkspace(workspace) });
  }
);

// PATCH /workspaces/:id
workspaces.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}',
    tags: ['Workspaces'],
    summary: 'Update workspace',
    description: 'Updates workspace name or description',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { 'application/json': { schema: UpdateWorkspaceSchema } }, required: false },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: WorkspaceSchema }) } },
        description: 'Workspace updated',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Workspace not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json') ?? {};
    const workspace = await updateWorkspace(id, userId, body);
    if (!workspace) {
      return c.json({ error: 'Workspace not found or access denied' }, 404);
    }
    return c.json({ data: serializeWorkspace(workspace) });
  }
);

// DELETE /workspaces/:id
workspaces.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Workspaces'],
    summary: 'Delete workspace',
    description: 'Deletes a workspace',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ message: z.string() }) } },
        description: 'Workspace deleted',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Workspace not found or access denied',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const deleted = await deleteWorkspace(id, userId);
    if (!deleted) {
      return c.json({ error: 'Workspace not found or access denied' }, 404);
    }
    return c.json({ message: 'Workspace deleted' });
  }
);

// POST /workspaces/:id/members
workspaces.openapi(
  createRoute({
    method: 'post',
    path: '/{id}/members',
    tags: ['Workspaces'],
    summary: 'Invite member',
    description: 'Adds a user to the workspace by email',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
      body: { content: { 'application/json': { schema: InviteMemberSchema } }, required: true },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: WorkspaceSchema }) } },
        description: 'Member added',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Workspace or user not found',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const workspace = await addMember(id, userId, body.email, body.role);
    if (!workspace) {
      return c.json({ error: 'Workspace not found or user not found' }, 404);
    }
    return c.json({ data: serializeWorkspace(workspace) });
  }
);

// DELETE /workspaces/:id/members/:userId
workspaces.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}/members/{userId}',
    tags: ['Workspaces'],
    summary: 'Remove member',
    description: 'Removes a user from the workspace',
    security: [{ bearerAuth: [] }],
    request: { params: z.object({ id: z.string(), userId: z.string() }) },
    responses: {
      200: {
        content: { 'application/json': { schema: z.object({ data: WorkspaceSchema }) } },
        description: 'Member removed',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Workspace not found or access denied',
      },
    },
  }),
  async (c) => {
    const currentUserId = c.get('userId');
    const { id, userId } = c.req.valid('param');
    const workspace = await removeMember(id, currentUserId, userId);
    if (!workspace) {
      return c.json({ error: 'Workspace not found or access denied' }, 404);
    }
    return c.json({ data: serializeWorkspace(workspace) });
  }
);

export default workspaces;
