"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
exports.config = {
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
if (process.env.AI_PROVIDER === 'gemini' && !exports.config.gemini.apiKey) {
    throw new Error('[config] Missing required environment variable: GEMINI_API_KEY');
}
if (process.env.AI_PROVIDER === 'openrouter' && !exports.config.openrouter.apiKey) {
    throw new Error('[config] Missing required environment variable: OPENROUTER_API_KEY');
}
//# sourceMappingURL=config.js.map