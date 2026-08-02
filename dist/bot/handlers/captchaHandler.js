"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCaptcha = sendCaptcha;
exports.handleCaptchaAnswer = handleCaptchaAnswer;
const telegraf_1 = require("telegraf");
const captchaService_1 = require("../../services/captchaService");
const db_1 = require("../../database/db");
const types_1 = require("../../types");
const locales_1 = require("../../locales");
const config_1 = require("../../config/config");
const logger_1 = require("../../utils/logger");
/** Send a fresh math captcha with inline keyboard buttons to the user. */
async function sendCaptcha(ctx) {
    const user = ctx.dbUser;
    if (!user)
        return;
    const challenge = (0, captchaService_1.createChallenge)(user.telegram_id);
    await (0, db_1.updateUserState)(user.telegram_id, types_1.UserState.IN_CAPTCHA);
    const options = (0, captchaService_1.buildAnswerOptions)(challenge.answer);
    const keyboard = telegraf_1.Markup.inlineKeyboard(options.map((opt) => telegraf_1.Markup.button.callback(String(opt), `captcha:${opt}`)));
    console.log('🧠 sendCaptcha preparing keyboard', {
        chatId: ctx.chat?.id,
        hasKeyboard: !!keyboard,
        keyboardKeys: Object.keys(keyboard),
    });
    await ctx.reply((0, locales_1.t)(user.language, 'welcome', { question: challenge.question }), keyboard);
}
/** Handles a button press on the captcha keyboard (callback_query). */
async function handleCaptchaAnswer(ctx) {
    const user = ctx.dbUser;
    if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.answerCbQuery();
        return;
    }
    const data = ctx.callbackQuery.data; // e.g. "captcha:17"
    const submitted = Number(data.split(':')[1]);
    const challenge = (0, captchaService_1.getChallenge)(user.telegram_id);
    await ctx.answerCbQuery();
    console.log('🧠 handleCaptchaAnswer incoming', {
        chatId: ctx.chat?.id,
        callbackData: data,
        submitted,
        submittedType: typeof submitted,
        challenge: challenge ? { answer: challenge.answer, answerType: typeof challenge.answer, expiresAt: challenge.expiresAt, attempts: challenge.attempts } : null,
    });
    if (!challenge) {
        // No active challenge (maybe already verified, or bot restarted) -> re-issue one.
        await sendCaptcha(ctx);
        return;
    }
    if ((0, captchaService_1.isExpired)(challenge)) {
        (0, captchaService_1.clearChallenge)(user.telegram_id);
        const fresh = (0, captchaService_1.createChallenge)(user.telegram_id);
        const options = (0, captchaService_1.buildAnswerOptions)(fresh.answer);
        const keyboard = telegraf_1.Markup.inlineKeyboard(options.map((opt) => telegraf_1.Markup.button.callback(String(opt), `captcha:${opt}`)));
        console.log('🧠 sendCaptcha expired challenge keyboard', {
            chatId: ctx.chat?.id,
            hasKeyboard: !!keyboard,
            keyboardKeys: Object.keys(keyboard),
        });
        await (0, db_1.updateUserState)(user.telegram_id, types_1.UserState.IN_CAPTCHA);
        await ctx.reply((0, locales_1.t)(user.language, 'captcha_expired', { question: fresh.question }), keyboard);
        return;
    }
    if (submitted === challenge.answer) {
        (0, captchaService_1.clearChallenge)(user.telegram_id);
        await (0, db_1.resetFailedAttempts)(user.telegram_id);
        await (0, db_1.updateUserState)(user.telegram_id, types_1.UserState.SELECT_LANG);
        const { buildLanguageKeyboard } = await Promise.resolve().then(() => __importStar(require('./languageHandler')));
        await ctx.reply((0, locales_1.t)(user.language, 'captcha_success'), buildLanguageKeyboard());
        return;
    }
    // Wrong answer path
    const attempts = (0, captchaService_1.incrementAttempt)(user.telegram_id);
    const dbAttempts = await (0, db_1.incrementFailedAttempts)(user.telegram_id);
    if (dbAttempts >= config_1.config.captcha.maxAttempts || attempts >= config_1.config.captcha.maxAttempts) {
        (0, captchaService_1.clearChallenge)(user.telegram_id);
        await (0, db_1.banUser)(user.telegram_id, config_1.config.captcha.banDurationHours);
        const hours = config_1.config.captcha.banDurationHours;
        await ctx.reply((0, locales_1.t)(user.language, 'banned', { hours }));
        logger_1.logger.warn('User banned after failed captcha attempts', { telegramId: user.telegram_id });
        return;
    }
    const remaining = config_1.config.captcha.maxAttempts - dbAttempts;
    const options = (0, captchaService_1.buildAnswerOptions)(challenge.answer);
    const keyboard = telegraf_1.Markup.inlineKeyboard(options.map((opt) => telegraf_1.Markup.button.callback(String(opt), `captcha:${opt}`)));
    console.log('🧠 sendCaptcha wrong answer keyboard', {
        chatId: ctx.chat?.id,
        remaining,
        hasKeyboard: !!keyboard,
        keyboardKeys: Object.keys(keyboard),
    });
    await ctx.reply((0, locales_1.t)(user.language, 'captcha_wrong', { remaining }), keyboard);
}
//# sourceMappingURL=captchaHandler.js.map