"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStart = handleStart;
const types_1 = require("../../types");
const captchaHandler_1 = require("./captchaHandler");
const languageHandler_1 = require("./languageHandler");
const learningHandler_1 = require("./learningHandler");
const locales_1 = require("../../locales");
/**
 * Entry point for /start. Resumes the user wherever they left off instead
 * of always resetting — this avoids letting a user "escape" verification
 * by just re-running /start repeatedly.
 */
async function handleStart(ctx) {
    const user = ctx.dbUser;
    if (!user)
        return;
    switch (user.state) {
        case types_1.UserState.UNVERIFIED:
        case types_1.UserState.IN_CAPTCHA:
            await (0, captchaHandler_1.sendCaptcha)(ctx);
            break;
        case types_1.UserState.SELECT_LANG:
            {
                const keyboard = (0, languageHandler_1.buildLanguageKeyboard)();
                console.log('🧩 handleStart sending language selection keyboard', {
                    chatId: ctx.chat?.id,
                    hasKeyboard: !!keyboard,
                    keyboardKeys: Object.keys(keyboard),
                });
                await ctx.reply((0, locales_1.t)(user.language, 'select_language_prompt'), keyboard);
            }
            break;
        case types_1.UserState.READY:
            await (0, learningHandler_1.startLearningPath)(ctx);
            break;
        default:
            await (0, captchaHandler_1.sendCaptcha)(ctx);
    }
}
//# sourceMappingURL=startHandler.js.map