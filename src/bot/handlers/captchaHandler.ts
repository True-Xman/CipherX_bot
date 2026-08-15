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
import { updateUserState, setUserVerified, incrementFailedAttempts, resetFailedAttempts, banUser } from '../../database/db';
import { UserState } from '../../types';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

export async function sendCaptcha(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  const challenge = createChallenge(user.telegram_id);
  await updateUserState(user.telegram_id, UserState.IN_CAPTCHA);

  const options = buildAnswerOptions(challenge.answer);
  const keyboard = Markup.inlineKeyboard(
    options.map((opt) => Markup.button.callback(String(opt), `captcha:${opt}`))
  );

  await ctx.reply(`🔐 Solve this captcha to continue:\n\n${challenge.question}`, keyboard);
}

export async function handleCaptchaAnswer(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery();
    return;
  }

  const data = ctx.callbackQuery.data;
  const submitted = Number(data.split(':')[1]);

  const challenge = getChallenge(user.telegram_id);
  await ctx.answerCbQuery();

  if (!challenge) {
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
    await updateUserState(user.telegram_id, UserState.IN_CAPTCHA);
    await ctx.reply(`⏳ Captcha expired. Try again:\n\n${fresh.question}`, keyboard);
    return;
  }

  if (submitted === challenge.answer) {
    clearChallenge(user.telegram_id);
    await resetFailedAttempts(user.telegram_id);
    await updateUserState(user.telegram_id, UserState.READY);
    await setUserVerified(user.telegram_id, true);
    await ctx.reply('✅ Captcha solved! You can now use the Mini App.');
    return;
  }

  // Wrong answer
  const attempts = incrementAttempt(user.telegram_id);
  const dbAttempts = await incrementFailedAttempts(user.telegram_id);

  if (dbAttempts >= config.captcha.maxAttempts || attempts >= config.captcha.maxAttempts) {
    clearChallenge(user.telegram_id);
    await banUser(user.telegram_id, config.captcha.banDurationHours);
    const hours = config.captcha.banDurationHours;
    await ctx.reply(`🚫 Too many failed attempts. You are banned for ${hours} hours.`);
    logger.warn('User banned after failed captcha attempts', { telegramId: user.telegram_id });
    return;
  }

  const remaining = config.captcha.maxAttempts - dbAttempts;
  const options = buildAnswerOptions(challenge.answer);
  const keyboard = Markup.inlineKeyboard(
    options.map((opt) => Markup.button.callback(String(opt), `captcha:${opt}`))
  );
  await ctx.reply(`❌ Wrong answer. ${remaining} attempts remaining. Try again:`, keyboard);
}