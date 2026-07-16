import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitInfo>();

const WINDOW_SIZE_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 100; // Max 100 requests per minute

/**
 * Sliding Window In-Memory Rate Limiter middleware.
 * Zero-dependency alternative to express-rate-limit + Redis for local development.
 */
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown-ip';
  const now = Date.now();

  let clientData = ipRequestMap.get(ip);

  if (!clientData) {
    clientData = { timestamps: [] };
    ipRequestMap.set(ip, clientData);
  }

  // Filter out timestamps older than the window size
  clientData.timestamps = clientData.timestamps.filter(
    (timestamp) => now - timestamp < WINDOW_SIZE_MS
  );

  if (clientData.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again after a minute.',
    });
    return;
  }

  // Add the current request timestamp
  clientData.timestamps.push(now);
  next();
};
