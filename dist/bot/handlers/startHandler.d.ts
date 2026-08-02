import { BotContext } from '../../types/context';
/**
 * Entry point for /start. Resumes the user wherever they left off instead
 * of always resetting — this avoids letting a user "escape" verification
 * by just re-running /start repeatedly.
 */
export declare function handleStart(ctx: BotContext): Promise<void>;
//# sourceMappingURL=startHandler.d.ts.map