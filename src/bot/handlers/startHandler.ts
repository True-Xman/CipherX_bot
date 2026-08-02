import { BotContext } from '../../types/context';
import { UserState } from '../../types';
import { sendCaptcha } from './captchaHandler';
import { buildLanguageKeyboard } from './languageHandler';
import { startLearningPath } from './learningHandler';
import { t } from '../../locales';

/**
 * Entry point for /start. Resumes the user wherever they left off instead
 * of always resetting — this avoids letting a user "escape" verification
 * by just re-running /start repeatedly.
 */
export async function handleStart(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) return;

  switch (user.state) {
    case UserState.UNVERIFIED:
    case UserState.IN_CAPTCHA:
      await sendCaptcha(ctx);
      break;

    case UserState.SELECT_LANG:
      {
        const keyboard = buildLanguageKeyboard();
        console.log('🧩 handleStart sending language selection keyboard', {
          chatId: ctx.chat?.id,
          hasKeyboard: !!keyboard,
          keyboardKeys: Object.keys(keyboard),
        });
        await ctx.reply(t(user.language, 'select_language_prompt'), keyboard);
      }
      break;

    case UserState.READY:
      await startLearningPath(ctx);
      break;

    default:
      await sendCaptcha(ctx);
  }
}
