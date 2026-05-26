import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

let connection: typeof mongoose | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (connection) return connection;

  try {
  connection = await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    console.log('MongoDB disconnected');
  }
}
