"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitMiddleware = rateLimitMiddleware;
const rateLimiter_1 = require("../services/rateLimiter");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
async function rateLimitMiddleware(ctx, next) {
    const user = ctx.dbUser;
    if (!user || user.state !== types_1.UserState.READY || !ctx.message || !('text' in ctx.message)) {
        await next();
        return;
    }
    const result = (0, rateLimiter_1.checkRateLimit)(user.telegram_id);
    if (!result.allowed) {
        logger_1.logger.warn('Rate limit exceeded', { telegramId: user.telegram_id });
        await ctx.reply(`⏳ Too many messages. Please wait ${Math.ceil(result.retryAfterMs / 1000)} seconds.`);
        return;
    }
    await next();
}
//# sourceMappingURL=rateLimitMiddleware.js.map