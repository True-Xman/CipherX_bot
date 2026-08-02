import en from './en.json';
import ar from './ar.json';
import tr from './tr.json';
import ru from './ru.json';
import { SupportedLanguage, config } from '../config/config';

type LocaleKeys = keyof typeof en;

const locales = { en, ar, tr, ru };

// لیست زبان‌های پشتیبانی‌شده (همانند SupportedLanguage)
const SUPPORTED_LANGUAGES = ['en', 'ar', 'tr', 'ru'] as const;

/**
 * Translate a key for the given language, with {{placeholder}} interpolation.
 * Falls back to English, then to the raw key, if something is missing —
 * this way a missing translation never crashes the bot.
 */
export function t(
  lang: SupportedLanguage,
  key: LocaleKeys,
  vars?: Record<string, string | number>
): string {
  const dict = locales[lang] || locales[config.defaultLanguage as SupportedLanguage];
  let template = dict[key] ?? locales.en[key] ?? key;

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return template;
}

/**
 * Map Telegram's `language_code` (e.g. "fa", "en-US", "ar") to one of our
 * supported languages, defaulting to English if there's no match.
 */
export function detectLanguage(telegramLangCode: string | undefined): SupportedLanguage {
  if (!telegramLangCode) return config.defaultLanguage as SupportedLanguage;
  const short = telegramLangCode.split('-')[0].toLowerCase();
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(short)
    ? (short as SupportedLanguage)
    : (config.defaultLanguage as SupportedLanguage);
}

export const languageNames: Record<SupportedLanguage, string> = {
  en: '🇬🇧 English',
  ar: '🇸🇦 العربية',
  tr: '🇹🇷 Türkçe',
  ru: '🇷🇺 Русский',
};