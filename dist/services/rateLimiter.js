"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRateLimit = checkRateLimit;
const config_1 = require("../config/config");
/**
 * Simple fixed-window rate limiter: N messages per windowMs per user.
 * In-memory Map is fine for a single bot instance. For horizontal scaling,
 * swap this for Redis (INCR + EXPIRE) without changing the calling code.
 */
const windows = new Map();
// تبدیل windowSeconds به میلی‌ثانیه
const WINDOW_MS = config_1.config.rateLimit.windowSeconds * 1000;
function checkRateLimit(telegramId) {
    const now = Date.now();
    const entry = windows.get(telegramId);
    if (!entry || now - entry.windowStart >= WINDOW_MS) {
        // Start a fresh window
        windows.set(telegramId, { count: 1, windowStart: now });
        return { allowed: true, remaining: config_1.config.rateLimit.maxMessages - 1, retryAfterMs: 0 };
    }
    if (entry.count < config_1.config.rateLimit.maxMessages) {
        entry.count += 1;
        windows.set(telegramId, entry);
        return {
            allowed: true,
            remaining: config_1.config.rateLimit.maxMessages - entry.count,
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
}, 5 * 60000).unref();
//# sourceMappingURL=rateLimiter.js.map