import { OpenAPIHono } from '@hono/zod-openapi';
import { connectDB } from '../db/mongodb.js';
import { registerRouters } from '../routes/index.route.js';
import { registerReference } from './reference.js';
import { initSeedData } from './seed.js';

export async function bootstrap(app: OpenAPIHono) {
  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  registerRouters(app);
  registerReference(app);

  await connectDB();
  await initSeedData();
}
