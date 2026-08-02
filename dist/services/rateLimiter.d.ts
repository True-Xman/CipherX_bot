export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}
export declare function checkRateLimit(telegramId: number): RateLimitResult;
//# sourceMappingURL=rateLimiter.d.ts.map