# SelfHostChat - Triển khai theo mô hình AFFiNE

> Kế hoạch triển khai từng bước dựa trên kiến trúc của AFFiNE
> Công nghệ lõi: Vue + Vite + Electron/Flutter, NodeJS + HonoJS, MongoDB, Redis, RabbitMQ, MinIO
> Ngày tạo: 26/05/2026

---

## Mục lục

1. [Tổng quan chiến lược](#1-tổng-quan-chiến-lược)
2. [Giai đoạn 1: Nền tảng & Cấu trúc Monorepo](#2-giai-đoạn-1-nền-tảng--cấu-trúc-monorepo)
3. [Giai đoạn 2: Backend Core - API & WebSocket](#3-giai-đoạn-2-backend-core---api--websocket)
4. [Giai đoạn 3: Frontend Web - Vue + Vite](#4-giai-đoạn-3-frontend-web---vue--vite)
5. [Giai đoạn 4: Desktop App - Electron](#5-giai-đoạn-4-desktop-app---electron)
6. [Giai đoạn 5: Mobile App - Flutter](#6-giai-đoạn-5-mobile-app---flutter)
7. [Giai đoạn 6: Real-time Sync & Collaboration](#7-giai-đoạn-6-real-time-sync--collaboration)
8. [Giai đoạn 7: Storage & Media](#8-giai-đoạn-7-storage--media)
9. [Giai đoạn 8: Authentication & Permissions](#9-giai-đoạn-8-authentication--permissions)
10. [Giai đoạn 9: Feature Flags & Multi-tenancy](#10-giai-đoạn-9-feature-flags--multi-tenancy)
11. [Giai đoạn 10: Payments & Subscriptions](#11-giai-đoạn-10-payments--subscriptions)
12. [Roadmap tổng hợp](#12-roadmap-tổng-hợp)

---

## 1. Tổng quan chiến lược

### 1.1 Mục tiêu

Xây dựng một ứng dụng chat self-hosted có khả năng:
- **Real-time collaboration** với nhiều người dùng đồng thời
- **Multi-platform**: Web, Desktop (Electron), Mobile (Flutter)
- **Self-hosted**: Có thể deploy trên server riêng
- **Scalable**: Từ prototype đến production
- **Plugin/Extension**: Hệ thống plugin cho mở rộng tính năng

### 1.2 So sánh với AFFiNE

| Khía cạnh | AFFiNE | SelfHostChat |
|-----------|--------|--------------|
| Editor | BlockSuite (CRDT) | Tập trung vào Chat/Message |
| Database | PostgreSQL + Prisma | MongoDB + Mongoose |
| API | NestJS + GraphQL | HonoJS + tRPC/Zod |
| Frontend | React | Vue 3 + Vite |
| Mobile | Capacitor | Flutter (native) |
| Payments | Stripe + RevenueCat | Stripe + Paddle |

### 1.3 Kiến trúc hệ thống mục tiêu

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│   │    Web      │  │  Desktop    │  │   Mobile    │  │ Admin   │  │
│   │  (Vue+Vite) │  │ (Electron)  │  │  (Flutter)  │  │  Panel  │  │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘  │
│          │                │                │                │        │
└──────────┼────────────────┼────────────────┼────────────────┼────────┘
           │                │                │                │
           └────────────────┴───────┬────────┴────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│                         API Gateway (HonoJS)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │  REST API   │  │  WebSocket  │  │   tRPC      │                 │
│  │  /api/v1    │  │  /ws        │  │  /trpc      │                 │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘                 │
│         └─────────────────┼──────────────────────────────────────┘   │
│                           │                                          │
│    ┌──────────────────────┼──────────────────────┐                   │
│    │                      │                      │                   │
│ ┌──▼───┐           ┌──────▼──────┐      ┌──────▼──────┐          │
│ │Auth  │           │   Services   │      │   Services   │          │
│ │Service│           │  (Chat)     │      │  (Workspace) │          │
│ └───────┘           └──────┬──────┘      └──────┬──────┘          │
│                            │                      │                   │
│    ┌──────────────────────┼──────────────────────┘                   │
│    │                      │                                            │
│ ┌──▼────────────┐  ┌──────▼──────┐  ┌──────────▼────────┐          │
│ │    MongoDB     │  │    Redis     │  │     RabbitMQ      │          │
│ │  (Database)    │  │(Cache/PubSub)│  │   (Job Queue)    │          │
│ └───────────────┘  └─────────────┘  └──────────────────┘          │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │                         MinIO (S3-compatible)                   │  │
│ │              File Storage, Media, Attachments                   │  │
│ └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Giai đoạn 1: Nền tảng & Cấu trúc Monorepo

### 2.1 Mục tiêu
- [ ] Thiết lập cấu trúc monorepo với pnpm workspaces
- [ ] Thiết lập TypeScript cấu hình thống nhất
- [ ] Thiết lập CI/CD cơ bản
- [ ] Tạo shared packages

### 2.2 Cấu trúc thư mục

```
selfhostchat/
├── packages/
│   ├── frontend/
│   │   ├── web/              # Vue + Vite web app
│   │   ├── desktop/           # Electron app
│   │   ├── mobile/            # Flutter app
│   │   └── shared/            # Shared Vue components, stores
│   ├── backend/
│   │   ├── api/              # HonoJS REST API
│   │   ├── ws/               # WebSocket server
│   │   └── services/         # Business logic services
│   ├── shared/
│   │   ├── types/            # Shared TypeScript types
│   │   ├── utils/            # Shared utilities
│   │   ├── constants/        # Shared constants
│   │   └── validators/        # Zod schemas
│   └── config/
│       ├── eslint/           # ESLint configs
│       ├── prettier/          # Prettier configs
│       └── tsconfig/          # TypeScript configs
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   └── Dockerfile
├── packages/backend/api/package.json
├── packages/backend/ws/package.json
├── packages/frontend/web/package.json
├── packages/frontend/desktop/package.json
├── packages/frontend/mobile/pubspec.yaml
├── pnpm-workspace.yaml
├── package.json
└── turbo.json                 # Build orchestrator
```

### 2.3 package.json gốc (root)

```json
{
  "name": "selfhostchat",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "dev:web": "pnpm --filter @selfhostchat/web dev",
    "dev:desktop": "pnpm --filter @selfhostchat/desktop dev",
    "dev:api": "pnpm --filter @selfhostchat/api dev",
    "dev:ws": "pnpm --filter @selfhostchat/ws dev",
    "dev:mobile": "pnpm --filter @selfhostchat/mobile run dev"
  },
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0"
  }
}
```

### 2.4 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 2.5 Shared Types Package

```typescript
// packages/shared/types/src/index.ts

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members?: string[]; // for direct messages
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  replyTo?: string;
  editedAt?: Date;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

// Real-time event types
export interface WsEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export type MessageEvent = WsEvent<{
  action: 'create' | 'update' | 'delete';
  message: Message;
}>;

export type ChannelEvent = WsEvent<{
  action: 'create' | 'update' | 'delete';
  channel: Channel;
}>;

export type PresenceEvent = WsEvent<{
  userId: string;
  status: 'online' | 'offline' | 'away';
}>;
```

### 2.6 Checklist

- [ ] Initialize pnpm workspace
- [ ] Setup turbo build orchestrator
- [ ] Create shared types package
- [ ] Create shared utils package
- [ ] Create shared validators (Zod) package
- [ ] Setup ESLint + Prettier
- [ ] Setup GitHub Actions CI/CD
- [ ] Setup Docker development environment

---

## 3. Giai đoạn 2: Backend Core - API & WebSocket

### 3.1 Mục tiêu
- [ ] Xây dựng HonoJS REST API
- [ ] Xây dựng WebSocket server
- [ ] Kết nối MongoDB với Mongoose
- [ ] Thiết lập Redis cho cache và pub/sub
- [ ] Thiết lập RabbitMQ cho job queue

### 3.2 Cấu trúc Backend

```
packages/backend/
├── api/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── app.ts                # Hono app setup
│   │   ├── routes/
│   │   │   ├── auth.ts           # Auth routes
│   │   │   ├── users.ts          # User routes
│   │   │   ├── workspaces.ts     # Workspace routes
│   │   │   ├── channels.ts       # Channel routes
│   │   │   ├── messages.ts       # Message routes
│   │   │   └── files.ts          # File upload routes
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT auth middleware
│   │   │   ├── rateLimit.ts      # Rate limiting
│   │   │   ├── cors.ts           # CORS
│   │   │   └── error.ts          # Error handling
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── workspace.service.ts
│   │   │   ├── channel.service.ts
│   │   │   └── message.service.ts
│   │   ├── models/               # Mongoose models
│   │   │   ├── user.model.ts
│   │   │   ├── workspace.model.ts
│   │   │   ├── channel.model.ts
│   │   │   └── message.model.ts
│   │   ├── db/
│   │   │   └── mongodb.ts        # MongoDB connection
│   │   └── utils/
│   │       └── jwt.ts
│   └── package.json
├── ws/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── server.ts             # WebSocket server
│   │   ├── handlers/
│   │   │   ├── auth.handler.ts
│   │   │   ├── channel.handler.ts
│   │   │   ├── message.handler.ts
│   │   │   └── presence.handler.ts
│   │   ├── services/
│   │   │   ├── redis.service.ts
│   │   │   └── room.service.ts
│   │   └── middleware/
│   │       └── auth.middleware.ts
│   └── package.json
└── services/
    ├── email/
    │   └── src/
    │       ├── index.ts
    │       ├── sender.ts
    │       └── templates/
    └── worker/
        └── src/
            ├── index.ts
            └── processors/
```

### 3.3 HonoJS API Entry Point

```typescript
// packages/backend/api/src/app.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { fromZodError } from 'zod-validation-error';

import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { rateLimitMiddleware } from './middleware/rateLimit';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import workspaceRoutes from './routes/workspaces';
import channelRoutes from './routes/channels';
import messageRoutes from './routes/messages';
import fileRoutes from './routes/files';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use('*', rateLimitMiddleware());

// Error handling
app.onError((err, c) => {
  return errorHandler(err, c);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// API routes (protected)
app.use('/api/*', authMiddleware());

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1/workspaces', workspaceRoutes);
app.route('/api/v1/channels', channelRoutes);
app.route('/api/v1/messages', messageRoutes);
app.route('/api/v1/files', fileRoutes);

export default app;
```

### 3.4 MongoDB Models

```typescript
// packages/backend/api/src/models/user.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  workspaces: string[]; // workspace IDs
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String },
  workspaces: [{ type: Schema.Types.ObjectId, ref: 'Workspace' }],
}, {
  timestamps: true,
});

userSchema.index({ email: 1 });
userSchema.index({ workspaces: 1 });

export const User = model<IUser>('User', userSchema);

// packages/backend/api/src/models/channel.model.ts
export interface IChannel extends Document {
  _id: string;
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members: string[]; // user IDs for direct messages
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['public', 'private', 'direct'], default: 'public' },
  members: [{ type: String }],
  lastMessageAt: { type: Date },
}, {
  timestamps: true,
});

channelSchema.index({ workspaceId: 1, type: 1 });
channelSchema.index({ members: 1 });

export const Channel = model<IChannel>('Channel', channelSchema);

// packages/backend/api/src/models/message.model.ts
export interface IMessage extends Document {
  _id: string;
  channelId: string;
  senderId: string;
  content: string;
  attachments: {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
  replyTo?: string;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  attachments: [{
    id: String,
    filename: String,
    mimeType: String,
    size: Number,
    url: String,
  }],
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  editedAt: { type: Date },
}, {
  timestamps: true,
});

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });

export const Message = model<IMessage>('Message', messageSchema);
```

### 3.5 WebSocket Server

```typescript
// packages/backend/ws/src/server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import Redis from 'ioredis';
import { verifyToken } from './middleware/auth.middleware';

interface Client {
  ws: WebSocket;
  userId: string;
  channels: Set<string>;
}

class WSServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private redis: Redis;
  private redisSub: Redis;

  constructor(port: number) {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    this.redis = new Redis(process.env.REDIS_URL!);
    this.redisSub = new Redis(process.env.REDIS_URL!);

    this.setupRedisSubscription();
    this.setupServer();
    server.listen(port);
  }

  private setupServer() {
    this.wss.on('connection', async (ws, req) => {
      // Authenticate
      const token = this.extractToken(req);
      if (!token) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      const payload = await verifyToken(token);
      if (!payload) {
        ws.close(4001, 'Invalid token');
        return;
      }

      const client: Client = {
        ws,
        userId: payload.userId,
        channels: new Set(),
      };
      this.clients.set(payload.userId, client);

      // Handle incoming messages
      ws.on('message', (data) => this.handleMessage(client, data));

      // Handle disconnection
      ws.on('close', () => this.handleDisconnect(client));

      // Broadcast online status
      this.broadcastPresence(payload.userId, 'online');
    });
  }

  private async setupRedisSubscription() {
    this.redisSub.subscribe('channel:*', 'presence:*');

    this.redisSub.on('message', (channel, message) => {
      const [prefix, ...rest] = channel.split(':');
      const roomId = rest.join(':');

      if (prefix === 'channel') {
        // Broadcast to room subscribers
        this.broadcastToRoom(roomId, JSON.parse(message));
      } else if (prefix === 'presence') {
        this.broadcastPresenceUpdate(JSON.parse(message));
      }
    });
  }

  private handleMessage(client: Client, data: WebSocket.Data) {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'join_channel':
          client.channels.add(msg.channelId);
          client.ws.send(JSON.stringify({
            type: 'joined_channel',
            channelId: msg.channelId,
          }));
          break;

        case 'leave_channel':
          client.channels.delete(msg.channelId);
          break;

        case 'message':
          this.handleChatMessage(client, msg);
          break;

        case 'typing':
          this.broadcastToRoom(msg.channelId, {
            type: 'user_typing',
            userId: client.userId,
            channelId: msg.channelId,
          });
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  private async handleChatMessage(client: Client, msg: any) {
    // Save message to MongoDB via API or direct connection
    const message = {
      id: generateId(),
      channelId: msg.channelId,
      senderId: client.userId,
      content: msg.content,
      attachments: msg.attachments || [],
      createdAt: new Date().toISOString(),
    };

    // Publish to Redis for other server instances
    await this.redis.publish(
      `channel:${msg.channelId}`,
      JSON.stringify({
        type: 'new_message',
        message,
      })
    );

    // Send confirmation to sender
    client.ws.send(JSON.stringify({
      type: 'message_sent',
      message,
    }));
  }

  private broadcastToRoom(roomId: string, event: any) {
    this.clients.forEach((client) => {
      if (client.channels.has(roomId) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(event));
      }
    });
  }

  private async broadcastPresence(userId: string, status: string) {
    await this.redis.publish(
      'presence:global',
      JSON.stringify({ userId, status })
    );
  }

  private handleDisconnect(client: Client) {
    this.clients.delete(client.userId);
    this.broadcastPresence(client.userId, 'offline');
  }

  private extractToken(req: any): string | null {
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }
}

export { WSServer };
```

### 3.6 RabbitMQ Job Queue

```typescript
// packages/backend/services/worker/src/index.ts
import amqp, { Connection, Channel } from 'amqplib';
import { sendEmail } from './processors/email.processor';
import { processFile } from './processors/file.processor';
import { sendPushNotification } from './processors/push.processor';

class Worker {
  private connection: Connection;
  private channel: Channel;

  async start() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();

    // Declare queues
    await this.channel.assertQueue('email');
    await this.channel.assertQueue('file-process');
    await this.channel.assertQueue('push-notification');

    // Consume messages
    this.channel.consume('email', sendEmail);
    this.channel.consume('file-process', processFile);
    this.channel.consume('push-notification', sendPushNotification);
  }
}

export { Worker };
```

### 3.7 Docker Compose cho Backend

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: packages/backend/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/selfhostchat
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbit:5672
      - JWT_SECRET=${JWT_SECRET}
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
    depends_on:
      - mongo
      - redis
      - rabbit
      - minio

  ws:
    build:
      context: .
      dockerfile: packages/backend/ws/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis

  worker:
    build:
      context: .
      dockerfile: packages/backend/services/worker/Dockerfile
    environment:
      - NODE_ENV=development
      - RABBITMQ_URL=amqp://rabbit:5672
      - MONGODB_URI=mongodb://mongo:27017/selfhostchat
      - MINIO_ENDPOINT=minio:9000
    depends_on:
      - rabbit
      - mongo
      - minio

  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbit:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbit_data:/var/lib/rabbitmq

  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ACCESS_KEY}
      - MINIO_ROOT_PASSWORD=${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"

volumes:
  mongo_data:
  redis_data:
  rabbit_data:
  minio_data:
```

### 3.8 Checklist

- [ ] Setup HonoJS API project
- [ ] Setup WebSocket server project
- [ ] Create MongoDB models (User, Workspace, Channel, Message)
- [ ] Implement JWT authentication
- [ ] Implement basic CRUD routes
- [ ] Setup Redis for pub/sub
- [ ] Setup RabbitMQ worker
- [ ] Create Docker Compose configuration
- [ ] Test API endpoints với Postman/curl
- [ ] Test WebSocket connections

---

## 4. Giai đoạn 3: Frontend Web - Vue + Vite

### 4.1 Mục tiêu
- [ ] Xây dựng Vue 3 SPA với Composition API
- [ ] Thiết lập Pinia cho state management
- [ ] Xây dựng UI components cơ bản
- [ ] Kết nối REST API
- [ ] Kết nối WebSocket

### 4.2 Cấu trúc Frontend

```
packages/frontend/web/
├── src/
│   ├── main.ts                 # Entry point
│   ├── App.vue                 # Root component
│   ├── router/
│   │   └── index.ts           # Vue Router setup
│   ├── stores/
│   │   ├── auth.store.ts       # Auth state
│   │   ├── workspace.store.ts  # Workspace state
│   │   ├── channel.store.ts    # Channel state
│   │   ├── message.store.ts     # Message state
│   │   └── socket.store.ts     # WebSocket state
│   ├── composables/
│   │   ├── useApi.ts           # API calls
│   │   ├── useSocket.ts       # WebSocket connection
│   │   ├── useAuth.ts         # Auth logic
│   │   └── useMedia.ts        # Media handling
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.vue
│   │   │   ├── Input.vue
│   │   │   ├── Modal.vue
│   │   │   └── Avatar.vue
│   │   ├── layout/
│   │   │   ├── Sidebar.vue
│   │   │   ├── Header.vue
│   │   │   └── Layout.vue
│   │   ├── workspace/
│   │   │   ├── WorkspaceList.vue
│   │   │   └── WorkspaceCard.vue
│   │   ├── channel/
│   │   │   ├── ChannelList.vue
│   │   │   ├── ChannelItem.vue
│   │   │   └── ChannelHeader.vue
│   │   └── message/
│   │       ├── MessageList.vue
│   │       ├── MessageItem.vue
│   │       ├── MessageInput.vue
│   │       └── TypingIndicator.vue
│   ├── views/
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   └── RegisterView.vue
│   │   ├── workspace/
│   │   │   └── WorkspaceView.vue
│   │   └── channel/
│   │       └── ChannelView.vue
│   ├── services/
│   │   ├── api.ts             # API client
│   │   ├── socket.ts           # WebSocket client
│   │   └── storage.ts         # MinIO client
│   └── styles/
│       ├── main.css
│       └── variables.css
├── index.html
├── vite.config.ts
└── package.json
```

### 4.3 State Management (Pinia)

```typescript
// packages/frontend/web/src/stores/auth.store.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import type { User, LoginRequest, RegisterRequest } from '@selfhostchat/shared-types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  async function login(credentials: LoginRequest) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/login', credentials);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return true;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(data: RegisterRequest) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post<{ user: User; token: string }>('/auth/register', data);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem('token', response.token);
      return true;
    } catch (e: any) {
      error.value = e.message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  async function fetchUser() {
    if (!token.value) return;
    try {
      user.value = await api.get<User>('/users/me');
    } catch {
      await logout();
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
  };
});

// packages/frontend/web/src/stores/channel.store.ts
export const useChannelStore = defineStore('channel', () => {
  const channels = ref<Channel[]>([]);
  const activeChannelId = ref<string | null>(null);
  const loading = ref(false);

  const activeChannel = computed(() =>
    channels.value.find(c => c.id === activeChannelId.value)
  );

  async function fetchChannels(workspaceId: string) {
    loading.value = true;
    try {
      channels.value = await api.get<Channel[]>(`/workspaces/${workspaceId}/channels`);
    } finally {
      loading.value = false;
    }
  }

  async function createChannel(workspaceId: string, data: CreateChannelRequest) {
    const channel = await api.post<Channel>(`/workspaces/${workspaceId}/channels`, data);
    channels.value.push(channel);
    return channel;
  }

  function setActiveChannel(channelId: string) {
    activeChannelId.value = channelId;
  }

  return {
    channels,
    activeChannelId,
    activeChannel,
    loading,
    fetchChannels,
    createChannel,
    setActiveChannel,
  };
});

// packages/frontend/web/src/stores/socket.store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useMessageStore } from './message.store';

export const useSocketStore = defineStore('socket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);
  const typingUsers = ref<Map<string, string[]>>(new Map());

  function connect(token: string) {
    socket.value = io(process.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.value.on('connect', () => {
      connected.value = true;
      console.log('WebSocket connected');
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('WebSocket disconnected');
    });

    socket.value.on('new_message', (data) => {
      const messageStore = useMessageStore();
      messageStore.addMessage(data.message);
    });

    socket.value.on('user_typing', (data) => {
      const { channelId, userId } = data;
      const current = typingUsers.value.get(channelId) || [];
      if (!current.includes(userId)) {
        typingUsers.value.set(channelId, [...current, userId]);
      }
    });

    socket.value.on('joined_channel', (data) => {
      console.log('Joined channel:', data.channelId);
    });
  }

  function disconnect() {
    socket.value?.disconnect();
    socket.value = null;
    connected.value = false;
  }

  function joinChannel(channelId: string) {
    socket.value?.emit('join_channel', { channelId });
  }

  function leaveChannel(channelId: string) {
    socket.value?.emit('leave_channel', { channelId });
  }

  function sendMessage(channelId: string, content: string, attachments?: any[]) {
    socket.value?.emit('message', { channelId, content, attachments });
  }

  function sendTyping(channelId: string) {
    socket.value?.emit('typing', { channelId });
  }

  return {
    socket,
    connected,
    typingUsers,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    sendMessage,
    sendTyping,
  };
});
```

### 4.4 API Service

```typescript
// packages/frontend/web/src/services/api.ts
import type { ZodSchema } from 'zod';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    schema?: ZodSchema<T>
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return schema ? schema.parse(data) : data;
  }

  get<T>(path: string, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>('GET', path, undefined, schema);
  }

  post<T>(path: string, body: unknown, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>('POST', path, body, schema);
  }

  put<T>(path: string, body: unknown, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>('PUT', path, body, schema);
  }

  patch<T>(path: string, body: unknown, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>('PATCH', path, body, schema);
  }

  delete<T>(path: string, schema?: ZodSchema<T>): Promise<T> {
    return this.request<T>('DELETE', path, undefined, schema);
  }
}

export const api = new ApiClient(BASE_URL);
```

### 4.5 Vue Router Setup

```typescript
// packages/frontend/web/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.store';

const routes = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('../views/auth/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('../views/auth/LoginView.vue'),
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('../views/auth/RegisterView.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('../views/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/workspace',
      },
      {
        path: 'workspace/:workspaceId',
        name: 'workspace',
        component: () => import('../views/workspace/WorkspaceView.vue'),
        children: [
          {
            path: 'channel/:channelId',
            name: 'channel',
            component: () => import('../views/channel/ChannelView.vue'),
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
  } else if (to.path.startsWith('/auth') && authStore.isAuthenticated) {
    next({ name: 'workspace' });
  } else {
    next();
  }
});

export default router;
```

### 4.6 Key Components

```vue
<!-- packages/frontend/web/src/views/channel/ChannelView.vue -->
<template>
  <div class="channel-view">
    <ChannelHeader :channel="channel" />
    <MessageList
      :messages="messages"
      :loading="loading"
      @load-more="loadMoreMessages"
    />
    <TypingIndicator :users="typingUsers" />
    <MessageInput
      v-model="newMessage"
      :channel-id="channelId"
      :sending="sending"
      @send="sendMessage"
      @typing="onTyping"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useChannelStore } from '@/stores/channel.store';
import { useMessageStore } from '@/stores/message.store';
import { useSocketStore } from '@/stores/socket.store';
import ChannelHeader from '@/components/channel/ChannelHeader.vue';
import MessageList from '@/components/message/MessageList.vue';
import MessageInput from '@/components/message/MessageInput.vue';
import TypingIndicator from '@/components/message/TypingIndicator.vue';

const route = useRoute();
const channelStore = useChannelStore();
const messageStore = useMessageStore();
const socketStore = useSocketStore();

const newMessage = ref('');
const sending = ref(false);

const channelId = computed(() => route.params.channelId as string);
const channel = computed(() => channelStore.activeChannel);
const messages = computed(() => messageStore.messages);
const loading = computed(() => messageStore.loading);
const typingUsers = computed(() => socketStore.typingUsers.get(channelId.value) || []);

watch(channelId, async (newId, oldId) => {
  if (oldId) {
    socketStore.leaveChannel(oldId);
  }
  if (newId) {
    channelStore.setActiveChannel(newId);
    await messageStore.fetchMessages(newId);
    socketStore.joinChannel(newId);
  }
}, { immediate: true });

onUnmounted(() => {
  if (channelId.value) {
    socketStore.leaveChannel(channelId.value);
  }
});

async function sendMessage() {
  if (!newMessage.value.trim() || sending.value) return;

  sending.value = true;
  try {
    socketStore.sendMessage(channelId.value, newMessage.value);
    newMessage.value = '';
  } finally {
    sending.value = false;
  }
}

let typingTimeout: number;
function onTyping() {
  socketStore.sendTyping(channelId.value);
}
</script>
```

### 4.7 Checklist

- [ ] Setup Vue 3 + Vite project
- [ ] Install and configure Pinia
- [ ] Install and configure Vue Router
- [ ] Create shared types integration
- [ ] Build auth pages (login, register)
- [ ] Build workspace pages
- [ ] Build channel list component
- [ ] Build message list component
- [ ] Build message input component
- [ ] Integrate WebSocket client
- [ ] Implement real-time messaging
- [ ] Style with CSS variables

---

## 5. Giai đoạn 4: Desktop App - Electron

### 5.1 Mục tiêu
- [ ] Xây dựng Electron app wrapper
- [ ] Kết nối native features (notifications, tray)
- [ ] Setup auto-update
- [ ] Build signing và distribution

### 5.2 Cấu trúc Desktop

```
packages/frontend/desktop/
├── electron/
│   ├── main/
│   │   ├── index.ts            # Main process entry
│   │   ├── window.ts           # Window management
│   │   ├── tray.ts             # System tray
│   │   ├── notifications.ts    # Native notifications
│   │   ├── updater.ts          # Auto-updater
│   │   └── ipc.ts              # IPC handlers
│   ├── preload/
│   │   └── index.ts            # Preload script
│   └── resources/
│       └── icon.png
├── src/                        # Same as web app
│   ├── main.ts
│   └── ...
├── vite.config.ts              # Vite + electron-vite config
└── package.json
```

### 5.3 Electron Main Process

```typescript
// packages/frontend/desktop/electron/main/index.ts
import { app, BrowserWindow, Tray, Menu, nativeImage, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';

class ElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  private isQuitting = false;

  async start() {
    await this.createWindow();
    this.createTray();
    this.setupAutoUpdater();

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    app.on('before-quit', () => {
      this.isQuitting = true;
    });
  }

  private async createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      title: 'SelfHostChat',
      icon: path.join(__dirname, '../resources/icon.png'),
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
      await this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    // Minimize to tray instead of closing
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });
  }

  private createTray() {
    const icon = nativeImage.createFromPath(
      path.join(__dirname, '../resources/icon.png')
    );
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open SelfHostChat',
        click: () => {
          this.mainWindow?.show();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setToolTip('SelfHostChat');
    this.tray.setContextMenu(contextMenu);

    this.tray.on('click', () => {
      this.mainWindow?.show();
    });
  }

  private setupAutoUpdater() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', () => {
      new Notification({
        title: 'Update Available',
        body: 'A new version is being downloaded.',
      }).show();
    });

    autoUpdater.on('update-downloaded', () => {
      new Notification({
        title: 'Update Ready',
        body: 'Restart to apply the update.',
      }).show();
    });

    autoUpdater.on('error', (err) => {
      console.error('Auto-updater error:', err);
    });

    // Check for updates
    if (process.env.NODE_ENV === 'production') {
      autoUpdater.checkForUpdatesAndNotify();
    }
  }
}

const electronApp = new ElectronApp();
electronApp.start();
```

### 5.4 Preload Script

```typescript
// packages/frontend/desktop/electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // Notifications
  showNotification: (title: string, body: string) => {
    new Notification({ title, body }).show();
  },

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Updates
  onUpdateAvailable: (callback: () => void) => {
    ipcRenderer.on('update:available', callback);
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on('update:downloaded', callback);
  },

  // App lifecycle
  onAppReady: (callback: () => void) => {
    ipcRenderer.on('app:ready', callback);
  },
});
```

### 5.5 Vite Config cho Electron

```typescript
// packages/frontend/desktop/vite.config.ts
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    electron({
      entry: 'electron/main/index.ts',
      preload: 'electron/preload/index.ts',
      vite: {
        build: {
          outDir: 'dist-electron',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

### 5.6 Checklist

- [ ] Setup electron-vite project
- [ ] Configure main process
- [ ] Configure preload script
- [ ] Implement system tray
- [ ] Implement native notifications
- [ ] Implement window management
- [ ] Setup auto-updater
- [ ] Build macOS app
- [ ] Build Windows app
- [ ] Test distribution

---

## 6. Giai đoạn 5: Mobile App - Flutter

### 6.1 Mục tiêu
- [ ] Xây dựng Flutter app
- [ ] Sử dụng Riverpod cho state management
- [ ] Kết nối REST API
- [ ] Kết nối WebSocket
- [ ] Build iOS và Android

### 6.2 Cấu trúc Flutter

```
packages/frontend/mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart
│   │   │   └── api_config.dart
│   │   ├── socket/
│   │   │   └── socket_service.dart
│   │   ├── storage/
│   │   │   └── local_storage.dart
│   │   └── constants/
│   │       └── app_constants.dart
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   └── auth_repository.dart
│   │   │   ├── domain/
│   │   │   │   └── auth_provider.dart
│   │   │   └── presentation/
│   │   │       ├── login_screen.dart
│   │   │       └── register_screen.dart
│   │   ├── workspace/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   └── channel/
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── avatar.dart
│   │   │   ├── button.dart
│   │   │   └── loading.dart
│   │   └── theme/
│   │       └── app_theme.dart
│   └── models/
│       ├── user.dart
│       ├── workspace.dart
│       ├── channel.dart
│       └── message.dart
├── pubspec.yaml
└── android/ios/
```

### 6.3 pubspec.yaml

```yaml
name: selfhostchat
description: Self-hosted chat application
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.3.0

  # Routing
  go_router: ^13.0.0

  # Networking
  dio: ^5.4.0
  web_socket_channel: ^2.4.0

  # Local Storage
  shared_preferences: ^2.2.0
  hive: ^2.2.0

  # UI
  flutter_animate: ^4.3.0
  cached_network_image: ^3.3.0
  photo_view: ^0.14.0

  # Utilities
  intl: ^0.18.0
  uuid: ^4.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
  build_runner: ^2.4.0
  riverpod_generator: ^2.3.0

flutter:
  uses-material-design: true
```

### 6.4 API Client (Flutter)

```dart
// packages/frontend/mobile/lib/core/api/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/local_storage.dart';

class ApiClient {
  final Dio _dio;
  final LocalStorage _storage;

  ApiClient(this._dio, this._storage) {
    _dio.options.baseUrl = const String.fromEnvironment('API_URL', defaultValue: 'http://localhost:3000');
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Handle token expiration
          _storage.clearToken();
        }
        return handler.next(error);
      },
    ));
  }

  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> post<T>(String path, {dynamic data}) {
    return _dio.post<T>(path, data: data);
  }

  Future<Response<T>> put<T>(String path, {dynamic data}) {
    return _dio.put<T>(path, data: data);
  }

  Future<Response<T>> delete<T>(String path) {
    return _dio.delete<T>(path);
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = Dio();
  final storage = ref.watch(localStorageProvider);
  return ApiClient(dio, storage);
});
```

### 6.5 WebSocket Service (Flutter)

```dart
// packages/frontend/mobile/lib/core/socket/socket_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../api/api_config.dart';

class SocketMessage {
  final String type;
  final dynamic payload;
  SocketMessage(this.type, this.payload);
}

class SocketService extends StateNotifier<bool> {
  WebSocketChannel? _channel;
  final _messageController = StreamController<SocketMessage>.broadcast();
  final String _token;
  bool _shouldReconnect = true;

  SocketService(this._token) : super(false);

  Stream<SocketMessage> get messages => _messageController.stream;

  void connect() {
    final wsUrl = const String.fromEnvironment('WS_URL', defaultValue: 'ws://localhost:3001');
    final uri = Uri.parse('$wsUrl?token=$_token');

    _channel = WebSocketChannel.connect(uri);

    _channel!.stream.listen(
      (data) {
        final json = jsonDecode(data as String);
        _messageController.add(SocketMessage(json['type'], json['payload']));
        state = true;
      },
      onError: (error) {
        state = false;
        _reconnect();
      },
      onDone: () {
        state = false;
        if (_shouldReconnect) {
          _reconnect();
        }
      },
    );
  }

  void _reconnect() {
    Future.delayed(const Duration(seconds: 3), () {
      if (_shouldReconnect && !state) {
        connect();
      }
    });
  }

  void send(String type, Map<String, dynamic> payload) {
    if (state) {
      _channel?.sink.add(jsonEncode({
        'type': type,
        'payload': payload,
      }));
    }
  }

  void joinChannel(String channelId) {
    send('join_channel', {'channelId': channelId});
  }

  void leaveChannel(String channelId) {
    send('leave_channel', {'channelId': channelId});
  }

  void sendMessage(String channelId, String content) {
    send('message', {'channelId': channelId, 'content': content});
  }

  void disconnect() {
    _shouldReconnect = false;
    _channel?.sink.close();
    _channel = null;
    state = false;
  }

  @override
  void dispose() {
    disconnect();
    _messageController.close();
    super.dispose();
  }
}

final socketServiceProvider = StateNotifierProvider<SocketService, bool>((ref) {
  // Get token from storage
  final token = ''; // Get from auth provider
  return SocketService(token);
});
```

### 6.6 Auth Provider (Riverpod)

```dart
// packages/frontend/mobile/lib/features/auth/domain/auth_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../../../core/storage/local_storage.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repository;
  final LocalStorage _storage;

  AuthNotifier(this._repository, this._storage) : super(const AuthState());

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _repository.login(email, password);
      await _storage.saveToken(result.token);
      state = state.copyWith(user: result.user, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    await _storage.clearToken();
    state = const AuthState();
  }

  Future<void> checkAuth() async {
    final token = await _storage.getToken();
    if (token != null) {
      try {
        final user = await _repository.getCurrentUser();
        state = state.copyWith(user: user);
      } catch {
        await _storage.clearToken();
      }
    }
  }
}

final authRepositoryProvider = Provider((ref) => AuthRepository(ref.watch(apiClientProvider)));
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authRepositoryProvider),
    ref.watch(localStorageProvider),
  );
});
```

### 6.7 Checklist

- [ ] Initialize Flutter project
- [ ] Setup Riverpod
- [ ] Setup GoRouter
- [ ] Create API client
- [ ] Create WebSocket service
- [ ] Build auth screens
- [ ] Build workspace list screen
- [ ] Build channel list screen
- [ ] Build chat screen
- [ ] Implement push notifications
- [ ] Build iOS app
- [ ] Build Android app

---

## 7. Giai đoạn 6: Real-time Sync & Collaboration

### 7.1 Mục tiêu
- [ ] Implement presence system
- [ ] Implement typing indicators
- [ ] Implement message sync
- [ ] Handle offline mode
- [ ] Implement message reactions

### 7.2 Presence System

```typescript
// Backend: Presence service
// packages/backend/ws/src/services/presence.service.ts
import Redis from 'ioredis';

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentChannel?: string;
}

class PresenceService {
  private redis: Redis;
  private presenceKey = 'presence:';

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async setPresence(userId: string, status: UserPresence['status']) {
    const key = `${this.presenceKey}${userId}`;
    const data: UserPresence = {
      userId,
      status,
      lastSeen: new Date(),
    };
    await this.redis.set(key, JSON.stringify(data), 'EX', 300); // 5 min TTL
  }

  async getPresence(userId: string): Promise<UserPresence | null> {
    const data = await this.redis.get(`${this.presenceKey}${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async getWorkspacePresence(workspaceId: string): Promise<UserPresence[]> {
    const keys = await this.redis.keys(`${this.presenceKey}*`);
    const users: UserPresence[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const presence = JSON.parse(data) as UserPresence;
        // Check if user is in workspace
        users.push(presence);
      }
    }

    return users;
  }

  async heartbeat(userId: string) {
    await this.setPresence(userId, 'online');
  }
}

export { PresenceService, UserPresence };
```

### 7.3 Message Reactions

```typescript
// Backend: Reaction model
// packages/backend/api/src/models/reaction.model.ts
import { Schema, model } from 'mongoose';

export interface IReaction {
  _id: string;
  messageId: string;
  userId: string;
  emoji: string; // Unicode emoji or shortcode
  createdAt: Date;
}

const reactionSchema = new Schema<IReaction>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  emoji: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

reactionSchema.index({ messageId: 1, emoji: 1 }, { unique: true });

export const Reaction = model<IReaction>('Reaction', reactionSchema);

// API route
app.post('/messages/:messageId/reactions', async (c) => {
  const messageId = c.req.param('messageId');
  const { emoji } = await c.req.json();
  const userId = c.get('userId');

  const reaction = await Reaction.create({ messageId, userId, emoji });

  // Broadcast reaction
  await redis.publish(`channel:${channelId}`, JSON.stringify({
    type: 'reaction_added',
    reaction,
  }));

  return c.json(reaction);
});
```

### 7.4 Offline Message Queue

```typescript
// packages/backend/ws/src/services/offline-queue.service.ts
import MongoDB from 'mongodb';

interface OfflineMessage {
  userId: string;
  channelId: string;
  message: any;
  timestamp: Date;
}

class OfflineQueueService {
  private collection: MongoDB.Collection;

  constructor(db: MongoDB.Database) {
    this.collection = db.collection('offline_queue');
  }

  async queueMessage(userId: string, channelId: string, message: any) {
    await this.collection.insertOne({
      userId,
      channelId,
      message,
      timestamp: new Date(),
    });
  }

  async getQueuedMessages(userId: string): Promise<OfflineMessage[]> {
    const messages = await this.collection
      .find({ userId })
      .sort({ timestamp: 1 })
      .toArray();

    // Clear queue
    await this.collection.deleteMany({ userId });

    return messages;
  }
}
```

### 7.5 Checklist

- [ ] Implement presence tracking
- [ ] Implement typing indicators
- [ ] Implement message reactions
- [ ] Implement message edit/delete
- [ ] Implement offline message queue
- [ ] Implement message threading
- [ ] Implement message search

---

## 8. Giai đoạn 7: Storage & Media

### 8.1 Mục tiêu
- [ ] Setup MinIO/S3-compatible storage
- [ ] Implement file upload/download
- [ ] Implement image preview
- [ ] Implement file type validation
- [ ] Implement storage quotas

### 8.2 MinIO Client (Backend)

```typescript
// packages/backend/api/src/services/storage.service.ts
import { Client } from 'minio';

class StorageService {
  private client: Client;
  private bucket = 'selfhostchat';

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT!,
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });
  }

  async init() {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      // Set bucket policy for public read
      await this.client.setBucketPolicy(this.bucket, JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`],
          },
        ],
      }));
    }
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const objectName = `uploads/${Date.now()}-${filename}`;
    await this.client.putObject(
      this.bucket,
      objectName,
      file,
      undefined,
      contentType
    );
    return objectName;
  }

  async getSignedUrl(objectName: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, objectName, expirySeconds);
  }

  async getUploadSignedUrl(objectName: string, contentType: string): Promise<string> {
    return this.client.presignedPutObject(this.bucket, objectName, 3600, undefined, contentType);
  }

  async deleteFile(objectName: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectName);
  }
}

export { StorageService };
```

### 8.3 File Upload API

```typescript
// packages/backend/api/src/routes/files.ts
import { Hono } from 'hono';
import { z } from 'zod';
import { StorageService } from '../services/storage.service';

const files = new Hono();
const storage = new StorageService();

const uploadSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
});

// Direct upload (for small files)
files.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'] as File;

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const objectName = await storage.uploadFile(
    buffer,
    file.name,
    file.type
  );

  const url = await storage.getSignedUrl(objectName);

  return c.json({
    id: objectName,
    filename: file.name,
    url,
    size: file.size,
    mimeType: file.type,
  });
});

// Presigned URL upload (for large files / direct to MinIO)
files.post('/presigned-upload', async (c) => {
  const { filename, contentType } = await c.req.json();

  const objectName = `uploads/${Date.now()}-${filename}`;
  const uploadUrl = await storage.getUploadSignedUrl(objectName, contentType);

  return c.json({
    objectName,
    uploadUrl,
  });
});

// Get file URL
files.get('/:objectName', async (c) => {
  const objectName = c.req.param('objectName');
  const url = await storage.getSignedUrl(objectName);
  return c.json({ url });
});

// Delete file
files.delete('/:objectName', async (c) => {
  const objectName = c.req.param('objectName');
  await storage.deleteFile(objectName);
  return c.json({ success: true });
});

export default files;
```

### 8.4 Checklist

- [ ] Setup MinIO server
- [ ] Implement upload API
- [ ] Implement presigned URL upload
- [ ] Implement image/video preview
- [ ] Implement file type validation
- [ ] Implement storage quotas
- [ ] Implement CDN integration

---

## 9. Giai đoạn 8: Authentication & Permissions

### 9.1 Mục tiêu
- [ ] Implement JWT authentication
- [ ] Implement OAuth providers (Google, GitHub)
- [ ] Implement role-based permissions
- [ ] Implement workspace permissions
- [ ] Implement channel permissions

### 9.2 JWT Auth Service

```typescript
// packages/backend/api/src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

class AuthService {
  private jwtSecret: string;
  private jwtExpiry = '7d';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');
    return timingSafeEqual(derivedKey, keyBuffer);
  }

  generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
    });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch {
      return null;
    }
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId, type: 'refresh' }, this.jwtSecret, {
      expiresIn: '30d',
    });
  }
}

export const authService = new AuthService();
```

### 9.3 Permission System

```typescript
// packages/backend/api/src/services/permission.service.ts
import { Workspace, Channel, User } from '../models';

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum Permission {
  // Workspace
  WORKSPACE_MANAGE = 'workspace:manage',
  WORKSPACE_INVITE = 'workspace:invite',
  WORKSPACE_SETTINGS = 'workspace:settings',

  // Channel
  CHANNEL_CREATE = 'channel:create',
  CHANNEL_MANAGE = 'channel:manage',
  CHANNEL_DELETE = 'channel:delete',

  // Message
  MESSAGE_CREATE = 'message:create',
  MESSAGE_EDIT = 'message:edit',
  MESSAGE_DELETE = 'message:delete',
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.WORKSPACE_INVITE,
    Permission.CHANNEL_CREATE,
    Permission.CHANNEL_MANAGE,
    Permission.MESSAGE_CREATE,
    Permission.MESSAGE_EDIT,
    Permission.MESSAGE_DELETE,
  ],
  [Role.MEMBER]: [
    Permission.CHANNEL_CREATE,
    Permission.MESSAGE_CREATE,
    Permission.MESSAGE_EDIT,
    Permission.MESSAGE_DELETE,
  ],
  [Role.GUEST]: [
    Permission.MESSAGE_CREATE,
  ],
};

class PermissionService {
  async getUserRole(userId: string, workspaceId: string): Promise<Role> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (workspace.ownerId.toString() === userId) {
      return Role.OWNER;
    }

    const member = workspace.members.find(
      m => m.userId.toString() === userId
    );

    return member?.role || Role.GUEST;
  }

  async hasPermission(
    userId: string,
    workspaceId: string,
    permission: Permission
  ): Promise<boolean> {
    const role = await this.getUserRole(userId, workspaceId);
    return rolePermissions[role].includes(permission);
  }

  async requirePermission(
    userId: string,
    workspaceId: string,
    permission: Permission
  ): Promise<void> {
    const hasPermission = await this.hasPermission(userId, workspaceId, permission);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }
  }

  async canAccessChannel(
    userId: string,
    workspaceId: string,
    channelId: string
  ): Promise<boolean> {
    const channel = await Channel.findById(channelId);
    if (!channel) return false;

    if (channel.type === 'public') {
      return this.hasPermission(userId, workspaceId, Permission.MESSAGE_CREATE);
    }

    if (channel.type === 'private' || channel.type === 'direct') {
      return channel.members.includes(userId);
    }

    return false;
  }
}

export const permissionService = new PermissionService();
```

### 9.4 OAuth Integration

```typescript
// packages/backend/api/src/routes/auth.ts
import { Hono } from 'hono';
import { google, github } from '@lucia-auth/oauth/providers';

const auth = new Hono();

// Google OAuth
auth.get('/oauth/google', async (c) => {
  const googleAuth = google(auth, {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.APP_URL}/auth/oauth/google/callback`,
  });

  const [url, state] = await googleAuth.getAuthorizationUrl();
  // Store state in session for CSRF protection

  return c.redirect(url.toString());
});

auth.get('/oauth/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  const googleAuth = google(auth, {...});
  const tokens = await googleAuth.validateCallback(code);

  // Get user info
  const googleUser = await googleAuth.getUser(tokens);

  // Create or update user
  const user = await findOrCreateOAuthUser({
    provider: 'google',
    providerId: googleUser.sub,
    email: googleUser.email,
    name: googleUser.name,
  });

  const token = authService.generateToken(user.id, user.email);
  return c.redirect(`${process.env.APP_URL}/auth/callback?token=${token}`);
});

// GitHub OAuth
auth.get('/oauth/github', async (c) => {
  const githubAuth = github(auth, {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    redirectUri: `${process.env.APP_URL}/auth/oauth/github/callback`,
  });

  const [url, state] = await githubAuth.getAuthorizationUrl();
  return c.redirect(url.toString());
});

export default auth;
```

### 9.5 Checklist

- [ ] Implement JWT authentication
- [ ] Implement password hashing
- [ ] Implement login/register APIs
- [ ] Implement Google OAuth
- [ ] Implement GitHub OAuth
- [ ] Implement role-based permissions
- [ ] Implement workspace invitations
- [ ] Implement channel access control

---

## 10. Giai đoạn 9: Feature Flags & Multi-tenancy

### 10.1 Mục tiêu
- [ ] Implement feature flag system
- [ ] Implement workspace isolation
- [ ] Implement tenant settings
- [ ] Implement Pro/Free tier

### 10.2 Feature Flags

```typescript
// packages/shared/types/src/features.ts
export enum FeatureFlag {
  // Free tier
  MAX_USERS_PER_WORKSPACE = 'max_users_per_workspace',
  MAX_STORAGE_GB = 'max_storage_gb',
  MAX_MESSAGE_HISTORY = 'max_message_history',

  // Pro tier
  AI_SUGGESTIONS = 'ai_suggestions',
  ADVANCED_SEARCH = 'advanced_search',
  CUSTOM_EMOJI = 'custom_emoji',
  PRIORITY_SUPPORT = 'priority_support',

  // Enterprise
  SSO = 'sso',
  AUDIT_LOG = 'audit_log',
  API_ACCESS = 'api_access',
  CUSTOM_BRANDING = 'custom_branding',
}

export interface WorkspacePlan {
  type: 'free' | 'pro' | 'enterprise';
  features: Record<FeatureFlag, boolean | number>;
  limits: {
    users: number;
    storageGb: number;
    messageHistoryDays: number;
  };
}

export const FREE_PLAN: WorkspacePlan = {
  type: 'free',
  features: {
    [FeatureFlag.MAX_USERS_PER_WORKSPACE]: 5,
    [FeatureFlag.MAX_STORAGE_GB]: 5,
    [FeatureFlag.MAX_MESSAGE_HISTORY]: 10000,
    [FeatureFlag.AI_SUGGESTIONS]: false,
    [FeatureFlag.ADVANCED_SEARCH]: false,
    [FeatureFlag.CUSTOM_EMOJI]: false,
    [FeatureFlag.PRIORITY_SUPPORT]: false,
    [FeatureFlag.SSO]: false,
    [FeatureFlag.AUDIT_LOG]: false,
    [FeatureFlag.API_ACCESS]: false,
    [FeatureFlag.CUSTOM_BRANDING]: false,
  },
  limits: {
    users: 5,
    storageGb: 5,
    messageHistoryDays: 30,
  },
};

export const PRO_PLAN: WorkspacePlan = {
  type: 'pro',
  features: {
    [FeatureFlag.MAX_USERS_PER_WORKSPACE]: 50,
    [FeatureFlag.MAX_STORAGE_GB]: 50,
    [FeatureFlag.MAX_MESSAGE_HISTORY]: -1, // unlimited
    [FeatureFlag.AI_SUGGESTIONS]: true,
    [FeatureFlag.ADVANCED_SEARCH]: true,
    [FeatureFlag.CUSTOM_EMOJI]: true,
    [FeatureFlag.PRIORITY_SUPPORT]: true,
    [FeatureFlag.SSO]: false,
    [FeatureFlag.AUDIT_LOG]: false,
    [FeatureFlag.API_ACCESS]: true,
    [FeatureFlag.CUSTOM_BRANDING]: false,
  },
  limits: {
    users: 50,
    storageGb: 50,
    messageHistoryDays: -1,
  },
};

// packages/backend/api/src/services/feature.service.ts
class FeatureService {
  private plans: Record<string, WorkspacePlan> = {
    free: FREE_PLAN,
    pro: PRO_PLAN,
    enterprise: { /* ... */ },
  };

  getPlan(workspaceId: string): WorkspacePlan {
    const workspace = await Workspace.findById(workspaceId);
    return this.plans[workspace.plan] || FREE_PLAN;
  }

  isEnabled(workspaceId: string, feature: FeatureFlag): boolean {
    const plan = this.getPlan(workspaceId);
    return !!plan.features[feature];
  }

  getLimit(workspaceId: string, feature: FeatureFlag): number {
    const plan = this.getPlan(workspaceId);
    const value = plan.features[feature];
    return typeof value === 'number' ? value : 0;
  }

  async checkQuota(workspaceId: string): Promise<boolean> {
    const plan = this.getPlan(workspaceId);

    // Check user count
    const userCount = await Workspace.findById(workspaceId).members.length;
    if (userCount >= plan.limits.users) {
      throw new QuotaExceededError('user_limit');
    }

    // Check storage
    const storageUsed = await this.getStorageUsed(workspaceId);
    if (storageUsed >= plan.limits.storageGb) {
      throw new QuotaExceededError('storage_limit');
    }

    return true;
  }
}
```

### 10.3 Workspace Isolation

```typescript
// packages/backend/api/src/middleware/workspace.middleware.ts
export async function workspaceMiddleware(c: Context, next: Next) {
  const workspaceId = c.req.param('workspaceId') || c.req.header('X-Workspace-ID');

  if (workspaceId) {
    // Verify user has access to this workspace
    const userId = c.get('userId');
    const hasAccess = await permissionService.hasWorkspaceAccess(userId, workspaceId);

    if (!hasAccess) {
      return c.json({ error: 'Workspace not found' }, 404);
    }

    c.set('workspaceId', workspaceId);
  }

  await next();
}

// Usage in routes
app.use('/workspaces/:workspaceId/*', workspaceMiddleware);

app.get('/workspaces/:workspaceId/channels', async (c) => {
  const workspaceId = c.get('workspaceId');
  const channels = await Channel.find({ workspaceId });
  return c.json(channels);
});
```

### 10.4 Checklist

- [ ] Define feature flags
- [ ] Implement plan system
- [ ] Implement quota checking
- [ ] Implement workspace isolation
- [ ] Implement self-hosted Pro unlock
- [ ] Implement settings UI

---

## 11. Giai đoạn 10: Payments & Subscriptions

### 11.1 Mục tiêu
- [ ] Implement Stripe integration
- [ ] Implement checkout flow
- [ ] Implement webhook handlers
- [ ] Implement license key validation (self-hosted)

### 11.2 Stripe Integration

```typescript
// packages/backend/api/src/services/payment.service.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
}

class PaymentService {
  // Create checkout session
  async createCheckoutSession(
    workspaceId: string,
    userId: string,
    priceId: string
  ): Promise<string> {
    const workspace = await Workspace.findById(workspaceId);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/settings/billing?canceled=true`,
      metadata: {
        workspaceId,
        userId,
      },
      subscription_data: {
        metadata: {
          workspaceId,
        },
      },
    });

    return session.url!;
  }

  // Create customer portal session
  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const user = await User.findById(userId);
    const customer = user.stripeCustomerId;

    const session = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
    });

    return session.url;
  }

  // Handle webhook events
  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const { workspaceId } = session.metadata!;

    await Workspace.findByIdAndUpdate(workspaceId, {
      plan: 'pro',
      stripeSubscriptionId: session.subscription,
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const plan = subscription.status === 'active' ? 'pro' : 'free';
    await Workspace.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { plan }
    );
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await Workspace.findOneAndUpdate(
      { stripeSubscriptionId: subscription.id },
      { plan: 'free', stripeSubscriptionId: null }
    );
  }
}

export const paymentService = new PaymentService();
```

### 11.3 Self-Hosted License

```typescript
// packages/backend/api/src/services/license.service.ts
import crypto from 'crypto';

interface LicenseKey {
  key: string;
  plan: 'pro' | 'enterprise';
  maxUsers: number;
  issuedAt: Date;
  expiresAt?: Date;
  issuedTo?: string;
}

class LicenseService {
  private readonly publicKey: string;

  constructor() {
    // Load public key for license validation
    this.publicKey = process.env.LICENSE_PUBLIC_KEY!;
  }

  validateLicenseKey(key: string): LicenseKey | null {
    try {
      // Key format: base64(signature).base64(data)
      const [signatureB64, dataB64] = key.split('.');

      const data = JSON.parse(Buffer.from(dataB64, 'base64').toString());
      const signature = Buffer.from(signatureB64, 'base64');

      // Verify signature
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(dataB64);
      const isValid = verifier.verify(this.publicKey, signature);

      if (!isValid) return null;

      // Check expiration
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        return null;
      }

      return {
        key,
        plan: data.plan,
        maxUsers: data.maxUsers,
        issuedAt: new Date(data.issuedAt),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        issuedTo: data.issuedTo,
      };
    } catch {
      return null;
    }
  }

  activateLicense(key: string, workspaceId: string): boolean {
    const license = this.validateLicenseKey(key);
    if (!license) return false;

    // Check user limit
    const workspace = await Workspace.findById(workspaceId);
    if (workspace.members.length > license.maxUsers) {
      throw new Error(`License supports maximum ${license.maxUsers} users`);
    }

    // Activate license
    workspace.licenseKey = key;
    workspace.plan = license.plan;
    workspace.licenseExpiresAt = license.expiresAt;
    await workspace.save();

    return true;
  }
}

export const licenseService = new LicenseService();
```

### 11.4 Checklist

- [ ] Setup Stripe account
- [ ] Implement checkout flow
- [ ] Implement webhook handlers
- [ ] Implement customer portal
- [ ] Implement license key validation
- [ ] Implement self-hosted Pro unlock
- [ ] Implement billing settings UI

---

## 12. Roadmap Tổng hợp

### 12.1 Timeline Overview

```
Quarter 1: Foundation (Month 1-3)
├── Month 1: Monorepo, Shared Types, Docker
├── Month 2: Backend API, MongoDB, Auth
└── Month 3: WebSocket Server, Redis Pub/Sub

Quarter 2: Frontend Core (Month 4-6)
├── Month 4: Vue Web App - Auth, Layout
├── Month 5: Vue Web App - Channels, Messages
└── Month 6: Real-time Features, Polish

Quarter 3: Multi-Platform (Month 7-9)
├── Month 7: Electron Desktop App
├── Month 8: Flutter Mobile App
└── Month 9: Polish & Testing

Quarter 4: Enterprise Features (Month 10-12)
├── Month 10: Feature Flags, Multi-tenancy
├── Month 11: Payments, Subscriptions
└── Month 12: Documentation, Release
```

### 12.2 Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| **M1** | Basic chat with real-time messaging | Month 3 |
| **M2** | Full web app with auth | Month 5 |
| **M3** | Desktop app (Electron) | Month 7 |
| **M4** | Mobile app (Flutter) | Month 8 |
| **M5** | Feature flags, workspaces | Month 10 |
| **M6** | Payments, subscriptions | Month 11 |
| **M7** | Production release | Month 12 |

### 12.3 Team Requirements

| Role | Phase | Effort |
|------|-------|--------|
| **Backend Dev** | Full-time | 1-2 |
| **Frontend Dev** | Full-time | 1-2 |
| **Mobile Dev** | Phase 3 | 1 |
| **DevOps** | Throughout | 0.5 |
| **Designer** | Phase 2-3 | 0.5 |

### 12.4 Infrastructure Requirements

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| MongoDB Atlas M10 | Production DB | $57/month |
| Redis Cloud 30MB | Cache/PubSub | $0 (free tier) |
| RabbitMQ Cloud | Job Queue | $0 (free tier) |
| MinIO (self-hosted) | File Storage | $20/month (VPS) |
| S3/Cloudflare R2 | CDN | $5/month |
| VPS/Dedicated | Self-hosted | $50-200/month |

---

## Tài liệu tham khảo

- [AFFiNE Architecture](https://deepwiki.com/toeverything/AFFiNE/1.1-architecture-overview)
- [Vue 3 Documentation](https://vuejs.org/)
- [HonoJS](https://hono.dev/)
- [Pinia](https://pinia.vuejs.org/)
- [Electron](https://www.electronjs.org/)
- [Flutter](https://flutter.dev/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/)
- [MinIO](https://min.io/)
