import crypto from 'crypto';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  user?: TelegramUser;
  authDate?: number;
}

/**
 * Validates Telegram Mini App raw initData using Telegram's official HMAC-SHA256 signature verification.
 *
 * @param initData Raw query string from Telegram WebApp (e.g., "user=...&auth_date=...&hash=...")
 * @param botToken Telegram Bot Token
 * @param maxAgeSeconds Maximum age of auth_date in seconds (default 86400 = 24 hours). Pass 0 to disable freshness check.
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number = 86400
): ValidationResult {
  if (!initData || typeof initData !== 'string' || initData.trim() === '') {
    return { isValid: false, error: 'Missing initData' };
  }

  if (!botToken || typeof botToken !== 'string' || botToken.trim() === '') {
    return { isValid: false, error: 'Missing bot token' };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return { isValid: false, error: 'Missing hash in initData' };
    }

    // Filter out 'hash' and sort remaining keys alphabetically
    const dataCheckArr: string[] = [];
    const keys: string[] = [];

    params.forEach((_, key) => {
      if (key !== 'hash') {
        keys.push(key);
      }
    });

    // Remove duplicates if any, sort lexicographically
    const uniqueKeys = Array.from(new Set(keys)).sort();

    for (const key of uniqueKeys) {
      const val = params.get(key);
      if (val !== null) {
        dataCheckArr.push(`${key}=${val}`);
      }
    }

    const dataCheckString = dataCheckArr.join('\n');

    // Secret key derivation: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculated hash: HMAC-SHA256(secretKey, dataCheckString)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Timing safe comparison
    const calculatedHashBuf = Buffer.from(calculatedHash, 'hex');
    const receivedHashBuf = Buffer.from(hash, 'hex');

    if (
      calculatedHashBuf.length !== receivedHashBuf.length ||
      !crypto.timingSafeEqual(calculatedHashBuf, receivedHashBuf)
    ) {
      return { isValid: false, error: 'Invalid signature' };
    }

    // Extract auth_date & validate freshness
    const authDateStr = params.get('auth_date');
    if (!authDateStr) {
      return { isValid: false, error: 'Missing auth_date' };
    }

    const authDate = parseInt(authDateStr, 10);
    if (isNaN(authDate)) {
      return { isValid: false, error: 'Malformed auth_date' };
    }

    if (maxAgeSeconds > 0) {
      const now = Math.floor(Date.now() / 1000);
      if (now - authDate > maxAgeSeconds) {
        return { isValid: false, error: 'Stale auth_date' };
      }
      if (authDate > now + 300) {
        return { isValid: false, error: 'Future auth_date' };
      }
    }

    // Extract and parse user data
    const userStr = params.get('user');
    if (!userStr) {
      return { isValid: false, error: 'Missing user data in initData' };
    }

    let user: TelegramUser;
    try {
      user = JSON.parse(userStr);
    } catch {
      return { isValid: false, error: 'Malformed user JSON in initData' };
    }

    if (!user || typeof user.id !== 'number' || isNaN(user.id)) {
      return { isValid: false, error: 'Invalid or missing user ID in initData' };
    }

    return {
      isValid: true,
      user,
      authDate,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to validate initData: ${err?.message || 'Unknown error'}`,
    };
  }
}
