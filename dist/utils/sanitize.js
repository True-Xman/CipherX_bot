"use strict";
/**
 * Sanitization layer between raw Telegram user input and the Gemini API.
 * Goals:
 *  1. Strip control characters / null bytes that could break downstream processing.
 *  2. Enforce a hard length cap to control cost and avoid abuse.
 *  3. Neutralize common prompt-injection patterns (e.g. "ignore previous instructions").
 *  4. Collapse excessive whitespace/repeated characters used for flooding.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUserInput = sanitizeUserInput;
exports.isBlank = isBlank;
const MAX_INPUT_LENGTH = 2000;
// Patterns commonly used to try to override a system prompt.
// We don't reject the message outright (that would be a poor UX for false positives);
// instead we strip/neutralize the phrase and log it for monitoring.
const INJECTION_PATTERNS = [
    /ignore (all|any|previous|above) instructions?/gi,
    /disregard (all|any|previous|above) instructions?/gi,
    /you are now (a|an)\s+\w+/gi,
    /system prompt/gi,
    /act as (if you (are|were)|a)\s+/gi,
    /reveal (your|the) (system|hidden) prompt/gi,
];
function sanitizeUserInput(raw) {
    let clean = raw ?? '';
    let wasModified = false;
    let flaggedInjection = false;
    // 1. Remove null bytes and non-printable control characters (keep newlines/tabs)
    const beforeControlStrip = clean;
    clean = clean.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
    if (clean !== beforeControlStrip)
        wasModified = true;
    // 2. Trim and collapse excessive whitespace/repeated chars (basic flood protection)
    const beforeCollapse = clean;
    clean = clean.replace(/\s{3,}/g, '  ').replace(/(.)\1{20,}/g, '$1'.repeat(5));
    if (clean !== beforeCollapse)
        wasModified = true;
    clean = clean.trim();
    // 3. Enforce max length
    if (clean.length > MAX_INPUT_LENGTH) {
        clean = clean.slice(0, MAX_INPUT_LENGTH);
        wasModified = true;
    }
    // 4. Detect & neutralize prompt injection attempts
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(clean)) {
            flaggedInjection = true;
            clean = clean.replace(pattern, '[filtered]');
            wasModified = true;
        }
    }
    return { clean, wasModified, flaggedInjection };
}
/** Quick check used before hitting the DB / API for obviously empty input. */
function isBlank(text) {
    return !text || text.trim().length === 0;
}
//# sourceMappingURL=sanitize.js.map