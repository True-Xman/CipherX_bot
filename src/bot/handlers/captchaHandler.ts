import { Markup } from 'telegraf';
import { BotContext } from '../../types/context';
import {
  createChallenge,
  getChallenge,
  clearChallenge,
  isExpired,
  buildAnswerOptions,
  incrementAttempt,
} from '../../services/captchaService';
import { updateUserState, incrementFailedAttempts, resetFailedAttempts, banUser } from '../../database/db';
import { UserState } from '../../types';
import { t } from '../../locales';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

/** Send a fresh math captcha with inline keyboard buttons to the user. */
export async function sendCaptcha(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  const challenge = createChallenge(user.telegram_id);
  await updateUserState(user.telegram_id, UserState.IN_CAPTCHA);

  const options = buildAnswerOptions(challenge.answer);
  const keyboard = Markup.inlineKeyboard(
    options.map((opt) => Markup.button.callback(String(opt), `captcha:${opt}`))
  );
  console.log('🧠 sendCaptcha preparing keyboard', {
    chatId: ctx.chat?.id,
    hasKeyboard: !!keyboard,
    keyboardKeys: Object.keys(keyboard),
  });

  await ctx.reply(t(user.language, 'welcome', { question: challenge.question }), keyboard);
}

/** Handles a button press on the captcha keyboard (callback_query). */
export async function handleCaptchaAnswer(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery();
    return;
  }

  const data = ctx.callbackQuery.data; // e.g. "captcha:17"
  const submitted = Number(data.split(':')[1]);

  const challenge = getChallenge(user.telegram_id);
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

  if (isExpired(challenge)) {
    clearChallenge(user.telegram_id);
    const fresh = createChallenge(user.telegram_id);
    const options = buildAnswerOptions(fresh.answer);
    const keyboard = Markup.inlineKeyboard(
      options.map((opt) => Markup.button.callback(String(opt), `captcha:${opt}`))
    );
    console.log('🧠 sendCaptcha expired challenge keyboard', {
      chatId: ctx.chat?.id,
      hasKeyboard: !!keyboard,
      keyboardKeys: Object.keys(keyboard),
    });
    await updateUserState(user.telegram_id, UserState.IN_CAPTCHA);
    await ctx.reply(t(user.language, 'captcha_expired', { question: fresh.question }), keyboard);
    return;
  }

  if (submitted === challenge.answer) {
    clearChallenge(user.telegram_id);
    await resetFailedAttempts(user.telegram_id);
    await updateUserState(user.telegram_id, UserState.SELECT_LANG);

    const { buildLanguageKeyboard } = await import('./languageHandler');
    await ctx.reply(t(user.language, 'captcha_success'), buildLanguageKeyboard());
    return;
  }

  // Wrong answer path
  const attempts = incrementAttempt(user.telegram_id);
  const dbAttempts = await incrementFailedAttempts(user.telegram_id);

  if (dbAttempts >= config.captcha.maxAttempts || attempts >= config.captcha.maxAttempts) {
    clearChallenge(user.telegram_id);
    await banUser(user.telegram_id, config.captcha.banDurationHours);
    const hours = config.captcha.banDurationHours;
    await ctx.reply(t(user.language, 'banned', { hours }));
    logger.warn('User banned after failed captcha attempts', { telegramId: user.telegram_id });
    return;
  }

  const remaining = config.captcha.maxAttempts - dbAttempts;
  const options = buildAnswerOptions(challenge.answer);
  const keyboard = Markup.inlineKeyboard(
    options.map((opt) => Markup.button.callback(String(opt), `captcha:${opt}`))
  );
  console.log('🧠 sendCaptcha wrong answer keyboard', {
    chatId: ctx.chat?.id,
    remaining,
    hasKeyboard: !!keyboard,
    keyboardKeys: Object.keys(keyboard),
  });
  await ctx.reply(t(user.language, 'captcha_wrong', { remaining }), keyboard);
}
