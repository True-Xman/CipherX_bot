import { initDb } from './database/db';
import { logger } from './utils/logger';
import { handleMessage } from './bot/handlers/messageHandler';
import { handleCaptchaAnswer } from './bot/handlers/captchaHandler';
import { getOrCreateUser } from './database/db';
import { BotContext } from './types/context';
import * as fs from 'fs';
import * as path from 'path';
import xmanChatRoutes from './routes/xmanChat';
import express from 'express';
import cors from 'cors';

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
let pollingTimer: NodeJS.Timeout | undefined;
let releaseLock: () => void = () => undefined;

function acquireSingleInstanceLock(): () => void {
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
      } catch {
        fs.unlinkSync(lockPath);
      }
    }
  }

  fs.writeFileSync(lockPath, String(process.pid), 'utf8');

  return () => {
    try {
      fs.unlinkSync(lockPath);
    } catch {
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

async function sendMessage(chatId: number, text: string, keyboard?: any) {
  try {
    console.log(`📤 Sending message to ${chatId}: ${text.substring(0, 50)}...`);
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const payload: any = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (keyboard) {
      const replyMarkup =
        keyboard.reply_markup ??
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
    } else {
      console.log('✅ Message sent successfully!');
    }
  } catch (err) {
    console.error('❌ sendMessage exception:', err);
  }
}

async function getUpdates() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
    console.log(`📡 Fetching updates with offset ${offset}...`);
    const res = await fetch(url);
    const data: any = await res.json();

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
            reply: async (text: string, keyboard?: any) => {
              console.log('🔁 ctx.reply (message update)', {
                chatId: update.message.chat.id,
                textPreview: text.substring(0, 50),
                hasKeyboard: !!keyboard,
                keyboardKeys: keyboard ? Object.keys(keyboard) : undefined,
              });
              await sendMessage(update.message.chat.id, text, keyboard);
            },
            sendChatAction: async (action: string) => {},
            answerCbQuery: async () => {},
            dbUser: null,
          } as any;

          try {
            await handleMessage(ctx);
          } catch (err) {
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
            (cb as any).data = normalizedCbData;
          } catch (e) {
            // ignore
          }

          const from = cb.from;
          const chatId = cb.message.chat.id;

          let user = await getOrCreateUser(from.id, from.username ?? null);

          const ctx = {
            from: from,
            chat: cb.message.chat,
            callbackQuery: cb,
            message: cb.message,
            dbUser: user,
            reply: async (text: string, keyboard?: any) => {
              console.log('🔁 ctx.reply (callback query)', {
                chatId,
                callbackData: cb.data,
                textPreview: text.substring(0, 50),
                hasKeyboard: !!keyboard,
                keyboardKeys: keyboard ? Object.keys(keyboard) : undefined,
              });
              await sendMessage(chatId, text, keyboard);
            },
            sendChatAction: async (action: string) => {},
            answerCbQuery: async (text?: string) => {
              try {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ callback_query_id: cb.id, text: text || '' }),
                });
              } catch (err) {
                console.error('❌ answerCbQuery error:', err);
              }
            },
          } as any;

          if (cb.data && cb.data.startsWith('captcha:')) {
            try {
              await handleCaptchaAnswer(ctx);
            } catch (err) {
              console.error('❌ handleCaptchaAnswer error:', err);
            }
          } else {
            console.log('⚠️ Unknown callback data:', cb.data);
          }
        }

        offset = update.update_id + 1;
        console.log(`🔄 Offset updated to ${offset}`);
      }
    } else {
      if (data?.error_code === 409) {
        console.error('❌ Telegram rejected getUpdates because another bot instance is already running.');
        stopPolling();
        releaseLock();
        process.exit(1);
      }
      console.log('⚠️ No updates or API error:', data);
    }
  } catch (err) {
    console.error('❌ getUpdates error:', err);
  } finally {
    isProcessing = false;
  }
}

async function main() {
  console.log('🤖 Starting CipherX with getUpdates...');
  releaseLock = acquireSingleInstanceLock();
  await initDb();
  console.log('✅ Database ready');

  // ---- شروع سرور Express برای APIهای Xman ----
  const app = express();
  const API_PORT = process.env.API_PORT || 3001;

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.use(cors({
    origin: (origin: any, callback: any) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));
  app.use(express.json());

  // مسیرهای API Xman
  app.use(xmanChatRoutes);

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