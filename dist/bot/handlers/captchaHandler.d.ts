import { BotContext } from '../../types/context';
/** Send a fresh math captcha with inline keyboard buttons to the user. */
export declare function sendCaptcha(ctx: BotContext): Promise<void>;
/** Handles a button press on the captcha keyboard (callback_query). */
export declare function handleCaptchaAnswer(ctx: BotContext): Promise<void>;
//# sourceMappingURL=captchaHandler.d.ts.map