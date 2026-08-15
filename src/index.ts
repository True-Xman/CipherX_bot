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
  console.error('âŒ BOT_TOKEN not found in .env');
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
        console.error(`âŒ Another bot instance is already running (PID ${existingPid}). Stop it before starting a new one.`);
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
    console.log(`ðŸ“¤ Sending message to ${chatId}: ${text.substring(0, 50)}...`);
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const payload: any = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (keyboard) {
      const replyMarkup =
        keyboard.reply_markup ??
        (keyboard.inline_keyboard ? keyboard : keyboard);
      payload.reply_markup = replyMarkup;
      console.log('ðŸ“Œ sendMessage received keyboard:', JSON.stringify(replyMarkup));
      console.log('ðŸ“Œ sendMessage final payload reply_markup:', JSON.stringify(payload.reply_markup));
    }

    if (!payload.reply_markup && process.env.SEND_MESSAGE_HARD_CODED_BUTTON === '1') {
      payload.reply_markup = {
        inline_keyboard: [[{ text: 'Debug Button', callback_data: 'debug:test' }]],
      };
      console.log('ðŸ”§ sendMessage attached hardcoded debug inline keyboard');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('âŒ Telegram API error:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
    } else {
      console.log('âœ… Message sent successfully!');
    }
  } catch (err) {
    console.error('âŒ sendMessage exception:', err);
  }
}

async function getUpdates() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;
    console.log(`ðŸ“¡ Fetching updates with offset ${offset}...`);
    const res = await fetch(url);
    const data: any = await res.json();

    if (data.ok && data.result) {
      console.log(`ðŸ“¦ Received ${data.result.length} updates`);
      for (const update of data.result) {
        // ---- Ù¾Ø±Ø¯Ø§Ø²Ø´ Ù¾ÛŒØ§Ù… Ù…ØªÙ†ÛŒ ----
        if (update.message && update.message.text) {
          console.log('ðŸ“¨ Message received:', update.message.text);
          const ctx = {
            from: update.message.from,
            message: update.message,
            chat: update.message.chat,
            reply: async (text: string, keyboard?: any) => {
              console.log('ðŸ” ctx.reply (message update)', {
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
            console.error('âŒ handleMessage error:', err);
            await sendMessage(update.message.chat.id, 'âš ï¸ An error occurred.');
          }
        }

        // ---- Ù¾Ø±Ø¯Ø§Ø²Ø´ Ú©Ù„ÛŒÚ© Ø±ÙˆÛŒ Ø¯Ú©Ù…Ù‡â€ŒÙ‡Ø§ (callback_query) ----
        if (update.callback_query) {
          const cb = update.callback_query;
          const rawCbData = cb.data ?? '';
          const normalizedCbData = (typeof rawCbData === 'string' ? rawCbData.replace(/^\uFEFF/, '').trim() : rawCbData);
          console.log('ðŸ”˜ Callback query received:', cb.data);
          console.log('ðŸ” Callback data raw (json):', JSON.stringify(rawCbData));
          console.log('ðŸ” Callback data normalized (json):', JSON.stringify(normalizedCbData));
          console.log('ðŸ”Ž startsWith checks:', {
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
              console.log('ðŸ” ctx.reply (callback query)', {
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
                console.error('âŒ answerCbQuery error:', err);
              }
            },
          } as any;

          if (cb.data && cb.data.startsWith('captcha:')) {
            try {
              await handleCaptchaAnswer(ctx);
            } catch (err) {
              console.error('âŒ handleCaptchaAnswer error:', err);
            }
          } else {
            console.log('âš ï¸ Unknown callback data:', cb.data);
          }
        }

        offset = update.update_id + 1;
        console.log(`ðŸ”„ Offset updated to ${offset}`);
      }
    } else {
      if (data?.error_code === 409) {
        console.error('âŒ Telegram rejected getUpdates because another bot instance is already running.');
        stopPolling();
        releaseLock();
        process.exit(1);
      }
      console.log('âš ï¸ No updates or API error:', data);
    }
  } catch (err) {
    console.error('âŒ getUpdates error:', err);
  } finally {
    isProcessing = false;
  }
}

async function main() {
  console.log('ðŸ¤– Starting CipherX with getUpdates...');
  releaseLock = acquireSingleInstanceLock();
  await initDb();
  console.log('âœ… Database ready');

  // ---- Ø´Ø±ÙˆØ¹ Ø³Ø±ÙˆØ± Express Ø¨Ø±Ø§ÛŒ APIÙ‡Ø§ÛŒ Xman ----
  const app = express();
  const API_PORT = process.env.API_PORT || 3001;

  const allowedOrigins = [
    'https://cipherx-bot.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.use(cors({
    origin: (origin: any, callback: any) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, '');

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(`Blocked CORS origin: ${origin}`);
      return callback(null, false);
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning',
    ],

    optionsSuccessStatus: 204,
  }));

  app.use(express.json());

  // Ù…Ø³ÛŒØ±Ù‡Ø§ÛŒ API Xman
  app.use(xmanChatRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.listen(API_PORT, () => {
    console.log(`ðŸŒ Xman API server running on http://localhost:${API_PORT}`);
    console.log(`ðŸ“¡ Health check: http://localhost:${API_PORT}/health`);
  });

  // ---- Ø´Ø±ÙˆØ¹ Polling Ø±Ø¨Ø§Øª ØªÙ„Ú¯Ø±Ø§Ù… ----
  pollingTimer = setInterval(() => {
    void getUpdates();
  }, 2000);
  console.log('ðŸ”„ Listening for messages...');

  process.once('SIGINT', () => {
    console.log('ðŸ‘‹ Shutting down...');
    stopPolling();
    releaseLock();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    console.log('ðŸ‘‹ Shutting down...');
    stopPolling();
    releaseLock();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('âŒ Fatal error:', err);
  process.exit(1);
});
