"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const db_1 = require("../database/db");
const logger_1 = require("../utils/logger");
async function authMiddleware(ctx, next) {
    if (!ctx.from) {
        await next();
        return;
    }
    try {
        const user = await (0, db_1.getOrCreateUser)(ctx.from.id, ctx.from.username ?? null);
        ctx.dbUser = user;
        if ((0, db_1.isBanActive)(user)) {
            await ctx.reply('🚫 You are banned. Please try again later.');
            return;
        }
        await next();
    }
    catch (err) {
        logger_1.logger.error('Auth middleware error', { error: err.message });
        await ctx.reply('⚠️ An error occurred. Please try again later.');
    }
}
//# sourceMappingURL=authMiddleware.js.map