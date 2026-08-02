import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  telegram: {
    botToken: process.env.BOT_TOKEN || '',
    botUsername: process.env.BOT_USERNAME || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.AI_MODEL || 'openrouter/free',
  },
  db: {
    path: process.env.DB_PATH || './data/bot.db',
  },
  api: {
    port: parseInt(process.env.API_PORT || '3001', 10),
  },
  captcha: {
    timeoutSeconds: parseInt(process.env.CAPTCHA_TIMEOUT_SECONDS || '60', 10),
    maxAttempts: parseInt(process.env.CAPTCHA_MAX_ATTEMPTS || '3', 10),
    banDurationHours: parseInt(process.env.CAPTCHA_BAN_DURATION_HOURS || '24', 10),
  },
  rateLimit: {
    windowSeconds: parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS || '60', 10),
    maxMessages: parseInt(process.env.RATE_LIMIT_MAX_MESSAGES || '5', 10),
  },
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  nodeEnv: process.env.NODE_ENV || 'development',
};

// فقط در صورتی که AI_PROVIDER برابر gemini باشد، GEMINI_API_KEY اجباری است
if (process.env.AI_PROVIDER === 'gemini' && !config.gemini.apiKey) {
  throw new Error('[config] Missing required environment variable: GEMINI_API_KEY');
}

if (process.env.AI_PROVIDER === 'openrouter' && !config.openrouter.apiKey) {
  throw new Error('[config] Missing required environment variable: OPENROUTER_API_KEY');
}

export type SupportedLanguage = 'en' | 'ar' | 'tr' | 'ru';
