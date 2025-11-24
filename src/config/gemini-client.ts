/**
 * Gemini AI Client Configuration
 *
 * Centralized configuration for Google Generative AI integration.
 * Provides a configured client instance and retry utilities.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Validate required environment variables
 */
if (!process.env.GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY is not set in environment variables');
}

/**
 * Initialize Google Generative AI client
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get the configured Gemini model
 * @returns Configured generative model instance
 */
export const getGeminiModel = () => {
  // Use gemini-2.0-flash-exp (experimental) which is currently available
  // Alternative stable options: gemini-1.5-pro, gemini-1.5-flash (if still available in your region)
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  
  console.log(`Initializing Gemini model: ${modelName}`);
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 * @param ms - Milliseconds to sleep
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry wrapper with exponential backoff
 * @param fn - Async function to retry
 * @param context - Context description for logging
 * @returns Result of the function
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  context: string = 'API call'
): Promise<T> => {
  let lastError: Error | null = null;
  let delay = RETRY_CONFIG.initialDelayMs;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error as Error;
      
      // Check for 404 errors (model not found) - don't retry these
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        console.error(
          `\n❌ ${context} failed: Model not found (404 error)`,
          `\nCurrent model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'}`,
          `\nPlease update GEMINI_MODEL in your .env file to a valid model name.`,
          `\nRecommended: gemini-2.0-flash-exp, gemini-1.5-pro, or gemini-1.5-flash\n`
        );
        throw error; // Don't retry 404 errors
      }
      
      if (attempt === RETRY_CONFIG.maxAttempts) {
        console.error(`${context} failed after ${attempt} attempts:`, error);
        break;
      }

      console.warn(
        `${context} failed (attempt ${attempt}/${RETRY_CONFIG.maxAttempts}), retrying in ${delay}ms...`,
        error?.message || error
      );

      await sleep(delay);
      delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
    }
  }

  throw lastError || new Error(`${context} failed after ${RETRY_CONFIG.maxAttempts} attempts`);
};

/**
 * Get cache expiry date based on configuration
 * @returns Date object for cache expiration
 */
export const getCacheExpiryDate = (): Date => {
  const expiryDays = parseInt(process.env.AI_CACHE_EXPIRY_DAYS || '60', 10);
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  return expiryDate;
};
