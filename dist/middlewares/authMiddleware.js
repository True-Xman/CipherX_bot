"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const db_1 = require("../database/db");
const types_1 = require("../types");
const locales_1 = require("../locales");
const logger_1 = require("../utils/logger");
/**
 * Runs on every update. Responsibilities:
 * 1. Load (or create) the user record and attach it to ctx.dbUser.
 * 2. If the user is banned and the ban hasn't expired, block them silently
 *    (with a message telling them how long is left) — this is what enforces
 *    "CAPTCHA first" security: nothing downstream (including Gemini) runs
 *    for a banned/unverified user except the captcha flow itself.
 * 3. If a ban HAS expired, lift it automatically and let them retry captcha.
 */
async function authMiddleware(ctx, next) {
    console.log('🔐 authMiddleware called for user:', ctx.from?.id);
    try {
        const from = ctx.from;
        if (!from)
            return; // non-user updates (e.g. channel posts) are ignored
        let user = await (0, db_1.getOrCreateUser)(from.id, from.username ?? null);
        if ((0, db_1.isBanActive)(user)) {
            const hoursLeft = Math.ceil((user.banned_until - Date.now()) / (60 * 60 * 1000));
            await ctx.reply((0, locales_1.t)(user.language, 'banned', { hours: hoursLeft }));
            return; // hard stop — do not call next()
        }
        if (user.state === types_1.UserState.BANNED && !(0, db_1.isBanActive)(user)) {
            // Ban expired naturally -> reset to UNVERIFIED so captcha handler kicks in again.
            await (0, db_1.liftBan)(from.id);
            user = await (0, db_1.getOrCreateUser)(from.id, from.username ?? null);
        }
        ctx.dbUser = user;
        await next();
    }
    catch (err) {
        logger_1.logger.error('authMiddleware failure', { error: err.message });
        // Fail closed: do not proceed to handlers if we couldn't establish identity/state.
        try {
            await ctx.reply('⚠️ Internal error. Please try again shortly.');
        }
        catch {
            /* ignore secondary failure */
        }
    }
}
//# sourceMappingURL=authMiddleware.js.map