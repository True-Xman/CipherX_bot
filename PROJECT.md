# PROJECT.md - CipherX Project Control

## 1. Project Purpose

CipherX is a TypeScript Telegram bot utilizing Telegraf, SQLite, and Gemini/OpenRouter APIs, paired with a web-based Mini App frontend. It features a security-first user flow requiring mandatory CAPTCHA completion prior to AI access, rate limiting, and structured user state transitions.

## 2. Current Verified Architecture

* **Frontend**: React/Vite Web App targeted for deployment on Netlify (`VERIFIED [CODE]`).
  * Build Verification (Point-in-Time at BASELINE-001 / commit `d7db060`): `npm run build` output transformed 156 modules in ~3.12 seconds (`VERIFIED [TEST]`).
* **Backend**: Express server running locally during development (`VERIFIED [CODE]`).
* **Database**: Current verified implementation uses local SQLite at `data/bot.db` (`VERIFIED [CODE]`).
  * Note: Infrastructure changes (e.g., Turso, Supabase) are proposals only and NOT part of current architecture (`OWNER DECISION`).

## 3. Current Milestone Matrix

| Milestone | Status | Evidence Basis | Notes |
| :--- | :--- | :--- | :--- |
| **CAPTCHA Persistence** | `COMPLETED` | `VERIFIED [CODE]`, `VERIFIED [GIT]`, `VERIFIED [OWNER-E2E]` | Source implementation and persistence fix included in BASELINE-001 (`d7db060`). Previously confirmed working end-to-end by owner. |
| **Mini App Connectivity** | `COMPLETED` | `VERIFIED [CODE]`, `VERIFIED [GIT]`, `VERIFIED [OWNER-E2E]` | CORS, ngrok, and Netlify configuration changes included in BASELINE-001 (`d7db060`). Previously confirmed working end-to-end by owner. |
| **Telegram Identity Trust** | `NEXT / NOT IMPLEMENTED` | `PLANNED` | Backend server-side Telegram `initData` signature validation is pending implementation (`IDENTITY-001`). |
| **Broad Security Audit** | `DEFERRED` | `OWNER DECISION` | Audit intentionally deferred by owner decision (`SECURITY-001`). Do not start automatically. |

## 4. Evidence Rules

All statements regarding project status, functionality, or performance must use one of the following authoritative labels:

* **`VERIFIED [CODE]`**: Directly proven by repository source files.
* **`VERIFIED [GIT]`**: Directly proven by Git history, status, or diffs.
* **`VERIFIED [TEST]`**: Directly proven by command or test execution during the current task session.
* **`VERIFIED [OWNER-E2E]`**: Previously confirmed by the project owner in the real application. Must never be invented or assumed by an AI agent.
* **`ASSUMED`**: Plausible condition or inference not yet backed by direct evidence.
* **`OWNER DECISION`**: Explicit product or architecture decision instructed by the project owner.
* **`PLANNED`**: Future scheduled work not yet active.

> **CORE RULE**: NO EVIDENCE = NO PROJECT FACT. Never convert `ASSUMED` or `PLANNED` items into `VERIFIED` status without executing concrete verification commands or verifying source repository artifacts.

## 5. Safety Boundaries

* **Approved Baseline**: `BASELINE-001` (Commit `d7db060`, branch `main`).
* **Git Baseline State**:
  * Working tree clean immediately following `BASELINE-001` (`VERIFIED [GIT]`).
  * Local `main` is 1 commit ahead of `origin/main` (`VERIFIED [GIT]`).
  * `BASELINE-001` has NOT been pushed to remote repository (`VERIFIED [GIT]`).
* **Secrets & Environment**:
  * `.env`, `.env.local`, `.env.*.local`, `frontend/.env` ignore behavior confirmed by Git (`VERIFIED [GIT]`).
  * Secrets must NEVER be committed or output in logs.
* **Database & Build Outputs Safety**:
  * `data/bot.db`, `data/bot.lock`, and `dist/` ignore behavior confirmed by Git (`VERIFIED [GIT]`). Local `data/bot.db` preserved.
  * Destructive database operations (e.g. table drop, data wipe) are strictly prohibited without human consent.
* **Point-in-Time Build Verification (BASELINE-001 / Commit d7db060)**:
  * Backend point-in-time check: `npx tsc --noEmit` passed cleanly at commit `d7db060` (`VERIFIED [TEST]`).
  * Frontend point-in-time check: `npm run build` passed cleanly with 156 modules transformed in ~3.12 seconds at commit `d7db060` (`VERIFIED [TEST]`).
  * Note: Test results represent point-in-time verifications tied to BASELINE-001 and are not permanent guarantees of future project state.

## 6. Human Approval Gates

Explicit human approval from the project owner is required prior to:

1. Pushing commits or merging pull requests affecting baseline or major features.
2. Deploying changes to production or altering production configuration.
3. Executing destructive database operations or schema migrations.
4. Implementing intentional security bypasses or modifying rate-limit / CAPTCHA security thresholds.
5. Initiating deferred tasks or changing milestone statuses (e.g., initiating Broad Security Audit).

## 7. Current Approved Baseline

* **Baseline ID**: `BASELINE-001`
* **Commit**: `d7db060b25b46100ad996bed23bbb1b1a60b6a5c` (`d7db060`)
* **Branch**: `main`
* **Status**: Local baseline verified, unpushed.
