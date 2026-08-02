# AGENTS.md

## Project overview

This workspace contains CipherX, a TypeScript Telegram bot that uses Telegraf, SQLite, and Gemini/OpenRouter. The runtime is a polling-based bot with a strong security-first flow.

## Working conventions

- Prefer small, strongly typed TypeScript modules.
- Keep bot behavior organized around the existing handlers in [src/bot/handlers/messageHandler.ts](src/bot/handlers/messageHandler.ts), [src/bot/handlers/captchaHandler.ts](src/bot/handlers/captchaHandler.ts), and [src/bot/handlers/languageHandler.ts](src/bot/handlers/languageHandler.ts).
- Reuse the existing database helpers in [src/database/db.ts](src/database/db.ts) instead of introducing ad hoc state handling.
- Keep translations in [src/locales/index.ts](src/locales/index.ts) and the JSON files under [src/locales](src/locales).

## Development workflow

- Run the bot locally with `npm run dev`.
- Build with `npm run build`.
- The main entrypoint is [src/index.ts](src/index.ts).
- Configuration comes from [src/config/config.ts](src/config/config.ts) and environment variables such as `BOT_TOKEN` and `GEMINI_API_KEY`.

## Security and behavior rules

- CAPTCHA must be completed before any Gemini-backed answer is produced.
- Respect the user state machine defined in [src/types/index.ts](src/types/index.ts) and the middleware in [src/middlewares/authMiddleware.ts](src/middlewares/authMiddleware.ts) and [src/middlewares/rateLimitMiddleware.ts](src/middlewares/rateLimitMiddleware.ts).
- Preserve the current safeguards: roughly 5 messages per minute per user, a 60-second captcha timeout, and a 24-hour ban after repeated failures unless the existing config is intentionally changed.
- Do not bypass the auth/rate-limit flow when adding new features.

## When editing

- Keep changes minimal and aligned with the existing module boundaries.
- Prefer the shared logger in [src/utils/logger.ts](src/utils/logger.ts) over ad-hoc console logging for server-side behavior.
- Preserve the current i18n flow and use the existing translation helpers rather than hardcoding user-facing strings.
- There is no automated test script yet, so validate changes with `npm run build` and a manual smoke check when practical.

---

## 🔄 Autonomous Testing Loop

After any code change:

1. **Auto-build:** `npm run build` runs automatically (no approval needed).
2. **If build succeeds** → report success to the user.
3. **If build fails** → **stop**, analyze the error, suggest a fix, and **ask for permission** before applying any changes.
4. After fixing, repeat the loop until the build succeeds.

### Auto-Approve Commands

- `npm run build`
- `npx tsc --noEmit`

### Permission Required For

- Any change to `src/` files after a build failure.
- Any change affecting database schema or environment variables.

### Git Safety (optional)

- Before any auto-fix, create a commit with message `"WIP: before auto-fix"` (if Git is initialized).
