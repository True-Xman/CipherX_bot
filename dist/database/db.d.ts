import sqlite3 from 'sqlite3';
import { UserRecord, UserState } from '../types';
import { SupportedLanguage } from '../config/config';
export declare const db: sqlite3.Database;
/**
 * Initialize schema. Safe to call on every startup (IF NOT EXISTS).
 * Now safely adds columns only if they don't exist using PRAGMA table_info.
 */
export declare function initDb(): Promise<void>;
/** Fetch a user by telegram_id, or null if not found. */
export declare function getUser(telegramId: number): Promise<UserRecord | null>;
/** Create a new user row with defaults (UNVERIFIED, not verified). */
export declare function createUser(telegramId: number, username: string | null): Promise<UserRecord>;
/** Fetch existing user or create one if it doesn't exist yet. */
export declare function getOrCreateUser(telegramId: number, username: string | null): Promise<UserRecord>;
export declare function updateUserState(telegramId: number, state: UserState): Promise<void>;
export declare function setUserLanguage(telegramId: number, language: SupportedLanguage): Promise<void>;
export declare function setUserVerified(telegramId: number, verified: boolean): Promise<void>;
export declare function incrementFailedAttempts(telegramId: number): Promise<number>;
export declare function resetFailedAttempts(telegramId: number): Promise<void>;
/** Ban a user until now + banDurationMs, and flip state to BANNED. */
export declare function banUser(telegramId: number, banDurationMs: number): Promise<void>;
/** Lift a ban and reset the user back to UNVERIFIED so they must pass captcha again. */
export declare function liftBan(telegramId: number): Promise<void>;
/** Returns true if the user is currently under an active ban. */
export declare function isBanActive(user: UserRecord): boolean;
export declare function setWalletAddress(telegramId: number, walletAddress: string): Promise<void>;
export declare function getCurrentStage(telegramId: string | number): Promise<number>;
export declare function updateCurrentStage(telegramId: string | number, stage: number): Promise<void>;
export declare function addUserXp(telegramId: number, xpAmount: number): Promise<void>;
export declare function updateUserLearningStep(telegramId: number, step: string | number): Promise<void>;
//# sourceMappingURL=db.d.ts.map