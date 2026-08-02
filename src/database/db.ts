import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import { UserRecord, UserState } from '../types';
import { SupportedLanguage } from '../config/config';
import { logger } from '../utils/logger';

// Ensure the directory for the DB file exists (e.g. ./data/bot.db)
const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Verbose mode helps with debugging SQL errors during development.
const sqlite = sqlite3.verbose();
export const db = new sqlite.Database(config.db.path, (err) => {
  if (err) {
    logger.error('Failed to open SQLite database', { error: err.message });
    throw err;
  }
  logger.info('SQLite database connected', { path: config.db.path });
});

/**
 * Initialize schema. Safe to call on every startup (IF NOT EXISTS).
 * Now safely adds columns only if they don't exist using PRAGMA table_info.
 */
export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        telegram_id     INTEGER PRIMARY KEY,
        username        TEXT,
        language        TEXT NOT NULL DEFAULT 'en',
        is_verified     INTEGER NOT NULL DEFAULT 0,
        state           TEXT NOT NULL DEFAULT 'UNVERIFIED',
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        banned_until    INTEGER,
        wallet_address  TEXT,
        current_stage   INTEGER DEFAULT 1,
        created_at      INTEGER NOT NULL,
        updated_at      INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
    `;
    db.exec(schema, (err) => {
      if (err) {
        logger.error('Failed to initialize schema', { error: err.message });
        return reject(err);
      }
      logger.info('Database schema ready');

      // بررسی ستون‌های موجود با استفاده از PRAGMA table_info
      db.all(`PRAGMA table_info('users')`, (err, columns: Array<{ name: string }>) => {
        if (err) {
          logger.error('Failed to get table info', { error: err.message });
          return reject(err);
        }

        const columnNames = columns.map(col => col.name);
        const alterQueries: string[] = [];

        if (!columnNames.includes('xp')) {
          alterQueries.push(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`);
        }
        if (!columnNames.includes('learning_step')) {
          alterQueries.push(`ALTER TABLE users ADD COLUMN learning_step TEXT DEFAULT 'start'`);
        }

        if (alterQueries.length === 0) {
          logger.info('No new columns to add');
          return resolve();
        }

        // اجرای دستورات ALTER TABLE به صورت سری
        let completed = 0;
        alterQueries.forEach((query) => {
          db.run(query, (err) => {
            if (err) {
              logger.warn('Failed to add column (might already exist)', { query, error: err.message });
            }
            completed++;
            if (completed === alterQueries.length) {
              logger.info('All columns added successfully');
              resolve();
            }
          });
        });
      });
    });
  });
}

/** Fetch a user by telegram_id, or null if not found. */
export function getUser(telegramId: number): Promise<UserRecord | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row: UserRecord) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

/** Create a new user row with defaults (UNVERIFIED, not verified). */
export function createUser(telegramId: number, username: string | null): Promise<UserRecord> {
  const now = Date.now();
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (telegram_id, username, language, is_verified, state, failed_attempts, banned_until, wallet_address, current_stage, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, 0, NULL, NULL, 1, ?, ?)`,
      [telegramId, username, config.defaultLanguage, UserState.UNVERIFIED, now, now],
      function (err) {
        if (err) return reject(err);
        getUser(telegramId).then((u) => resolve(u as UserRecord)).catch(reject);
      }
    );
  });
}

/** Fetch existing user or create one if it doesn't exist yet. */
export async function getOrCreateUser(telegramId: number, username: string | null): Promise<UserRecord> {
  const existing = await getUser(telegramId);
  if (existing) return existing;
  return createUser(telegramId, username);
}

export function updateUserState(telegramId: number, state: UserState): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET state = ?, updated_at = ? WHERE telegram_id = ?',
      [state, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function setUserLanguage(telegramId: number, language: SupportedLanguage): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET language = ?, updated_at = ? WHERE telegram_id = ?',
      [language, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function setUserVerified(telegramId: number, verified: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET is_verified = ?, updated_at = ? WHERE telegram_id = ?',
      [verified ? 1 : 0, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function incrementFailedAttempts(telegramId: number): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET failed_attempts = failed_attempts + 1, updated_at = ? WHERE telegram_id = ?',
      [Date.now(), telegramId],
      function (err) {
        if (err) return reject(err);
        getUser(telegramId).then((u) => resolve(u?.failed_attempts ?? 0)).catch(reject);
      }
    );
  });
}

export function resetFailedAttempts(telegramId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET failed_attempts = 0, updated_at = ? WHERE telegram_id = ?',
      [Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

/** Ban a user until now + banDurationMs, and flip state to BANNED. */
export function banUser(telegramId: number, banDurationMs: number): Promise<void> {
  const bannedUntil = Date.now() + banDurationMs;
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET state = ?, banned_until = ?, failed_attempts = 0, updated_at = ? WHERE telegram_id = ?',
      [UserState.BANNED, bannedUntil, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

/** Lift a ban and reset the user back to UNVERIFIED so they must pass captcha again. */
export function liftBan(telegramId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET state = ?, banned_until = NULL, failed_attempts = 0, updated_at = ? WHERE telegram_id = ?',
      [UserState.UNVERIFIED, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

/** Returns true if the user is currently under an active ban. */
export function isBanActive(user: UserRecord): boolean {
  return user.state === UserState.BANNED && !!user.banned_until && user.banned_until > Date.now();
}

export function setWalletAddress(telegramId: number, walletAddress: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET wallet_address = ?, updated_at = ? WHERE telegram_id = ?',
      [walletAddress, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// ============================================================
// توابع مربوط به current_stage برای Xman
// ============================================================

export function getCurrentStage(telegramId: string | number): Promise<number> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT current_stage FROM users WHERE telegram_id = ?',
      [telegramId],
      (err, row: { current_stage: number } | undefined) => {
        if (err) return reject(err);
        resolve(row?.current_stage || 1);
      }
    );
  });
}

export function updateCurrentStage(telegramId: string | number, stage: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET current_stage = ?, updated_at = ? WHERE telegram_id = ?',
      [stage, Date.now(), telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// ============================================================
// توابع مربوط به سیستم امتیازدهی (XP) و مراحل یادگیری
// ============================================================

export function addUserXp(telegramId: number, xpAmount: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE telegram_id = ?`,
      [xpAmount, telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function updateUserLearningStep(telegramId: number, step: string | number): Promise<void> {
  const stepStr = String(step);
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET learning_step = ? WHERE telegram_id = ?`,
      [stepStr, telegramId],
      (err) => (err ? reject(err) : resolve())
    );
  });
}