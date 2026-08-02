import { getOrCreateUser } from '../../database/db';
import { BotContext } from '../../types/context';
import { UserState } from '../../types';
import { sendCaptcha } from './captchaHandler';
import { buildLanguageKeyboard } from './languageHandler';
import { t } from '../../locales';
import { askGemini } from '../../services/geminiService';
import { chatWithOpenRouter } from '../../services/openrouterService';
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
  console.log('👤 User language:', user.language);

  if (user.state !== UserState.READY) {
    switch (user.state) {
      case UserState.UNVERIFIED:
      case UserState.IN_CAPTCHA:
        console.log('🚧 handleMessage sending captcha keyboard for state', user.state);
        await sendCaptcha(ctx);
        return;
      case UserState.SELECT_LANG:
        {
          const keyboard = buildLanguageKeyboard();
          console.log('🚧 handleMessage sending language selection keyboard', {
            chatId: ctx.chat?.id,
            hasKeyboard: !!keyboard,
            keyboardKeys: Object.keys(keyboard),
          });
          await ctx.reply(t(user.language, 'select_language_prompt'), keyboard);
        }
        return;
      default:
        await ctx.reply(t(user.language, 'not_verified'));
        return;
    }
  }

  const text = 'text' in ctx.message! ? ctx.message.text : '';
  if (isBlank(text)) return;

  await ctx.sendChatAction('typing');

  // انتخاب سرویس بر اساس AI_PROVIDER
  const aiProvider = process.env.AI_PROVIDER || 'gemini';
  let result;
  if (aiProvider === 'openrouter') {
    result = await chatWithOpenRouter(user.telegram_id.toString(), text);
  } else {
    result = await askGemini(user.telegram_id.toString(), text);
  }

  if (!result.success || !result.text) {
    logger.warn('AI call failed for user', { telegramId: user.telegram_id, reason: result.error });
    await ctx.reply(t(user.language, 'gemini_error'));
    return;
  }

  await ctx.reply(result.text);
}