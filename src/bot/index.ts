import { Telegraf } from 'telegraf';
import { config } from '../config/config';
import { BotContext } from '../types/context';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rateLimitMiddleware } from '../middlewares/rateLimitMiddleware';
import { handleStart } from './handlers/startHandler';
import { handleCaptchaAnswer } from './handlers/captchaHandler';
import { handleMessage } from './handlers/messageHandler';
import { handleLearningCallback } from './handlers/learningHandler';
import { logger } from '../utils/logger';

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.telegram.botToken);

  // --- Global middlewares (order matters) ---
  bot.use(authMiddleware);
  bot.use(rateLimitMiddleware);

  // --- Commands ---
  bot.command('start', handleStart);

  // --- Callback queries ---
  bot.action(/^captcha:/, handleCaptchaAnswer);
  bot.action(/^learn:/, handleLearningCallback);

  // --- Free text messages ---
  bot.on('text', handleMessage);

  // --- Global error handler ---
  bot.catch((err, ctx) => {
    logger.error('Unhandled bot error', { error: (err as Error).message });
    ctx.reply('⚠️ An unexpected error occurred. Please try again.').catch(() => {});
  });

  return bot;
}