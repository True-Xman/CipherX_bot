import { SupportedLanguage } from '../config/config';

/**
 * Finite state machine for user verification flow.
 * UNVERIFIED -> (captcha shown) -> IN_CAPTCHA -> SELECT_LANG -> READY
 * BANNED is a terminal state until ban expiry is reached.
 */
export enum UserState {
  UNVERIFIED = 'UNVERIFIED',
  IN_CAPTCHA = 'IN_CAPTCHA',
  SELECT_LANG = 'SELECT_LANG',
  READY = 'READY',
  BANNED = 'BANNED',
}

export interface UserRecord {
  telegram_id: number;
  username: string | null;
  language: SupportedLanguage;
  is_verified: 0 | 1;
  state: UserState;
  failed_attempts: number;
  banned_until: number | null; // unix ms timestamp, null if not banned
  learning_step: number;
  xp_points: number;
  created_at: number; // unix ms timestamp
  updated_at: number;
}

export interface CaptchaChallenge {
  telegram_id: number;
  question: string;
  answer: number;
  createdAt: number; // unix ms
  expiresAt: number; // unix ms
  attempts: number;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number; // unix ms
}
