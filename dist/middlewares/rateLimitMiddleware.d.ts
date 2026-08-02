import { BotContext } from '../types/context';
/**
 * Applies rate limiting only to verified users sending free-text messages
 * (i.e. messages that would trigger a Gemini API call). Captcha button
 * presses and language selection are NOT rate-limited here, since they're
 * bounded by the captcha flow itself (max attempts + expiry).
 */
export declare function rateLimitMiddleware(ctx: BotContext, next: () => Promise<void>): Promise<void>;
//# sourceMappingURL=rateLimitMiddleware.d.ts.map