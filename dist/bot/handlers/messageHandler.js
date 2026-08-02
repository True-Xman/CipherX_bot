"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const db_1 = require("../../database/db");
const types_1 = require("../../types");
const captchaHandler_1 = require("./captchaHandler");
const languageHandler_1 = require("./languageHandler");
const locales_1 = require("../../locales");
const geminiService_1 = require("../../services/geminiService");
const openrouterService_1 = require("../../services/openrouterService");
const sanitize_1 = require("../../utils/sanitize");
const logger_1 = require("../../utils/logger");
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
    console.log('👤 User language:', user.language);
    if (user.state !== types_1.UserState.READY) {
        switch (user.state) {
            case types_1.UserState.UNVERIFIED:
            case types_1.UserState.IN_CAPTCHA:
                console.log('🚧 handleMessage sending captcha keyboard for state', user.state);
                await (0, captchaHandler_1.sendCaptcha)(ctx);
                return;
            case types_1.UserState.SELECT_LANG:
                {
                    const keyboard = (0, languageHandler_1.buildLanguageKeyboard)();
                    console.log('🚧 handleMessage sending language selection keyboard', {
                        chatId: ctx.chat?.id,
                        hasKeyboard: !!keyboard,
                        keyboardKeys: Object.keys(keyboard),
                    });
                    await ctx.reply((0, locales_1.t)(user.language, 'select_language_prompt'), keyboard);
                }
                return;
            default:
                await ctx.reply((0, locales_1.t)(user.language, 'not_verified'));
                return;
        }
    }
    const text = 'text' in ctx.message ? ctx.message.text : '';
    if ((0, sanitize_1.isBlank)(text))
        return;
    await ctx.sendChatAction('typing');
    // انتخاب سرویس بر اساس AI_PROVIDER
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    let result;
    if (aiProvider === 'openrouter') {
        result = await (0, openrouterService_1.chatWithOpenRouter)(user.telegram_id.toString(), text);
    }
    else {
        result = await (0, geminiService_1.askGemini)(user.telegram_id.toString(), text);
    }
    if (!result.success || !result.text) {
        logger_1.logger.warn('AI call failed for user', { telegramId: user.telegram_id, reason: result.error });
        await ctx.reply((0, locales_1.t)(user.language, 'gemini_error'));
        return;
    }
    await ctx.reply(result.text);
}
//# sourceMappingURL=messageHandler.js.map