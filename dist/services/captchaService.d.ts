import { CaptchaChallenge } from '../types';
/** Create (or replace) a captcha challenge for a user. */
export declare function createChallenge(telegramId: number): CaptchaChallenge;
export declare function getChallenge(telegramId: number): CaptchaChallenge | undefined;
export declare function clearChallenge(telegramId: number): void;
export declare function isExpired(challenge: CaptchaChallenge): boolean;
/**
 * Build inline keyboard answer options: the correct answer plus 3 plausible
 * distractors, shuffled. Using buttons (rather than free-text input) avoids
 * ambiguity in parsing across 5 languages/number formats.
 */
export declare function buildAnswerOptions(correctAnswer: number): number[];
/** Increment attempts counter for a challenge; returns updated count. */
export declare function incrementAttempt(telegramId: number): number;
//# sourceMappingURL=captchaService.d.ts.map