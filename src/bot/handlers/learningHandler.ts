import { Markup } from 'telegraf';
import { BotContext } from '../../types/context';
import { addUserXp, updateUserLearningStep } from '../../database/db';
import { askGemini } from '../../services/geminiService';
import { chatWithOpenRouter } from '../../services/openrouterService';
import { t } from '../../locales';
import { UserState } from '../../types';
import { SupportedLanguage } from '../../config/config';

interface LearningStep {
  titleKey: string;
  bodyKey: string;
  detailPromptKey: string;
}

const learningSteps: LearningStep[] = [
  {
    titleKey: 'learning_step_1_title',
    bodyKey: 'learning_step_1_body',
    detailPromptKey: 'learning_step_1_detail',
  },
];

export function getLearningState(step: number): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
  if (step <= 0) return 'NOT_STARTED';
  if (step >= learningSteps.length) return 'COMPLETED';
  return 'IN_PROGRESS';
}

function buildLearningKeyboard(stepIndex: number) {
  return Markup.inlineKeyboard([
    [Markup.button.callback('✅ Got it, go to next step', 'learn:next')],
    [Markup.button.callback('❓ Explain more', 'learn:explain')],
  ]);
}

export async function sendLearningStep(ctx: BotContext, stepIndex: number): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  if (stepIndex >= learningSteps.length) {
    const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🧠 Start again', 'learn:restart')]]);
    console.log('📚 sendLearningStep completed keyboard', {
      chatId: ctx.chat?.id,
      hasKeyboard: !!keyboard,
      keyboardKeys: Object.keys(keyboard),
    });
    await ctx.reply(t(user.language, 'learning_completed'), keyboard);
    return;
  }

  const step = learningSteps[stepIndex];
  const title = t(user.language, step.titleKey as any);
  const body = t(user.language, step.bodyKey as any);
  const footer = t(user.language, 'learning_step_footer');
  const text = `${title}\n\n${body}\n\n${footer}`;

  await updateUserLearningStep(user.telegram_id, stepIndex);
  const keyboard = buildLearningKeyboard(stepIndex);
  console.log('📚 sendLearningStep sending keyboard', {
    chatId: ctx.chat?.id,
    stepIndex,
    hasKeyboard: !!keyboard,
    keyboardKeys: Object.keys(keyboard),
  });
  await ctx.reply(text, keyboard);
}

export async function startLearningPath(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  if (user.state !== UserState.READY) {
    await ctx.reply(t(user.language, 'not_verified'));
    return;
  }

  await sendLearningStep(ctx, user.learning_step);
}

export async function resumeLearningPath(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  if (user.state !== UserState.READY) {
    await ctx.reply(t(user.language, 'not_verified'));
    return;
  }

  const stepIndex = user.learning_step >= learningSteps.length ? learningSteps.length : user.learning_step;
  await sendLearningStep(ctx, stepIndex);
}

export async function handleLearningMenuAction(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery();
    return;
  }

  await ctx.answerCbQuery('Starting Web3 Academy');

  if (user.state !== UserState.READY) {
    await ctx.reply(t(user.language, 'not_verified'));
    return;
  }

  await startLearningPath(ctx);
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
    await ctx.reply(t(user.language, 'not_verified'));
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
      await ctx.reply(t(user.language, 'learning_completed'));
      return;
    }

    await sendLearningStep(ctx, nextStep);
    return;
  }

  if (data === 'learn:explain') {
    const stepIndex = Math.min(Math.max(user.learning_step, 0), learningSteps.length - 1);
    const step = learningSteps[stepIndex];
    const prompt = `${t(user.language, step.detailPromptKey as any)}\n\nKeep the answer concise, beginner-friendly, and mobile-friendly.`;

    // انتخاب سرویس بر اساس AI_PROVIDER
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    let result;
    if (aiProvider === 'openrouter') {
      result = await chatWithOpenRouter(user.telegram_id.toString(), prompt);
    } else {
      result = await askGemini(user.telegram_id.toString(), prompt);
    }

    if (!result.success || !result.text) {
      await ctx.reply(t(user.language, 'gemini_error'));
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