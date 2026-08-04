"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCaptcha = sendCaptcha;
exports.handleCaptchaAnswer = handleCaptchaAnswer;
const telegraf_1 = require("telegraf");
const captchaService_1 = require("../../services/captchaService");
const db_1 = require("../../database/db");
const types_1 = require("../../types");
const config_1 = require("../../config/config");
const logger_1 = require("../../utils/logger");
async function sendCaptcha(ctx) {
    const user = ctx.dbUser;
    if (!user)
        return;
    const challenge = (0, captchaService_1.createChallenge)(user.telegram_id);
    await (0, db_1.updateUserState)(user.telegram_id, types_1.UserState.IN_CAPTCHA);
    const options = (0, captchaService_1.buildAnswerOptions)(challenge.answer);
    const keyboard = telegraf_1.Markup.inlineKeyboard(options.map((opt) => telegraf_1.Markup.button.callback(String(opt), `captcha:${opt}`)));
    await ctx.reply(`🔐 Solve this captcha to continue:\n\n${challenge.question}`, keyboard);
}
async function handleCaptchaAnswer(ctx) {
    const user = ctx.dbUser;
    if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.answerCbQuery();
        return;
    }
    const data = ctx.callbackQuery.data;
    const submitted = Number(data.split(':')[1]);
    const challenge = (0, captchaService_1.getChallenge)(user.telegram_id);
    await ctx.answerCbQuery();
    if (!challenge) {
        await sendCaptcha(ctx);
        return;
    }
    if ((0, captchaService_1.isExpired)(challenge)) {
        (0, captchaService_1.clearChallenge)(user.telegram_id);
        const fresh = (0, captchaService_1.createChallenge)(user.telegram_id);
        const options = (0, captchaService_1.buildAnswerOptions)(fresh.answer);
        const keyboard = telegraf_1.Markup.inlineKeyboard(options.map((opt) => telegraf_1.Markup.button.callback(String(opt), `captcha:${opt}`)));
        await (0, db_1.updateUserState)(user.telegram_id, types_1.UserState.IN_CAPTCHA);
        await ctx.reply(`⏳ Captcha expired. Try again:\n\n${fresh.question}`, keyboard);
        return;
    }
    if (submitted === challenge.answer) {
        (0, captchaService_1.clearChallenge)(user.telegram_id);
        await (0, db_1.resetFailedAttempts)(user.telegram_id);
        await (0, db_1.updateUserState)(user.telegram_id, types_1.UserState.READY);
        await ctx.reply('✅ Captcha solved! You can now use the Mini App.');
        return;
    }
    // Wrong answer
    const attempts = (0, captchaService_1.incrementAttempt)(user.telegram_id);
    const dbAttempts = await (0, db_1.incrementFailedAttempts)(user.telegram_id);
    if (dbAttempts >= config_1.config.captcha.maxAttempts || attempts >= config_1.config.captcha.maxAttempts) {
        (0, captchaService_1.clearChallenge)(user.telegram_id);
        await (0, db_1.banUser)(user.telegram_id, config_1.config.captcha.banDurationHours);
        const hours = config_1.config.captcha.banDurationHours;
        await ctx.reply(`🚫 Too many failed attempts. You are banned for ${hours} hours.`);
        logger_1.logger.warn('User banned after failed captcha attempts', { telegramId: user.telegram_id });
        return;
    }
    const remaining = config_1.config.captcha.maxAttempts - dbAttempts;
    const options = (0, captchaService_1.buildAnswerOptions)(challenge.answer);
    const keyboard = telegraf_1.Markup.inlineKeyboard(options.map((opt) => telegraf_1.Markup.button.callback(String(opt), `captcha:${opt}`)));
    await ctx.reply(`❌ Wrong answer. ${remaining} attempts remaining. Try again:`, keyboard);
}
//# sourceMappingURL=captchaHandler.js.map