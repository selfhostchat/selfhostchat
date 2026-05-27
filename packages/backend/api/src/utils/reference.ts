import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { createMarkdownFromOpenApi } from '@scalar/openapi-to-markdown'


// Docs: https://hono.dev/examples/scalar
export async function registerReference(app: OpenAPIHono) {
  const contentDocument = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: { title: 'Example', version: 'v1' },
  })

  app.doc('/doc', ({ req }) => ({
    openapi: '3.0.0',
    info: { title: 'SelfHostChat API', version: '1.0.0', description: 'API documentation for SelfHostChat' },
    servers: [
      {
        url: new URL(req.url).origin,
        description: 'Current environment'
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  }));

  app.get('/reference', Scalar({
    spec: { url: '/doc' },
    pageTitle: 'SelfHostChat API Reference',
  }));


  const markdown = await createMarkdownFromOpenApi(JSON.stringify(contentDocument))
  app.get('/llms.txt', (c) => c.text(markdown));
}
