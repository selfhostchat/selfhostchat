import type { MiddlewareHandler } from 'hono';
import type { ErrorResponse } from '../types/index.js';

export const errorHandler: MiddlewareHandler = (err, c) => {
  console.error('[API Error]', err);

  if (err instanceof Response) {
    throw err;
  }

  const status = (err as any).status || (err as any).statusCode || 500;
  const message = err instanceof Error ? err.message : 'Internal server error';

  const errorResponse: ErrorResponse = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  };

  return c.json(errorResponse, status);
};
