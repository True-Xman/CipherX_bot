import { BotContext } from '../../types/context';
import { UserState } from '../../types';
import { sendCaptcha } from './captchaHandler';

export async function handleStart(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('⚠️ Please try again later.');
    return;
  }

  console.log('🔍 handleStart: user state =', user.state);

  // اگر کاربر READY است، پیام راهنمایی به Mini App بفرست
  if (user.state === UserState.READY) {
    await ctx.reply(
      '🤖 All conversations with Xman now happen inside the Mini App.\n\n' +
      '📱 Please open the Mini App using the Menu button below to continue your Web3 training.'
    );
    return;
  }

  // در غیر این صورت (UNVERIFIED, IN_CAPTCHA, BANNED, ...) کپچا بفرست
  await sendCaptcha(ctx);
}