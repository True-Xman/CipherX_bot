"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const db_1 = require("../../database/db");
const types_1 = require("../../types");
const captchaHandler_1 = require("./captchaHandler");
const sanitize_1 = require("../../utils/sanitize");
async function handleMessage(ctx) {
    console.log('📨 Message received:', ctx.message && 'text' in ctx.message ? ctx.message.text : '🖼️ (non-text message)');
    let user = ctx.dbUser;
    if (!user) {
        const from = ctx.from;
        if (!from) {
            console.log('⚠️ No from in ctx, returning');
            return;
        }
        console.log('🔍 Loading user from database for:', from.id);
        user = await (0, db_1.getOrCreateUser)(from.id, from.username ?? null);
        ctx.dbUser = user;
    }
    if (!user) {
        console.log('⚠️ No user found, returning');
        return;
    }
    console.log('👤 User state:', user.state);
    // ---- اگر کاربر کپچا را حل نکرده، کپچا بفرست ----
    if (user.state !== types_1.UserState.READY) {
        switch (user.state) {
            case types_1.UserState.UNVERIFIED:
            case types_1.UserState.IN_CAPTCHA:
                console.log('🚧 handleMessage sending captcha keyboard for state', user.state);
                await (0, captchaHandler_1.sendCaptcha)(ctx);
                return;
            default:
                await ctx.reply('⚠️ Please complete the captcha first using /start.');
                return;
        }
    }
    // ---- اگر کاربر READY است، فقط راهنمایی به Mini App ----
    const text = 'text' in ctx.message ? ctx.message.text : '';
    if ((0, sanitize_1.isBlank)(text))
        return;
    // اگر کاربر در حالت READY است، به او بگویید از Mini App استفاده کند
    await ctx.reply('🤖 All conversations with Xman now happen inside the Mini App.\n\n' +
        '📱 Please open the Mini App using the Menu button below to continue your Web3 training.\n\n' +
        '🔐 If you haven\'t solved the captcha yet, please use /start first.');
}
//# sourceMappingURL=messageHandler.js.map