import { OpenAPIHono } from '@hono/zod-openapi';
import authRoute from './auth.route.js';
import usersRoute from './users.route.js';
import workspacesRoute from './workspaces.route.js';
import channelsRoute from './channels.route.js';
import messagesRoute from './messages.route.js';
import filesRoute from './files.route.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export function registerRouters(app: OpenAPIHono) {
  app.route('/api/v1/auth', authRoute);

  app.use('/api/v1/*', authMiddleware);

  app.route('/api/v1/users', usersRoute);
  app.route('/api/v1/workspaces', workspacesRoute);
  app.route('/api/v1/channels', channelsRoute);
  app.route('/api/v1/messages', messagesRoute);
  app.route('/api/v1/files', filesRoute);

  app.notFound((c) => c.json({ error: 'Not found' }, 404));
}
