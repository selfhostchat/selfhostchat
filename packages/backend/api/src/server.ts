import { config } from 'dotenv';
import { join } from 'node:path';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { bootstrap } from './utils/bootstrap.js';

const app = new OpenAPIHono();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin, credentials: true,
}));
app.use('*', trimTrailingSlash());

// Error handler
app.onError((err, c) => {
  console.error('[API Error]', err);
  const status = (err as { status?: number }).status || (err as { statusCode?: number }).statusCode || 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  return c.json({ error: message }, status);
});

async function start() {
  config({ path: join(process.cwd(), '.env') });
  await bootstrap(app);

  const port = parseInt(process.env.PORT || '3000', 10);
  serve({ fetch: app.fetch, port });

  const base = `http://localhost:${port}`;
  const endpoints = [
    ['🚀', 'Server', base],
    ['✨', 'Reference', `${base}/reference`],
    ['📖', 'Docs', `${base}/doc`],
    ['📄', 'LLM', `${base}/llm.txt`],
  ];

  console.log(endpoints.map(([icon, label, url]) =>
    `${icon}  ${label.padEnd(12)} ${url}`
  ).join('\n'));
}

start().catch(console.error);

export default app;
