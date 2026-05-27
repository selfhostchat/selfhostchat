import { z } from 'zod';
import { OpenAPIHono } from '@hono/zod-openapi';
import { createRoute } from '@hono/zod-openapi';
import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { createWorkspace } from '../services/workspace.service.js';

const auth = new OpenAPIHono();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
}).openapi('RegisterRequest');

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
}).openapi('LoginRequest');

const LoginByUsernameSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
}).openapi('LoginByUsernameRequest');

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().nullable(),
}).openapi('User');

const RegisterResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  workspace: z.object({
    id: z.string(),
    name: z.string(),
  }),
}).openapi('RegisterResponse');

const LoginResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
}).openapi('LoginResponse');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('Error');

// POST /auth/register
auth.openapi(
  createRoute({
    method: 'post',
    path: '/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    description: 'Creates a new user account and returns a JWT token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: RegisterSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: RegisterResponseSchema,
          },
        },
        description: 'User registered successfully',
      },
      409: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Email already registered',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid input',
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return c.json({ error: 'Email already registered' }, 409);
    }
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({ email: body.email, passwordHash, name: body.name });
    const workspace = await createWorkspace(
      { name: `${body.name}'s Workspace`, description: 'Personal workspace' },
      user._id.toString()
    );
    const token = generateToken(user._id.toString(), user.email);
    return c.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
      },
    }, 201);
  }
);

// POST /auth/login
auth.openapi(
  createRoute({
    method: 'post',
    path: '/login',
    tags: ['Auth'],
    summary: 'Login',
    description: 'Authenticate user and return JWT token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: LoginSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: LoginResponseSchema,
          },
        },
        description: 'Login successful',
      },
      401: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid email or password',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid input',
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');
    const user = await User.findOne({ email: body.email });
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    const token = generateToken(user._id.toString(), user.email);
    return c.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    });
  }
);

// POST /auth/login/username
auth.openapi(
  createRoute({
    method: 'post',
    path: '/login/username',
    tags: ['Auth'],
    summary: 'Login by username',
    description: 'Authenticate user by username and return JWT token',
    security: [],
    request: {
      body: {
        content: {
          'application/json': {
            schema: LoginByUsernameSchema,
          },
        },
        required: true,
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: LoginResponseSchema,
          },
        },
        description: 'Login successful',
      },
      401: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid username or password',
      },
      400: {
        content: { 'application/json': { schema: ErrorSchema } },
        description: 'Invalid input',
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json');
    const { Config } = await import('../models/config.model.js');
    const config = await Config.findOne({ adminUsername: body.username.toLowerCase() }).lean();
    if (!config) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    const valid = await bcrypt.compare(body.password, config.adminPasswordHash);
    if (!valid) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    const user = await User.findById(config.workspaceId).lean();
    if (!user) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }
    const token = generateToken(user._id.toString(), user.email);
    return c.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      token,
    });
  }
);

export default auth;
