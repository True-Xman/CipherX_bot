import { Request, Response, NextFunction } from 'express';
import { validateTelegramInitData, TelegramUser } from '../utils/telegramAuth';
import { config } from '../config/config';

export interface AuthenticatedRequest extends Request {
  telegramUser?: TelegramUser;
}

export function requireTelegramAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const customHeader = req.headers['x-telegram-init-data'] || req.headers['x-telegram-initdata'];

  let initData = '';

  if (typeof customHeader === 'string' && customHeader.trim() !== '') {
    initData = customHeader.trim();
  } else if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      initData = authHeader.substring(7).trim();
    } else {
      initData = authHeader.trim();
    }
  }

  if (!initData) {
    return res.status(401).json({ success: false, error: 'Telegram initData is required' });
  }

  const botToken = config.telegram.botToken || process.env.BOT_TOKEN || '';
  if (!botToken) {
    console.error('BOT_TOKEN is not configured on the server');
    return res.status(500).json({ success: false, error: 'Server authentication configuration error' });
  }

  const result = validateTelegramInitData(initData, botToken);

  if (!result.isValid || !result.user) {
    return res.status(401).json({
      success: false,
      error: result.error || 'Invalid Telegram authentication',
    });
  }

  req.telegramUser = result.user;
  next();
}
