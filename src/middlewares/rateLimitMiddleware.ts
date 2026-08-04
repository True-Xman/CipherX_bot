import { BotContext } from '../types/context';
import { checkRateLimit } from '../services/rateLimiter';
import { UserState } from '../types';
import { logger } from '../utils/logger';

export async function rateLimitMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const user = ctx.dbUser;
  if (!user || user.state !== UserState.READY || !ctx.message || !('text' in ctx.message)) {
    await next();
    return;
  }

  const result = checkRateLimit(user.telegram_id);
  if (!result.allowed) {
    logger.warn('Rate limit exceeded', { telegramId: user.telegram_id });
    await ctx.reply(`⏳ Too many messages. Please wait ${Math.ceil(result.retryAfterMs / 1000)} seconds.`);
    return;
  }

  await next();
}