import { config } from 'dotenv';
import { join } from 'node:path';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { compress } from 'hono/compress';
import { trimTrailingSlash } from 'hono/trailing-slash';

const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,
}));
app.use('*', trimTrailingSlash());

// Error handler
app.onError((err, c) => {
  console.error('[API Error]', err);
  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  return c.json({ error: message }, status);
});

async function bootstrap() {
  config({ path: join(process.cwd(), '.env') });

  const { connectDB } = await import('./db/mongodb.js');
  const { authMiddleware } = await import('./middleware/auth.js');

  const authRoutes = (await import('./routes/auth.js')).default;
  const userRoutes = (await import('./routes/users.js')).default;
  const workspaceRoutes = (await import('./routes/workspaces.js')).default;
  const channelRoutes = (await import('./routes/channels.js')).default;
  const messageRoutes = (await import('./routes/messages.js')).default;
  const fileRoutes = (await import('./routes/files.js')).default;

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Public routes
  app.route('/api/v1/auth', authRoutes);

  // Protected routes
  app.use('/api/v1/*', async (c, next) => {
    const middleware = await authMiddleware();
    return middleware(c, next);
  });

  app.route('/api/v1/users', userRoutes);
  app.route('/api/v1/workspaces', workspaceRoutes);
  app.route('/api/v1/channels', channelRoutes);
  app.route('/api/v1/messages', messageRoutes);
  app.route('/api/v1/files', fileRoutes);

  // 404 handler
  app.notFound((c) => c.json({ error: 'Not found' }, 404));

  await connectDB();

  const port = parseInt(process.env.PORT || '3000', 10);
  console.log(`🚀 API server running on http://localhost:${port}`);

  const { serve } = await import('@hono/node-server');
  serve({ fetch: app.fetch, port });
}

bootstrap().catch(console.error);

export default app;
