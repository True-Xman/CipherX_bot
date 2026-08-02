"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const rateLimiter_1 = require("../services/rateLimiter");
const locales_1 = require("../locales");
const types_1 = require("../types");
/**
 * Applies rate limiting only to verified users sending free-text messages
 * (i.e. messages that would trigger a Gemini API call). Captcha button
 * presses and language selection are NOT rate-limited here, since they're
 * bounded by the captcha flow itself (max attempts + expiry).
 */
async function rateLimitMiddleware(ctx, next) {
    const user = ctx.dbUser;
    if (!user || user.state !== types_1.UserState.READY) {
        return next();
    }
    const result = (0, rateLimiter_1.checkRateLimit)(user.telegram_id);
    if (!result.allowed) {
        const seconds = Math.ceil(result.retryAfterMs / 1000);
        await ctx.reply(`${(0, locales_1.t)(user.language, 'rate_limited')} (${seconds}s)`);
        return; // stop here, do not call next() / Gemini
    }
    await next();
}
//# sourceMappingURL=rateLimitMiddleware.js.map