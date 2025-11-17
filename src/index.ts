/**
 * Server Entry Point
 *
 * Initializes the Express server and connects to Redis.
 * Handles graceful shutdown on SIGTERM and SIGINT signals.
 */

import 'dotenv/config';
import app from './app.js';
import { connectRedis, redisClient } from './config/redis.config.js';

const PORT = process.env.PORT || 3000;

/**
 * Start the server
 * Connects to Redis first, then starts the HTTP server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to Redis
    await connectRedis();
    console.log('✅ Connected to Redis');

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
      console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      // Close server to stop accepting new connections
      server.close(async () => {
        console.log('HTTP server closed');

        try {
          // Only attempt to quit if the client is open
          // redisClient.isOpen is true when the client has an active connection
          if (typeof (redisClient as any).isOpen === 'boolean' && (redisClient as any).isOpen) {
            try {
              await redisClient.quit();
              console.log('Redis connection closed');
            } catch (err: any) {
              // Ignore client-closed errors during shutdown
              if (err && err.name === 'ClientClosedError') {
                console.warn('Redis client was already closed');
              } else {
                console.error('Error during Redis shutdown:', err);
              }
            }
          } else {
            console.log('Redis client not open, skipping quit()');
          }

          console.log('✅ Shutdown complete');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
