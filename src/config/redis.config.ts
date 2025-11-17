import { createClient } from 'redis';

// Create Redis client with basic reconnect strategy and configurable host/port
export const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    // reconnectStrategy receives the number of attempts; return delay in ms or false to stop
    reconnectStrategy: (retries: number) => Math.min(100 + retries * 50, 2000),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on('error', (err) => {
  // Don't crash process on transient Redis errors; log for visibility
  console.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisClient.on('end', () => {
  console.log('Redis client connection closed');
});

export const connectRedis = async (): Promise<void> => {
  if (redisClient.isOpen) return;

  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
    // rethrow so caller can decide how to handle startup failures
    throw err;
  }
};

