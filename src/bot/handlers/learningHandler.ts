import { Markup } from 'telegraf';
import { BotContext } from '../../types/context';
import { addUserXp, updateUserLearningStep } from '../../database/db';
import { askGemini } from '../../services/geminiService';
import { chatWithOpenRouter } from '../../services/openrouterService';
import { UserState } from '../../types';

interface LearningStep {
  title: string;
  body: string;
  detailPrompt: string;
}

const learningSteps: LearningStep[] = [
  {
    title: '🛡️ Stage 1: What is a Seed Phrase?',
    body: 'A seed phrase is a set of 12 or 24 words that gives you full control over your crypto wallet.\n\nAnyone who knows your seed phrase can access your funds. Keep it safe and offline.',
    detailPrompt: 'Explain what a seed phrase is, why it\'s important, and how to store it safely.',
  },
  // مراحل بعدی را می‌توانید اضافه کنید
];

function buildLearningKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Next', 'learn:next')],
    [Markup.button.callback('❓ Explain more', 'learn:explain')],
  ]);
}

export async function sendLearningStep(ctx: BotContext, stepIndex: number): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  if (stepIndex >= learningSteps.length) {
    await ctx.reply('🎉 You have completed all stages! You are now a Web3 sovereign.', Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Start over', 'learn:restart')]
    ]));
    return;
  }

  const step = learningSteps[stepIndex];
  const text = `${step.title}\n\n${step.body}\n\nType a question or press a button below.`;

  await updateUserLearningStep(user.telegram_id, stepIndex);
  await ctx.reply(text, buildLearningKeyboard());
}

export async function startLearningPath(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  if (user.state !== UserState.READY) {
    await ctx.reply('⚠️ Please complete the captcha first using /start.');
    return;
  }

  await sendLearningStep(ctx, user.learning_step);
}

export async function handleLearningCallback(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery();
    return;
  }

  const data = ctx.callbackQuery.data;
  await ctx.answerCbQuery();

  if (user.state !== UserState.READY) {
    await ctx.reply('⚠️ Please complete the captcha first using /start.');
    return;
  }

  if (data === 'learn:restart') {
    await updateUserLearningStep(user.telegram_id, 0);
    await startLearningPath(ctx);
    return;
  }

  if (data === 'learn:next') {
    const nextStep = Math.min(user.learning_step + 1, learningSteps.length);
    await addUserXp(user.telegram_id, 10);
    await updateUserLearningStep(user.telegram_id, nextStep);

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
      result = await chatWithOpenRouter(user.telegram_id.toString(), prompt);
    } else {
      result = await askGemini(user.telegram_id.toString(), prompt);
    }

    if (!result.success || !result.text) {
      await ctx.reply('⚠️ Could not get explanation. Please try again.');
      return;
    }

    await ctx.reply(result.text, buildLearningKeyboard());
  }
}