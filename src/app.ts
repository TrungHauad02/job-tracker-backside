/**
 * Express Application Setup
 *
 * Configures and exports the Express app with all middleware and routes.
 */

import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';
import { logger } from './middlewares/logger.middleware.js';

const app = express();

// CORS configuration
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
// Normalize origin by removing a trailing slash if present
const frontendOrigin = rawFrontendUrl.replace(/\/+$/, '');
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (optional, can be disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.use(logger);
}

// API routes
app.use('/api', routes);

// 404 handler - must be after all routes
app.use(notFound);

// Global error handler - must be last
app.use(errorHandler);

export default app;
