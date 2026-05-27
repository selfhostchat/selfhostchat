import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import { User } from '../models/index.js';

const users = new OpenAPIHono();

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('User');

const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().nullable().optional(),
}).openapi('UpdateUserRequest');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('Error');

// GET /users/me
users.openapi(
  createRoute({
    method: 'get',
    path: '/me',
    tags: ['Users'],
    summary: 'Get current user',
    description: 'Returns the authenticated user profile',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        content: { 'application/json': { schema: UserSchema } },
        description: 'User profile',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'User not found',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const user = await User.findById(userId).select('-passwordHash').lean();
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }
);

// PATCH /users/me
users.openapi(
  createRoute({
    method: 'patch',
    path: '/me',
    tags: ['Users'],
    summary: 'Update current user',
    description: 'Update name or avatar of authenticated user',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: UpdateUserSchema,
          },
        },
        required: false,
      },
    },
    responses: {
      200: {
        content: { 'application/json': { schema: UserSchema } },
        description: 'User updated',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'User not found',
      },
    },
  }),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json') ?? {};
    const updates: Record<string, unknown> = {};
    for (const key of ['name', 'avatar'] as const) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash').lean();
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }
);

// GET /users/:id
users.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Users'],
    summary: 'Get user by ID',
    description: 'Returns a user public profile',
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({ id: z.string() }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: UserSchema.pick({ id: true, email: true, name: true, avatar: true }),
          },
        },
        description: 'User profile',
      },
      404: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'User not found',
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param');
    const user = await User.findById(id).select('_id email name avatar').lean();
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
  }
);

export default users;
