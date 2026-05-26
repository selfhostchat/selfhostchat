import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import { loginSchema, registerSchema } from '@selfhostchat/validators';
import { User } from '../models/index.js';
import { generateToken } from '../utils/jwt.js';
import { createWorkspace } from '../services/workspace.service.js';

const auth = new Hono();

// POST /auth/register
auth.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const { email, password, name } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });

  // Auto-create default workspace for new user
  const workspace = await createWorkspace(
    { name: `${name}'s Workspace`, description: 'Personal workspace' },
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
});

// POST /auth/login
auth.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.errors }, 400);
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
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
});

export default auth;
