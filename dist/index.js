"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./database/db");
const messageHandler_1 = require("./bot/handlers/messageHandler");
const captchaHandler_1 = require("./bot/handlers/captchaHandler");
const db_2 = require("./database/db");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const xmanChat_1 = __importDefault(require("./routes/xmanChat"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
process.env.NO_PROXY = '*';
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/BOT_TOKEN=([^\r\n]+)/);
const BOT_TOKEN = tokenMatch ? tokenMatch[1].trim() : '';
if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN not found in .env');
    process.exit(1);
}
let offset = 0;
let isProcessing = false;
let pollingTimer;
let releaseLock = () => undefined;
function acquireSingleInstanceLock() {
    const lockPath = path.join(process.cwd(), 'data', 'bot.lock');
    const lockDir = path.dirname(lockPath);
    if (!fs.existsSync(lockDir)) {
        fs.mkdirSync(lockDir, { recursive: true });
    }
    if (fs.existsSync(lockPath)) {
        const existingPid = fs.readFileSync(lockPath, 'utf8').trim();
        if (existingPid) {
            try {
                process.kill(Number(existingPid), 0);
                console.error(`❌ Another bot instance is already running (PID ${existingPid}). Stop it before starting a new one.`);
                process.exit(1);
            }
            catch {
                fs.unlinkSync(lockPath);
            }
        }
    }
    fs.writeFileSync(lockPath, String(process.pid), 'utf8');
    return () => {
        try {
            fs.unlinkSync(lockPath);
        }
        catch {
            // ignore cleanup errors
        }
    };
}
function stopPolling() {
    if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = undefined;
    }
}
async function sendMessage(chatId, text, keyboard) {
    try {
        console.log(`📤 Sending message to ${chatId}: ${text.substring(0, 50)}...`);
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const payload = { chat_id: chatId, text, parse_mode: 'HTML' };
        if (keyboard) {
            const replyMarkup = keyboard.reply_markup ??
                (keyboard.inline_keyboard ? keyboard : keyboard);
            payload.reply_markup = replyMarkup;
            console.log('📌 sendMessage received keyboard:', JSON.stringify(replyMarkup));
            console.log('📌 sendMessage final payload reply_markup:', JSON.stringify(payload.reply_markup));
        }
        if (!payload.reply_markup && process.env.SEND_MESSAGE_HARD_CODED_BUTTON === '1') {
            payload.reply_markup = {
                inline_keyboard: [[{ text: 'Debug Button', callback_data: 'debug:test' }]],
            };
            console.log('🔧 sendMessage attached hardcoded debug inline keyboard');
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('❌ Telegram API error:', {
                status: response.status,
                statusText: response.statusText,
                data: data,
            });
        }
        else {
            console.log('✅ Message sent successfully!');
        }
    }
    catch (err) {
        console.error('❌ sendMessage exception:', err);
    }
}
async function getUpdates() {
    if (isProcessing)
        return;
    isProcessing = true;
    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
        console.log(`📡 Fetching updates with offset ${offset}...`);
        const res = await fetch(url);
        const data = await res.json();
        if (data.ok && data.result) {
            console.log(`📦 Received ${data.result.length} updates`);
            for (const update of data.result) {
                // ---- پردازش پیام متنی ----
                if (update.message && update.message.text) {
                    console.log('📨 Message received:', update.message.text);
                    const ctx = {
                        from: update.message.from,
                        message: update.message,
                        chat: update.message.chat,
                        reply: async (text, keyboard) => {
                            console.log('🔁 ctx.reply (message update)', {
                                chatId: update.message.chat.id,
                                textPreview: text.substring(0, 50),
                                hasKeyboard: !!keyboard,
                                keyboardKeys: keyboard ? Object.keys(keyboard) : undefined,
                            });
                            await sendMessage(update.message.chat.id, text, keyboard);
                        },
                        sendChatAction: async (action) => { },
                        answerCbQuery: async () => { },
                        dbUser: null,
                    };
                    try {
                        await (0, messageHandler_1.handleMessage)(ctx);
                    }
                    catch (err) {
                        console.error('❌ handleMessage error:', err);
                        await sendMessage(update.message.chat.id, '⚠️ An error occurred.');
                    }
                }
                // ---- پردازش کلیک روی دکمه‌ها (callback_query) ----
                if (update.callback_query) {
                    const cb = update.callback_query;
                    const rawCbData = cb.data ?? '';
                    const normalizedCbData = (typeof rawCbData === 'string' ? rawCbData.replace(/^\uFEFF/, '').trim() : rawCbData);
                    console.log('🔘 Callback query received:', cb.data);
                    console.log('🔍 Callback data raw (json):', JSON.stringify(rawCbData));
                    console.log('🔍 Callback data normalized (json):', JSON.stringify(normalizedCbData));
                    console.log('🔎 startsWith checks:', {
                        captcha: typeof normalizedCbData === 'string' && normalizedCbData.startsWith('captcha:'),
                        length: typeof normalizedCbData === 'string' ? normalizedCbData.length : null,
                    });
                    try {
                        cb.data = normalizedCbData;
                    }
                    catch (e) {
                        // ignore
                    }
                    const from = cb.from;
                    const chatId = cb.message.chat.id;
                    let user = await (0, db_2.getOrCreateUser)(from.id, from.username ?? null);
                    const ctx = {
                        from: from,
                        chat: cb.message.chat,
                        callbackQuery: cb,
                        message: cb.message,
                        dbUser: user,
                        reply: async (text, keyboard) => {
                            console.log('🔁 ctx.reply (callback query)', {
                                chatId,
                                callbackData: cb.data,
                                textPreview: text.substring(0, 50),
                                hasKeyboard: !!keyboard,
                                keyboardKeys: keyboard ? Object.keys(keyboard) : undefined,
                            });
                            await sendMessage(chatId, text, keyboard);
                        },
                        sendChatAction: async (action) => { },
                        answerCbQuery: async (text) => {
                            try {
                                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ callback_query_id: cb.id, text: text || '' }),
                                });
                            }
                            catch (err) {
                                console.error('❌ answerCbQuery error:', err);
                            }
                        },
                    };
                    if (cb.data && cb.data.startsWith('captcha:')) {
                        try {
                            await (0, captchaHandler_1.handleCaptchaAnswer)(ctx);
                        }
                        catch (err) {
                            console.error('❌ handleCaptchaAnswer error:', err);
                        }
                    }
                    else {
                        console.log('⚠️ Unknown callback data:', cb.data);
                    }
                }
                offset = update.update_id + 1;
                console.log(`🔄 Offset updated to ${offset}`);
            }
        }
        else {
            if (data?.error_code === 409) {
                console.error('❌ Telegram rejected getUpdates because another bot instance is already running.');
                stopPolling();
                releaseLock();
                process.exit(1);
            }
            console.log('⚠️ No updates or API error:', data);
        }
    }
    catch (err) {
        console.error('❌ getUpdates error:', err);
    }
    finally {
        isProcessing = false;
    }
}
async function main() {
    console.log('🤖 Starting CipherX with getUpdates...');
    releaseLock = acquireSingleInstanceLock();
    await (0, db_1.initDb)();
    console.log('✅ Database ready');
    // ---- شروع سرور Express برای APIهای Xman ----
    const app = (0, express_1.default)();
    const API_PORT = process.env.API_PORT || 3001;
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.FRONTEND_URL,
    ].filter(Boolean);
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }));
    app.use(express_1.default.json());
    // مسیرهای API Xman
    app.use(xmanChat_1.default);
    // Health check
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.listen(API_PORT, () => {
        console.log(`🌐 Xman API server running on http://localhost:${API_PORT}`);
        console.log(`📡 Health check: http://localhost:${API_PORT}/health`);
    });
    // ---- شروع Polling ربات تلگرام ----
    pollingTimer = setInterval(() => {
        void getUpdates();
    }, 2000);
    console.log('🔄 Listening for messages...');
    process.once('SIGINT', () => {
        console.log('👋 Shutting down...');
        stopPolling();
        releaseLock();
        process.exit(0);
    });
    process.once('SIGTERM', () => {
        console.log('👋 Shutting down...');
        stopPolling();
        releaseLock();
        process.exit(0);
    });
}
main().catch((err) => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map