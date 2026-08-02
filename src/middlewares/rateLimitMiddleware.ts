import { BotContext } from '../types/context';
import { checkRateLimit } from '../services/rateLimiter';
import { t } from '../locales';
import { UserState } from '../types';

/**
 * Applies rate limiting only to verified users sending free-text messages
 * (i.e. messages that would trigger a Gemini API call). Captcha button
 * presses and language selection are NOT rate-limited here, since they're
 * bounded by the captcha flow itself (max attempts + expiry).
 */
export async function rateLimitMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const user = ctx.dbUser;
  if (!user || user.state !== UserState.READY) {
    return next();
  }

  const result = checkRateLimit(user.telegram_id);
  if (!result.allowed) {
    const seconds = Math.ceil(result.retryAfterMs / 1000);
    await ctx.reply(`${t(user.language, 'rate_limited')} (${seconds}s)`);
    return; // stop here, do not call next() / Gemini
  }

  await next();
}
