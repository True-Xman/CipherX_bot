import { Telegraf } from 'telegraf';
import { config } from '../config/config';
import { BotContext } from '../types/context';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rateLimitMiddleware } from '../middlewares/rateLimitMiddleware';
import { handleStart } from './handlers/startHandler';
import { handleCaptchaAnswer } from './handlers/captchaHandler';
import { handleLanguageSelect, handleMainMenuSelection } from './handlers/languageHandler';
import { handleMessage } from './handlers/messageHandler';
import { handleLearningCallback } from './handlers/learningHandler';
import { t } from '../locales';
import { logger } from '../utils/logger';

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(config.telegram.botToken);

  // --- Global middlewares (order matters) ---
  // 1. authMiddleware: loads/creates the user, enforces ban gate. Runs first,
  //    for every single update, so nothing downstream runs for a banned user.
  bot.use(authMiddleware);
  // 2. rateLimitMiddleware: only throttles READY users sending free text
  //    (checked internally); harmless no-op for captcha/lang steps.
  bot.use(rateLimitMiddleware);

  // --- Commands ---
  bot.command('start', handleStart);

  // --- Callback queries (inline keyboard button presses) ---
  bot.action(/^captcha:/, handleCaptchaAnswer);
  bot.action(/^lang:/, handleLanguageSelect);
  bot.action(/^menu:/, handleMainMenuSelection);
  bot.action(/^learn:/, handleLearningCallback);

  // --- Free text messages (must come after action handlers) ---
  bot.on('text', handleMessage);

  // --- Global error handler so one bad update can't crash the process ---
  bot.catch((err, ctx) => {
    logger.error('Unhandled bot error', { error: (err as Error).message });
    const lang = ctx.dbUser?.language ?? (config.defaultLanguage as any);
    ctx.reply(t(lang, 'generic_error')).catch(() => {
      /* swallow secondary failure */
    });
  });

  return bot;
}
