import type { MiddlewareHandler } from 'hono';
import { verifyToken, type JWTPayload } from '../utils/jwt.js';
import { User } from '../models/user.model.js';

export interface AuthVariables {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: missing token' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return c.json({ error: 'Unauthorized: invalid token' }, 401);
  }

  const user = await User.findById(payload.userId).select('_id email name avatar').lean();
  if (!user) {
    return c.json({ error: 'Unauthorized: user not found' }, 401);
  }

  c.set('userId', payload.userId);
  c.set('user', {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  });

  await next();
};
