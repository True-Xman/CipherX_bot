"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageNames = void 0;
exports.t = t;
exports.detectLanguage = detectLanguage;
const en_json_1 = __importDefault(require("./en.json"));
const ar_json_1 = __importDefault(require("./ar.json"));
const tr_json_1 = __importDefault(require("./tr.json"));
const ru_json_1 = __importDefault(require("./ru.json"));
const config_1 = require("../config/config");
const locales = { en: en_json_1.default, ar: ar_json_1.default, tr: tr_json_1.default, ru: ru_json_1.default };
// لیست زبان‌های پشتیبانی‌شده (همانند SupportedLanguage)
const SUPPORTED_LANGUAGES = ['en', 'ar', 'tr', 'ru'];
/**
 * Translate a key for the given language, with {{placeholder}} interpolation.
 * Falls back to English, then to the raw key, if something is missing —
 * this way a missing translation never crashes the bot.
 */
function t(lang, key, vars) {
    const dict = locales[lang] || locales[config_1.config.defaultLanguage];
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
function detectLanguage(telegramLangCode) {
    if (!telegramLangCode)
        return config_1.config.defaultLanguage;
    const short = telegramLangCode.split('-')[0].toLowerCase();
    return SUPPORTED_LANGUAGES.includes(short)
        ? short
        : config_1.config.defaultLanguage;
}
exports.languageNames = {
    en: '🇬🇧 English',
    ar: '🇸🇦 العربية',
    tr: '🇹🇷 Türkçe',
    ru: '🇷🇺 Русский',
};
//# sourceMappingURL=index.js.map