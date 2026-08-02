import { Markup } from 'telegraf';
import { BotContext } from '../../types/context';
import { setUserLanguage, updateUserState } from '../../database/db';
import { UserState } from '../../types';
import { t, languageNames } from '../../locales';
import { SupportedLanguage } from '../../config/config'; // Only import SupportedLanguage
import { handleLearningMenuAction } from './learningHandler';

// ============================================================
//  منوی اصلی (Main Menu) با دکمه‌های شیشه‌ای
// ============================================================
function getMainMenu(lang: SupportedLanguage): { text: string; keyboard: any } {
  const messages: Record<SupportedLanguage, string> = {
    en: `🎉 **Welcome to CipherX, your Web3 companion!**

I'm here to make your journey into blockchain simple, safe, and fun. 🚀

Whether you're a beginner or a pro, you can count on me to:
• Explain networks like Base and Ethereum ⛓️
• Keep your assets safe with security tips 🛡️
• Guide you through transactions and gas fees 💸
• Answer all your Web3 questions! 🤖

💡 Ready to explore? Just click a button below or ask me anything!`,

    ar: `🎉 **مرحباً بك في CipherX، رفيقك في عالم Web3!**

أنا هنا لجعل رحلتك في البلوكتشين بسيطة وآمنة وممتعة. 🚀

سواء كنت مبتدئاً أو محترفاً، يمكنك الاعتماد عليّ في:
• شرح الشبكات مثل Base و Ethereum ⛓️
• حماية أصولك بنصائح أمنية 🛡️
• إرشادك خلال المعاملات ورسوم الغاز 💸
• الإجابة على جميع أسئلتك حول Web3! 🤖

💡 هل أنت مستعد للاستكشاف؟ فقط انقر على أحد الأزرار أدناه أو اسألني أي شيء!`,

    tr: `🎉 **CipherX'a hoş geldiniz, Web3 yol arkadaşınız!**

Blockchain yolculuğunuzu basit, güvenli ve eğlenceli hale getirmek için buradayım. 🚀

İster yeni başlayan ister profesyonel olun, bana güvenebilirsiniz:
• Base ve Ethereum gibi ağları açıklamak ⛓️
• Varlıklarınızı güvenlik ipuçlarıyla korumak 🛡️
• İşlemler ve gas ücretleri konusunda rehberlik etmek 💸
• Tüm Web3 sorularınızı yanıtlamak! 🤖

💡 Keşfetmeye hazır mısınız? Aşağıdaki butonlardan birine tıklayın veya istediğinizi sorun!`,

    ru: `🎉 **Добро пожаловать в CipherX, вашего попутчика в мире Web3!**

Я здесь, чтобы сделать ваше путешествие в блокчейн простым, безопасным и увлекательным. 🚀

Будь вы новичком или профессионалом, вы можете положиться на меня:
• Объяснение сетей, таких как Base и Ethereum ⛓️
• Защита ваших активов с помощью советов по безопасности 🛡️
• Руководство по транзакциям и комиссиям за газ 💸
• Ответы на все ваши вопросы о Web3! 🤖

💡 Готовы исследовать? Просто нажмите на одну из кнопок ниже или задайте мне любой вопрос!`,
  };

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🧠 Web3 Academy', 'menu:learn')],
    [Markup.button.callback('👛 My Wallet', 'menu:wallet')],
    [Markup.button.callback('⛓️ Network Status', 'menu:network')],
    [Markup.button.callback('🪙 Faucet', 'menu:faucet')],
    [Markup.button.callback('⚙️ Settings', 'menu:settings')],
  ]);

  return {
    text: messages[lang] || messages.en,
    keyboard,
  };
}

// ============================================================
//  کیبورد انتخاب زبان
// ============================================================
export function buildLanguageKeyboard() {
  const supportedLanguages: SupportedLanguage[] = ['en', 'ar', 'tr', 'ru'];
  return Markup.inlineKeyboard(
    supportedLanguages.map((code) => Markup.button.callback(languageNames[code], `lang:${code}`)),
    { columns: 2 }
  );
}

// ============================================================
//  هندلر انتخاب زبان
// ============================================================
function normalizeInlineKeyboard(keyboard: unknown): any {
  if (!keyboard || typeof keyboard !== 'object') {
    return undefined;
  }

  const maybeMarkup = keyboard as Record<string, unknown>;
  if (maybeMarkup.reply_markup && typeof maybeMarkup.reply_markup === 'object') {
    return maybeMarkup.reply_markup;
  }

  if (maybeMarkup.inline_keyboard && Array.isArray(maybeMarkup.inline_keyboard)) {
    return maybeMarkup;
  }

  return undefined;
}

export async function handleLanguageSelect(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery();
    return;
  }

  const data = ctx.callbackQuery.data;
  const code = data.split(':')[1] as SupportedLanguage;

  await ctx.answerCbQuery();

  const supportedLanguages: SupportedLanguage[] = ['en', 'ar', 'tr', 'ru'];
  if (!supportedLanguages.includes(code)) {
    return;
  }

  // ذخیره زبان و تغییر وضعیت به READY
  await setUserLanguage(user.telegram_id, code);
  await updateUserState(user.telegram_id, UserState.READY);

  // دریافت پیام خوش‌آمدگویی و منوی اصلی
  const { text, keyboard } = getMainMenu(code);
  const replyMarkup = normalizeInlineKeyboard(keyboard);

  // ارسال پیام خوش‌آمدگویی با منو
  console.log('🧩 handleLanguageSelect sending main menu keyboard', {
    chatId: ctx.chat?.id,
    callbackData: data,
    hasKeyboard: !!replyMarkup,
    keyboardKind: keyboard ? typeof keyboard : 'undefined',
    replyMarkupShape: replyMarkup
      ? {
          hasInlineKeyboard: Array.isArray(replyMarkup.inline_keyboard),
          rowCount: replyMarkup.inline_keyboard?.length ?? 0,
        }
      : null,
  });

  await ctx.reply(text, replyMarkup ? { reply_markup: replyMarkup } : undefined);
}

export async function handleMainMenuSelection(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user || !ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
    await ctx.answerCbQuery();
    return;
  }

  const data = ctx.callbackQuery.data;

  if (data === 'menu:learn') {
    await ctx.answerCbQuery('Starting Web3 Academy');
    await handleLearningMenuAction(ctx);
    return;
  }

  if (data === 'menu:wallet') {
    await ctx.answerCbQuery('Wallet info');
    await ctx.reply(t(user.language, 'menu_wallet_under_development'));
    return;
  }

  if (data === 'menu:network') {
    await ctx.answerCbQuery('Network status');
    await ctx.reply(t(user.language, 'menu_network_status'));
    return;
  }

  if (data === 'menu:faucet') {
    await ctx.answerCbQuery('Faucet info');
    await ctx.reply(t(user.language, 'menu_faucet_info'));
    return;
  }

  if (data === 'menu:settings') {
    await ctx.answerCbQuery('Settings');
    await ctx.reply(t(user.language, 'menu_settings'));
    return;
  }

  await ctx.answerCbQuery();
}
