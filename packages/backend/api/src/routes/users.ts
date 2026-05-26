import { Hono } from 'hono';
import type { AuthVariables } from '../middleware/auth.js';
import { User } from '../models/index.js';

const users = new Hono<{ Variables: AuthVariables }>();

// GET /users/me
users.get('/me', async (c) => {
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

// PATCH /users/me
users.patch('/me', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  const allowed = ['name', 'avatar'];
  const updates: Record<string, unknown> = {};

  for (const key of allowed) {
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
  });
});

// GET /users/:id
users.get('/:id', async (c) => {
  const { id } = c.req.param();
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
});

export default users;
