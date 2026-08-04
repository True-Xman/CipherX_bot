"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBot = createBot;
const telegraf_1 = require("telegraf");
const config_1 = require("../config/config");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rateLimitMiddleware_1 = require("../middlewares/rateLimitMiddleware");
const startHandler_1 = require("./handlers/startHandler");
const captchaHandler_1 = require("./handlers/captchaHandler");
const messageHandler_1 = require("./handlers/messageHandler");
const learningHandler_1 = require("./handlers/learningHandler");
const logger_1 = require("../utils/logger");
function createBot() {
    const bot = new telegraf_1.Telegraf(config_1.config.telegram.botToken);
    // --- Global middlewares (order matters) ---
    bot.use(authMiddleware_1.authMiddleware);
    bot.use(rateLimitMiddleware_1.rateLimitMiddleware);
    // --- Commands ---
    bot.command('start', startHandler_1.handleStart);
    // --- Callback queries ---
    bot.action(/^captcha:/, captchaHandler_1.handleCaptchaAnswer);
    bot.action(/^learn:/, learningHandler_1.handleLearningCallback);
    // --- Free text messages ---
    bot.on('text', messageHandler_1.handleMessage);
    // --- Global error handler ---
    bot.catch((err, ctx) => {
        logger_1.logger.error('Unhandled bot error', { error: err.message });
        ctx.reply('⚠️ An unexpected error occurred. Please try again.').catch(() => { });
    });
    return bot;
}
//# sourceMappingURL=index.js.map