"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initDb = initDb;
exports.getUser = getUser;
exports.createUser = createUser;
exports.getOrCreateUser = getOrCreateUser;
exports.updateUserState = updateUserState;
exports.setUserLanguage = setUserLanguage;
exports.setUserVerified = setUserVerified;
exports.incrementFailedAttempts = incrementFailedAttempts;
exports.resetFailedAttempts = resetFailedAttempts;
exports.banUser = banUser;
exports.liftBan = liftBan;
exports.isBanActive = isBanActive;
exports.setWalletAddress = setWalletAddress;
exports.getCurrentStage = getCurrentStage;
exports.updateCurrentStage = updateCurrentStage;
exports.addUserXp = addUserXp;
exports.updateUserLearningStep = updateUserLearningStep;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config/config");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
// Ensure the directory for the DB file exists (e.g. ./data/bot.db)
const dbDir = path_1.default.dirname(config_1.config.db.path);
if (!fs_1.default.existsSync(dbDir)) {
    fs_1.default.mkdirSync(dbDir, { recursive: true });
}
// Verbose mode helps with debugging SQL errors during development.
const sqlite = sqlite3_1.default.verbose();
exports.db = new sqlite.Database(config_1.config.db.path, (err) => {
    if (err) {
        logger_1.logger.error('Failed to open SQLite database', { error: err.message });
        throw err;
    }
    logger_1.logger.info('SQLite database connected', { path: config_1.config.db.path });
});
/**
 * Initialize schema. Safe to call on every startup (IF NOT EXISTS).
 * Now safely adds columns only if they don't exist using PRAGMA table_info.
 */
function initDb() {
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
        exports.db.exec(schema, (err) => {
            if (err) {
                logger_1.logger.error('Failed to initialize schema', { error: err.message });
                return reject(err);
            }
            logger_1.logger.info('Database schema ready');
            // بررسی ستون‌های موجود با استفاده از PRAGMA table_info
            exports.db.all(`PRAGMA table_info('users')`, (err, columns) => {
                if (err) {
                    logger_1.logger.error('Failed to get table info', { error: err.message });
                    return reject(err);
                }
                const columnNames = columns.map(col => col.name);
                const alterQueries = [];
                if (!columnNames.includes('xp')) {
                    alterQueries.push(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`);
                }
                if (!columnNames.includes('learning_step')) {
                    alterQueries.push(`ALTER TABLE users ADD COLUMN learning_step TEXT DEFAULT 'start'`);
                }
                if (alterQueries.length === 0) {
                    logger_1.logger.info('No new columns to add');
                    return resolve();
                }
                // اجرای دستورات ALTER TABLE به صورت سری
                let completed = 0;
                alterQueries.forEach((query) => {
                    exports.db.run(query, (err) => {
                        if (err) {
                            logger_1.logger.warn('Failed to add column (might already exist)', { query, error: err.message });
                        }
                        completed++;
                        if (completed === alterQueries.length) {
                            logger_1.logger.info('All columns added successfully');
                            resolve();
                        }
                    });
                });
            });
        });
    });
}
/** Fetch a user by telegram_id, or null if not found. */
function getUser(telegramId) {
    return new Promise((resolve, reject) => {
        exports.db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
            if (err)
                return reject(err);
            resolve(row || null);
        });
    });
}
/** Create a new user row with defaults (UNVERIFIED, not verified). */
function createUser(telegramId, username) {
    const now = Date.now();
    return new Promise((resolve, reject) => {
        exports.db.run(`INSERT INTO users (telegram_id, username, language, is_verified, state, failed_attempts, banned_until, wallet_address, current_stage, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, 0, NULL, NULL, 1, ?, ?)`, [telegramId, username, config_1.config.defaultLanguage, types_1.UserState.UNVERIFIED, now, now], function (err) {
            if (err)
                return reject(err);
            getUser(telegramId).then((u) => resolve(u)).catch(reject);
        });
    });
}
/** Fetch existing user or create one if it doesn't exist yet. */
async function getOrCreateUser(telegramId, username) {
    const existing = await getUser(telegramId);
    if (existing)
        return existing;
    return createUser(telegramId, username);
}
function updateUserState(telegramId, state) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET state = ?, updated_at = ? WHERE telegram_id = ?', [state, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
function setUserLanguage(telegramId, language) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET language = ?, updated_at = ? WHERE telegram_id = ?', [language, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
function setUserVerified(telegramId, verified) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET is_verified = ?, updated_at = ? WHERE telegram_id = ?', [verified ? 1 : 0, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
function incrementFailedAttempts(telegramId) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET failed_attempts = failed_attempts + 1, updated_at = ? WHERE telegram_id = ?', [Date.now(), telegramId], function (err) {
            if (err)
                return reject(err);
            getUser(telegramId).then((u) => resolve(u?.failed_attempts ?? 0)).catch(reject);
        });
    });
}
function resetFailedAttempts(telegramId) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET failed_attempts = 0, updated_at = ? WHERE telegram_id = ?', [Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
/** Ban a user until now + banDurationMs, and flip state to BANNED. */
function banUser(telegramId, banDurationMs) {
    const bannedUntil = Date.now() + banDurationMs;
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET state = ?, banned_until = ?, failed_attempts = 0, updated_at = ? WHERE telegram_id = ?', [types_1.UserState.BANNED, bannedUntil, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
/** Lift a ban and reset the user back to UNVERIFIED so they must pass captcha again. */
function liftBan(telegramId) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET state = ?, banned_until = NULL, failed_attempts = 0, updated_at = ? WHERE telegram_id = ?', [types_1.UserState.UNVERIFIED, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
/** Returns true if the user is currently under an active ban. */
function isBanActive(user) {
    return user.state === types_1.UserState.BANNED && !!user.banned_until && user.banned_until > Date.now();
}
function setWalletAddress(telegramId, walletAddress) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET wallet_address = ?, updated_at = ? WHERE telegram_id = ?', [walletAddress, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
// ============================================================
// توابع مربوط به current_stage برای Xman
// ============================================================
function getCurrentStage(telegramId) {
    return new Promise((resolve, reject) => {
        exports.db.get('SELECT current_stage FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
            if (err)
                return reject(err);
            resolve(row?.current_stage || 1);
        });
    });
}
function updateCurrentStage(telegramId, stage) {
    return new Promise((resolve, reject) => {
        exports.db.run('UPDATE users SET current_stage = ?, updated_at = ? WHERE telegram_id = ?', [stage, Date.now(), telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
// ============================================================
// توابع مربوط به سیستم امتیازدهی (XP) و مراحل یادگیری
// ============================================================
function addUserXp(telegramId, xpAmount) {
    return new Promise((resolve, reject) => {
        exports.db.run(`UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE telegram_id = ?`, [xpAmount, telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
function updateUserLearningStep(telegramId, step) {
    const stepStr = String(step);
    return new Promise((resolve, reject) => {
        exports.db.run(`UPDATE users SET learning_step = ? WHERE telegram_id = ?`, [stepStr, telegramId], (err) => (err ? reject(err) : resolve()));
    });
}
//# sourceMappingURL=db.js.map