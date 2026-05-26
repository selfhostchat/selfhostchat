import { config } from 'dotenv';
import amqp, { type Connection, type Channel, type ConsumeMessage } from 'amqplib';

config();

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672';
const QUEUES = ['email', 'file-process', 'push-notification'] as const;

class Worker {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async start() {
    try {
      this.connection = await amqp.connect(RABBITMQ_URL);
      this.channel = await this.connection.createChannel();

      console.log('✅ RabbitMQ connected');

      for (const queue of QUEUES) {
        await this.channel.assertQueue(queue);
        await this.channel.consume(queue, (msg) => this.processMessage(queue, msg));
        console.log(`📬 Listening on queue: ${queue}`);
      }

      this.connection.on('error', (err) => console.error('RabbitMQ error:', err));
      this.connection.on('close', () => {
        console.warn('RabbitMQ connection closed, reconnecting in 5s...');
        setTimeout(() => this.start(), 5000);
      });
    } catch (err) {
      console.error('❌ RabbitMQ connection failed:', err);
      console.log('Retrying in 5s...');
      setTimeout(() => this.start(), 5000);
    }
  }

  private async processMessage(queue: string, msg: ConsumeMessage | null) {
    if (!msg || !this.channel) return;

    try {
      const payload = JSON.parse(msg.content.toString());

      switch (queue) {
        case 'email':
          await this.handleEmail(payload);
          break;
        case 'file-process':
          await this.handleFileProcess(payload);
          break;
        case 'push-notification':
          await this.handlePushNotification(payload);
          break;
      }

      this.channel.ack(msg);
    } catch (err) {
      console.error(`Error processing ${queue}:`, err);
      this.channel.nack(msg, false, false);
    }
  }

  private async handleEmail(payload: any) {
    console.log(`📧 Sending email to ${payload.to}: ${payload.subject}`);
    // TODO: Implement actual email sending
    await new Promise((r) => setTimeout(r, 100));
  }

  private async handleFileProcess(payload: any) {
    console.log(`🖼️ Processing file: ${payload.filename}`);
    // TODO: Implement file processing (resize, transcode, etc.)
    await new Promise((r) => setTimeout(r, 100));
  }

  private async handlePushNotification(payload: any) {
    console.log(`🔔 Push notification to ${payload.userId}: ${payload.title}`);
    // TODO: Implement push notifications (FCM, APNs)
    await new Promise((r) => setTimeout(r, 100));
  }
}

const worker = new Worker();
worker.start().catch(console.error);

export { Worker };
