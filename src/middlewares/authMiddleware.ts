import { BotContext } from '../types/context';
import { getOrCreateUser, isBanActive } from '../database/db';
import { UserState } from '../types';
import { logger } from '../utils/logger';

export async function authMiddleware(ctx: BotContext, next: () => Promise<void>) {
  if (!ctx.from) {
    await next();
    return;
  }

  try {
    const user = await getOrCreateUser(ctx.from.id, ctx.from.username ?? null);
    ctx.dbUser = user;

    if (isBanActive(user)) {
      await ctx.reply('🚫 You are banned. Please try again later.');
      return;
    }

    await next();
  } catch (err) {
    logger.error('Auth middleware error', { error: (err as Error).message });
    await ctx.reply('⚠️ An error occurred. Please try again later.');
  }
}