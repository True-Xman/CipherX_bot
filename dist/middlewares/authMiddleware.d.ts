import { BotContext } from '../types/context';
/**
 * Runs on every update. Responsibilities:
 * 1. Load (or create) the user record and attach it to ctx.dbUser.
 * 2. If the user is banned and the ban hasn't expired, block them silently
 *    (with a message telling them how long is left) — this is what enforces
 *    "CAPTCHA first" security: nothing downstream (including Gemini) runs
 *    for a banned/unverified user except the captcha flow itself.
 * 3. If a ban HAS expired, lift it automatically and let them retry captcha.
 */
export declare function authMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map