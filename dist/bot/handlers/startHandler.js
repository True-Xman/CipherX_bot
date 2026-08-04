"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStart = handleStart;
const types_1 = require("../../types");
const captchaHandler_1 = require("./captchaHandler");
async function handleStart(ctx) {
    const user = ctx.dbUser;
    if (!user) {
        await ctx.reply('⚠️ Please try again later.');
        return;
    }
    console.log('🔍 handleStart: user state =', user.state);
    // اگر کاربر READY است، پیام راهنمایی به Mini App بفرست
    if (user.state === types_1.UserState.READY) {
        await ctx.reply('🤖 All conversations with Xman now happen inside the Mini App.\n\n' +
            '📱 Please open the Mini App using the Menu button below to continue your Web3 training.');
        return;
    }
    // در غیر این صورت (UNVERIFIED, IN_CAPTCHA, BANNED, ...) کپچا بفرست
    await (0, captchaHandler_1.sendCaptcha)(ctx);
}
//# sourceMappingURL=startHandler.js.map