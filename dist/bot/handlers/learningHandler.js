"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLearningState = getLearningState;
exports.sendLearningStep = sendLearningStep;
exports.startLearningPath = startLearningPath;
exports.resumeLearningPath = resumeLearningPath;
exports.handleLearningMenuAction = handleLearningMenuAction;
exports.handleLearningCallback = handleLearningCallback;
const telegraf_1 = require("telegraf");
const db_1 = require("../../database/db");
const geminiService_1 = require("../../services/geminiService");
const openrouterService_1 = require("../../services/openrouterService");
const locales_1 = require("../../locales");
const types_1 = require("../../types");
const learningSteps = [
    {
        titleKey: 'learning_step_1_title',
        bodyKey: 'learning_step_1_body',
        detailPromptKey: 'learning_step_1_detail',
    },
];
function getLearningState(step) {
    if (step <= 0)
        return 'NOT_STARTED';
    if (step >= learningSteps.length)
        return 'COMPLETED';
    return 'IN_PROGRESS';
}
function buildLearningKeyboard(stepIndex) {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('✅ Got it, go to next step', 'learn:next')],
        [telegraf_1.Markup.button.callback('❓ Explain more', 'learn:explain')],
    ]);
}
async function sendLearningStep(ctx, stepIndex) {
    const user = ctx.dbUser;
    if (!user)
        return;
    if (stepIndex >= learningSteps.length) {
        const keyboard = telegraf_1.Markup.inlineKeyboard([[telegraf_1.Markup.button.callback('🧠 Start again', 'learn:restart')]]);
        console.log('📚 sendLearningStep completed keyboard', {
            chatId: ctx.chat?.id,
            hasKeyboard: !!keyboard,
            keyboardKeys: Object.keys(keyboard),
        });
        await ctx.reply((0, locales_1.t)(user.language, 'learning_completed'), keyboard);
        return;
    }
    const step = learningSteps[stepIndex];
    const title = (0, locales_1.t)(user.language, step.titleKey);
    const body = (0, locales_1.t)(user.language, step.bodyKey);
    const footer = (0, locales_1.t)(user.language, 'learning_step_footer');
    const text = `${title}\n\n${body}\n\n${footer}`;
    await (0, db_1.updateUserLearningStep)(user.telegram_id, stepIndex);
    const keyboard = buildLearningKeyboard(stepIndex);
    console.log('📚 sendLearningStep sending keyboard', {
        chatId: ctx.chat?.id,
        stepIndex,
        hasKeyboard: !!keyboard,
        keyboardKeys: Object.keys(keyboard),
    });
    await ctx.reply(text, keyboard);
}
async function startLearningPath(ctx) {
    const user = ctx.dbUser;
    if (!user)
        return;
    if (user.state !== types_1.UserState.READY) {
        await ctx.reply((0, locales_1.t)(user.language, 'not_verified'));
        return;
    }
    await sendLearningStep(ctx, user.learning_step);
}
async function resumeLearningPath(ctx) {
    const user = ctx.dbUser;
    if (!user)
        return;
    if (user.state !== types_1.UserState.READY) {
        await ctx.reply((0, locales_1.t)(user.language, 'not_verified'));
        return;
    }
    const stepIndex = user.learning_step >= learningSteps.length ? learningSteps.length : user.learning_step;
    await sendLearningStep(ctx, stepIndex);
}
async function handleLearningMenuAction(ctx) {
    const user = ctx.dbUser;
    if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.answerCbQuery();
        return;
    }
    await ctx.answerCbQuery('Starting Web3 Academy');
    if (user.state !== types_1.UserState.READY) {
        await ctx.reply((0, locales_1.t)(user.language, 'not_verified'));
        return;
    }
    await startLearningPath(ctx);
}
async function handleLearningCallback(ctx) {
    const user = ctx.dbUser;
    if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
        await ctx.answerCbQuery();
        return;
    }
    const data = ctx.callbackQuery.data;
    await ctx.answerCbQuery();
    if (user.state !== types_1.UserState.READY) {
        await ctx.reply((0, locales_1.t)(user.language, 'not_verified'));
        return;
    }
    if (data === 'learn:restart') {
        await (0, db_1.updateUserLearningStep)(user.telegram_id, 0);
        await startLearningPath(ctx);
        return;
    }
    if (data === 'learn:next') {
        const nextStep = Math.min(user.learning_step + 1, learningSteps.length);
        await (0, db_1.addUserXp)(user.telegram_id, 10);
        await (0, db_1.updateUserLearningStep)(user.telegram_id, nextStep);
        if (nextStep >= learningSteps.length) {
            await ctx.reply((0, locales_1.t)(user.language, 'learning_completed'));
            return;
        }
        await sendLearningStep(ctx, nextStep);
        return;
    }
    if (data === 'learn:explain') {
        const stepIndex = Math.min(Math.max(user.learning_step, 0), learningSteps.length - 1);
        const step = learningSteps[stepIndex];
        const prompt = `${(0, locales_1.t)(user.language, step.detailPromptKey)}\n\nKeep the answer concise, beginner-friendly, and mobile-friendly.`;
        // انتخاب سرویس بر اساس AI_PROVIDER
        const aiProvider = process.env.AI_PROVIDER || 'gemini';
        let result;
        if (aiProvider === 'openrouter') {
            result = await (0, openrouterService_1.chatWithOpenRouter)(user.telegram_id.toString(), prompt);
        }
        else {
            result = await (0, geminiService_1.askGemini)(user.telegram_id.toString(), prompt);
        }
        if (!result.success || !result.text) {
            await ctx.reply((0, locales_1.t)(user.language, 'gemini_error'));
            return;
        }
        const keyboard = buildLearningKeyboard(stepIndex);
        console.log('📚 handleLearningCallback explain more keyboard', {
            chatId: ctx.chat?.id,
            stepIndex,
            hasKeyboard: !!keyboard,
            keyboardKeys: Object.keys(keyboard),
        });
        await ctx.reply(result.text, keyboard);
    }
}
//# sourceMappingURL=learningHandler.js.map