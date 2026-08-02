import { BotContext } from '../types/context';
import { getOrCreateUser, isBanActive, liftBan } from '../database/db';
import { UserState } from '../types';
import { t } from '../locales';
import { logger } from '../utils/logger';

/**
 * Runs on every update. Responsibilities:
 * 1. Load (or create) the user record and attach it to ctx.dbUser.
 * 2. If the user is banned and the ban hasn't expired, block them silently
 *    (with a message telling them how long is left) — this is what enforces
 *    "CAPTCHA first" security: nothing downstream (including Gemini) runs
 *    for a banned/unverified user except the captcha flow itself.
 * 3. If a ban HAS expired, lift it automatically and let them retry captcha.
 */
export async function authMiddleware(ctx: BotContext, next: () => Promise<void>) {
  console.log('🔐 authMiddleware called for user:', ctx.from?.id);
  try {
    const from = ctx.from;
    if (!from) return; // non-user updates (e.g. channel posts) are ignored

    let user = await getOrCreateUser(from.id, from.username ?? null);

    if (isBanActive(user)) {
      const hoursLeft = Math.ceil(((user.banned_until as number) - Date.now()) / (60 * 60 * 1000));
      await ctx.reply(t(user.language, 'banned', { hours: hoursLeft }));
      return; // hard stop — do not call next()
    }

    if (user.state === UserState.BANNED && !isBanActive(user)) {
      // Ban expired naturally -> reset to UNVERIFIED so captcha handler kicks in again.
      await liftBan(from.id);
      user = await getOrCreateUser(from.id, from.username ?? null);
    }

    ctx.dbUser = user;
    await next();
  } catch (err) {
    logger.error('authMiddleware failure', { error: (err as Error).message });
    // Fail closed: do not proceed to handlers if we couldn't establish identity/state.
    try {
      await ctx.reply('⚠️ Internal error. Please try again shortly.');
    } catch {
      /* ignore secondary failure */
    }
  }
}
