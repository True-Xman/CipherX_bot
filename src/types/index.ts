import { SupportedLanguage } from '../config/config';

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
  banned_until: number | null;
  current_stage: number; // new field added
  learning_step: number;
  xp_points: number;
  created_at: number;
  updated_at: number;
}

export interface CaptchaChallenge {
  telegram_id: number;
  question: string;
  answer: number;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface RateLimitEntry {
  count: number;
  windowStart: number;
}