import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

let connection: typeof mongoose | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (connection) return connection;

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected, waiting for reconnect...');
    connection = null;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err);
  });

  connection = await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  console.log('✅ MongoDB connected');
  return connection;
}

export async function disconnectDB(): Promise<void> {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    console.log('MongoDB disconnected');
  }
}
