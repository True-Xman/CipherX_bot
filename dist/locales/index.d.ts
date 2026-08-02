import en from './en.json';
import { SupportedLanguage } from '../config/config';
type LocaleKeys = keyof typeof en;
/**
 * Translate a key for the given language, with {{placeholder}} interpolation.
 * Falls back to English, then to the raw key, if something is missing —
 * this way a missing translation never crashes the bot.
 */
export declare function t(lang: SupportedLanguage, key: LocaleKeys, vars?: Record<string, string | number>): string;
/**
 * Map Telegram's `language_code` (e.g. "fa", "en-US", "ar") to one of our
 * supported languages, defaulting to English if there's no match.
 */
export declare function detectLanguage(telegramLangCode: string | undefined): SupportedLanguage;
export declare const languageNames: Record<SupportedLanguage, string>;
export {};
//# sourceMappingURL=index.d.ts.map