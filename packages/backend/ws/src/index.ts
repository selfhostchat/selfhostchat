import { config } from 'dotenv';
import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken, type JWTPayload } from './utils/jwt.js';

config();
import { Redis } from 'ioredis';

interface Client {
  ws: WebSocket;
  userId: string;
  channels: Set<string>;
}

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class WSServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private redis: Redis;
  private redisSub: Redis;

  constructor() {
    const server = createServer();
    this.wss = new WebSocketServer({ server });
    this.redis = new Redis(REDIS_URL, { lazyConnect: true });
    this.redisSub = new Redis(REDIS_URL, { lazyConnect: true });

    this.setupRedis();
    this.setupServer();
    server.listen(WS_PORT);
    console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`);
  }

  private async setupRedis() {
    try {
      await this.redis.connect();
      await this.redisSub.connect();
      console.log('✅ Redis connected for WS');
    } catch (e) {
      console.warn('⚠️ Redis not connected, running without pub/sub');
    }

    this.redisSub.on('message', (channel, message) => {
      const parts = channel.split(':');
      if (parts[0] === 'channel') {
        const roomId = parts[1] ?? '';
        this.broadcastToRoom(roomId, JSON.parse(message));
      } else if (parts[0] === 'presence') {
        this.broadcastPresenceUpdate(JSON.parse(message));
      }
    });
  }

  private setupServer() {
    this.wss.on('connection', async (ws, req) => {
      const url = new URL(req.url ?? '/', `http://localhost`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      const payload = verifyToken(token);
      if (!payload) {
        ws.close(4001, 'Invalid token');
        return;
      }

      const client: Client = { ws, userId: payload.userId, channels: new Set() };
      this.clients.set(payload.userId, client);
      console.log(`👤 User ${payload.userId} connected (${this.clients.size} online)`);

      ws.on('message', (data) => this.handleMessage(client, data));
      ws.on('close', () => this.handleDisconnect(client));
      ws.on('error', (err) => console.error(`WS error for ${payload.userId}:`, err));

      this.broadcastPresence(payload.userId, 'online');
    });
  }

  private handleMessage(client: Client, data: WebSocket.Data) {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'join_channel':
          client.channels.add(msg.channelId);
          client.ws.send(JSON.stringify({ type: 'joined_channel', channelId: msg.channelId }));
          break;

        case 'leave_channel':
          client.channels.delete(msg.channelId);
          client.ws.send(JSON.stringify({ type: 'left_channel', channelId: msg.channelId }));
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
    } catch (err) {
      console.error('WS message error:', err);
    }
  }

  private handleChatMessage(client: Client, msg: any) {
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      channelId: msg.channelId,
      senderId: client.userId,
      content: msg.content,
      attachments: msg.attachments ?? [],
      createdAt: new Date().toISOString(),
    };

    this.redis.publish(
      `channel:${msg.channelId}`,
      JSON.stringify({ type: 'new_message', message })
    );

    client.ws.send(JSON.stringify({ type: 'message_sent', message }));
  }

  private broadcastToRoom(roomId: string, event: object) {
    for (const client of this.clients.values()) {
      if (client.channels.has(roomId) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(event));
      }
    }
  }

  private async broadcastPresence(userId: string, status: string) {
    try {
      await this.redis.publish(
        'presence:global',
        JSON.stringify({ userId, status })
      );
    } catch {}
  }

  private async broadcastPresenceUpdate(data: any) {
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type: 'presence_update', ...data }));
      }
    }
  }

  private handleDisconnect(client: Client) {
    this.clients.delete(client.userId);
    console.log(`👤 User ${client.userId} disconnected (${this.clients.size} online)`);
    this.broadcastPresence(client.userId, 'offline');

    for (const channelId of client.channels) {
      const stillInChannel = [...this.clients.values()].some(
        (c) => c !== client && c.channels.has(channelId)
      );
      if (!stillInChannel) {
        this.redis.publish(
          `channel:${channelId}`,
          JSON.stringify({ type: 'channel_empty', channelId })
        );
      }
    }
  }
}

new WSServer();
