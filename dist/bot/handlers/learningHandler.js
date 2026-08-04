"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLearningStep = sendLearningStep;
exports.startLearningPath = startLearningPath;
exports.handleLearningCallback = handleLearningCallback;
const telegraf_1 = require("telegraf");
const db_1 = require("../../database/db");
const geminiService_1 = require("../../services/geminiService");
const openrouterService_1 = require("../../services/openrouterService");
const types_1 = require("../../types");
const learningSteps = [
    {
        title: '🛡️ Stage 1: What is a Seed Phrase?',
        body: 'A seed phrase is a set of 12 or 24 words that gives you full control over your crypto wallet.\n\nAnyone who knows your seed phrase can access your funds. Keep it safe and offline.',
        detailPrompt: 'Explain what a seed phrase is, why it\'s important, and how to store it safely.',
    },
    // مراحل بعدی را می‌توانید اضافه کنید
];
function buildLearningKeyboard() {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback('✅ Next', 'learn:next')],
        [telegraf_1.Markup.button.callback('❓ Explain more', 'learn:explain')],
    ]);
}
async function sendLearningStep(ctx, stepIndex) {
    const user = ctx.dbUser;
    if (!user)
        return;
    if (stepIndex >= learningSteps.length) {
        await ctx.reply('🎉 You have completed all stages! You are now a Web3 sovereign.', telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('🔄 Start over', 'learn:restart')]
        ]));
        return;
    }
    const step = learningSteps[stepIndex];
    const text = `${step.title}\n\n${step.body}\n\nType a question or press a button below.`;
    await (0, db_1.updateUserLearningStep)(user.telegram_id, stepIndex);
    await ctx.reply(text, buildLearningKeyboard());
}
async function startLearningPath(ctx) {
    const user = ctx.dbUser;
    if (!user)
        return;
    if (user.state !== types_1.UserState.READY) {
        await ctx.reply('⚠️ Please complete the captcha first using /start.');
        return;
    }
    await sendLearningStep(ctx, user.learning_step);
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
        await ctx.reply('⚠️ Please complete the captcha first using /start.');
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
            await ctx.reply('🎉 You have completed all stages!');
            return;
        }
        await sendLearningStep(ctx, nextStep);
        return;
    }
    if (data === 'learn:explain') {
        const stepIndex = Math.min(Math.max(user.learning_step, 0), learningSteps.length - 1);
        const step = learningSteps[stepIndex];
        const prompt = `${step.detailPrompt}\n\nKeep the answer concise, beginner-friendly, and mobile-friendly.`;
        const aiProvider = process.env.AI_PROVIDER || 'gemini';
        let result;
        if (aiProvider === 'openrouter') {
            result = await (0, openrouterService_1.chatWithOpenRouter)(user.telegram_id.toString(), prompt);
        }
        else {
            result = await (0, geminiService_1.askGemini)(user.telegram_id.toString(), prompt);
        }
        if (!result.success || !result.text) {
            await ctx.reply('⚠️ Could not get explanation. Please try again.');
            return;
        }
        await ctx.reply(result.text, buildLearningKeyboard());
    }
}
//# sourceMappingURL=learningHandler.js.map