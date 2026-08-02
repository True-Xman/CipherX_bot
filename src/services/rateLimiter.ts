import { RateLimitEntry } from '../types';
import { config } from '../config/config';

/**
 * Simple fixed-window rate limiter: N messages per windowMs per user.
 * In-memory Map is fine for a single bot instance. For horizontal scaling,
 * swap this for Redis (INCR + EXPIRE) without changing the calling code.
 */
const windows = new Map<number, RateLimitEntry>();

// تبدیل windowSeconds به میلی‌ثانیه
const WINDOW_MS = config.rateLimit.windowSeconds * 1000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(telegramId: number): RateLimitResult {
  const now = Date.now();
  const entry = windows.get(telegramId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Start a fresh window
    windows.set(telegramId, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.rateLimit.maxMessages - 1, retryAfterMs: 0 };
  }

  if (entry.count < config.rateLimit.maxMessages) {
    entry.count += 1;
    windows.set(telegramId, entry);
    return {
      allowed: true,
      remaining: config.rateLimit.maxMessages - entry.count,
      retryAfterMs: 0,
    };
  }

  const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
  return { allowed: false, remaining: 0, retryAfterMs };
}

// Periodic cleanup of stale windows.
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of windows.entries()) {
    if (now - entry.windowStart > WINDOW_MS * 5) {
      windows.delete(id);
    }
  }
}, 5 * 60_000).unref();