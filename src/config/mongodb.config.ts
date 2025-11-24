/**
 * MongoDB Configuration
 *
 * Initializes and manages MongoDB connection using Mongoose.
 * Handles connection lifecycle, error events, and graceful shutdown.
 */

import mongoose from 'mongoose';

/**
 * MongoDB Connection URI
 * Defaults to localhost if not specified in environment
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job-tracker';

/**
 * Mongoose connection options
 */
const options = {
  // Automatically retry initial connection
  serverSelectionTimeoutMS: 5000,
  // Keep connection alive
  socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB
 * @throws Error if connection fails
 */
export const connectMongoDB = async (): Promise<void> => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    await mongoose.connect(MONGODB_URI, options);
    console.log(`✅ Connected to MongoDB: ${mongoose.connection.db?.databaseName}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Gracefully close MongoDB connection
 */
export const disconnectMongoDB = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
};

/**
 * MongoDB Connection Event Listeners
 */
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

/**
 * Handle process termination
 * Ensures MongoDB connection is closed on app shutdown
 */
process.on('SIGINT', async () => {
  await disconnectMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectMongoDB();
  process.exit(0);
});

export default mongoose;
