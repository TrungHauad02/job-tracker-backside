import 'dotenv/config';
import app from './app.js';
import { connectRedis, redisClient } from './config/redis.config.js';

const PORT = process.env.PORT ?? 3000;

const startServer = async () => {
  try {
    await connectRedis();
    console.log('✅ Redis (stub) ready');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

startServer();
