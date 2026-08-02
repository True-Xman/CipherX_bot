/**
 * Sanitization layer between raw Telegram user input and the Gemini API.
 * Goals:
 *  1. Strip control characters / null bytes that could break downstream processing.
 *  2. Enforce a hard length cap to control cost and avoid abuse.
 *  3. Neutralize common prompt-injection patterns (e.g. "ignore previous instructions").
 *  4. Collapse excessive whitespace/repeated characters used for flooding.
 */
export interface SanitizeResult {
    clean: string;
    wasModified: boolean;
    flaggedInjection: boolean;
}
export declare function sanitizeUserInput(raw: string): SanitizeResult;
/** Quick check used before hitting the DB / API for obviously empty input. */
export declare function isBlank(text: string): boolean;
//# sourceMappingURL=sanitize.d.ts.map