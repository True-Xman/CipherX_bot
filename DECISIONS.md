# DECISIONS.md - CipherX Decision Log

This log records authoritative project decisions approved by the project owner. Unverified ideas, proposals, and chat assumptions are NOT recorded as decisions.

---

## DECISION-001: Repository-Controlled Project Memory System

* **Date**: 2026-08-16
* **Status**: `APPROVED`
* **Context**: Chat context is ephemeral, lossy, and prone to drift across multiple AI agent sessions.
* **Decision**: Maintain project state, task management, and design rules strictly within repository files (`PROJECT.md`, `TASKS.md`, `DECISIONS.md`). Agents must read these control files before commencing substantial work.

---

## DECISION-002: Strict Evidence Standard ("No Evidence = No Project Fact")

* **Date**: 2026-08-16
* **Status**: `APPROVED`
* **Context**: Previous discussions led to unverified claims and conflicting numbers regarding build outputs and functional testing.
* **Decision**: Require explicit evidence tagging (`VERIFIED [CODE]`, `VERIFIED [GIT]`, `VERIFIED [TEST]`, `VERIFIED [OWNER-E2E]`, `ASSUMED`, `OWNER DECISION`, `PLANNED`). Unverified statements must never be reported as project facts.

---

## DECISION-003: Task Isolation and Context Partitioning

* **Date**: 2026-08-16
* **Status**: `APPROVED`
* **Context**: Monolithic agent sessions attempting multiple independent tasks accumulate context pollution and introduce unauthorized scope expansion.
* **Decision**: Execute work in isolated task sessions bound to a single Task ID. Each major task requires a clean session and must yield a structured Return Packet upon completion.

---

## DECISION-004: Deferral of Broad Security Audit

* **Date**: 2026-08-16
* **Status**: `APPROVED` (`OWNER DECISION`)
* **Context**: Core functionality (Telegram Identity Trust) must take precedence before comprehensive auditing.
* **Decision**: Defer `SECURITY-001` (Broad Security Audit) until explicitly activated by the project owner. Agents must not initiate security auditing automatically.

---

## DECISION-005: Mandatory Human Approval Gates

* **Date**: 2026-08-16
* **Status**: `APPROVED`
* **Context**: Automated execution must not risk data loss, broken baselines, or unauthorized remote modifications.
* **Decision**: Human approval is strictly required prior to:
  1. Pushing commits or merging git branches.
  2. Production deployment or live environment configuration changes.
  3. Destructive database operations (table drops, data wipes).
  4. Intentional security threshold bypasses.

---

## Status of Proposed Infrastructure & Architectural Ideas

The following infrastructure items have been proposed or discussed but are **NOT** approved decisions or permanent architectural commitments. They remain listed as unverified proposals (`PLANNED` / `ASSUMED`) until explicitly decided by the owner:

* **Database Migration**: Turso, Supabase (Current verified implementation uses local SQLite at `data/bot.db`. No database migration has been approved).
* **Hosting Migration**: Render, Vercel (Current verified development backend uses local Express; frontend deployment target is Netlify. No cloud backend hosting migration has been approved).
* **Tooling / Integrations**: Model Context Protocol (MCP) integrations, Jules workflow automation tools.
