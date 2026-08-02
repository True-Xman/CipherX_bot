"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBot = createBot;
const telegraf_1 = require("telegraf");
const config_1 = require("../config/config");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const rateLimitMiddleware_1 = require("../middlewares/rateLimitMiddleware");
const startHandler_1 = require("./handlers/startHandler");
const captchaHandler_1 = require("./handlers/captchaHandler");
const languageHandler_1 = require("./handlers/languageHandler");
const messageHandler_1 = require("./handlers/messageHandler");
const learningHandler_1 = require("./handlers/learningHandler");
const locales_1 = require("../locales");
const logger_1 = require("../utils/logger");
function createBot() {
    const bot = new telegraf_1.Telegraf(config_1.config.telegram.botToken);
    // --- Global middlewares (order matters) ---
    // 1. authMiddleware: loads/creates the user, enforces ban gate. Runs first,
    //    for every single update, so nothing downstream runs for a banned user.
    bot.use(authMiddleware_1.authMiddleware);
    // 2. rateLimitMiddleware: only throttles READY users sending free text
    //    (checked internally); harmless no-op for captcha/lang steps.
    bot.use(rateLimitMiddleware_1.rateLimitMiddleware);
    // --- Commands ---
    bot.command('start', startHandler_1.handleStart);
    // --- Callback queries (inline keyboard button presses) ---
    bot.action(/^captcha:/, captchaHandler_1.handleCaptchaAnswer);
    bot.action(/^lang:/, languageHandler_1.handleLanguageSelect);
    bot.action(/^menu:/, languageHandler_1.handleMainMenuSelection);
    bot.action(/^learn:/, learningHandler_1.handleLearningCallback);
    // --- Free text messages (must come after action handlers) ---
    bot.on('text', messageHandler_1.handleMessage);
    // --- Global error handler so one bad update can't crash the process ---
    bot.catch((err, ctx) => {
        logger_1.logger.error('Unhandled bot error', { error: err.message });
        const lang = ctx.dbUser?.language ?? config_1.config.defaultLanguage;
        ctx.reply((0, locales_1.t)(lang, 'generic_error')).catch(() => {
            /* swallow secondary failure */
        });
    });
    return bot;
}
//# sourceMappingURL=index.js.map