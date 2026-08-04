import { getOrCreateUser } from '../../database/db';
import { BotContext } from '../../types/context';
import { UserState } from '../../types';
import { sendCaptcha } from './captchaHandler';
import { isBlank } from '../../utils/sanitize';
import { logger } from '../../utils/logger';

export async function handleMessage(ctx: BotContext): Promise<void> {
  console.log('📨 Message received:', ctx.message && 'text' in ctx.message ? ctx.message.text : '🖼️ (non-text message)');

  let user = ctx.dbUser;
  if (!user) {
    const from = ctx.from;
    if (!from) {
      console.log('⚠️ No from in ctx, returning');
      return;
    }
    console.log('🔍 Loading user from database for:', from.id);
    user = await getOrCreateUser(from.id, from.username ?? null);
    ctx.dbUser = user;
  }

  if (!user) {
    console.log('⚠️ No user found, returning');
    return;
  }

  console.log('👤 User state:', user.state);

  // ---- اگر کاربر کپچا را حل نکرده، کپچا بفرست ----
  if (user.state !== UserState.READY) {
    switch (user.state) {
      case UserState.UNVERIFIED:
      case UserState.IN_CAPTCHA:
        console.log('🚧 handleMessage sending captcha keyboard for state', user.state);
        await sendCaptcha(ctx);
        return;
      default:
        await ctx.reply('⚠️ Please complete the captcha first using /start.');
        return;
    }
  }

  // ---- اگر کاربر READY است، فقط راهنمایی به Mini App ----
  const text = 'text' in ctx.message! ? ctx.message.text : '';
  if (isBlank(text)) return;

  // اگر کاربر در حالت READY است، به او بگویید از Mini App استفاده کند
  await ctx.reply(
    '🤖 All conversations with Xman now happen inside the Mini App.\n\n' +
    '📱 Please open the Mini App using the Menu button below to continue your Web3 training.\n\n' +
    '🔐 If you haven\'t solved the captcha yet, please use /start first.'
  );
}