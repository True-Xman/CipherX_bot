# TASKS.md - CipherX Task Control & Task Board

## 1. Current Task Board

| Task ID | Title | Status | Assigned Scope | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| **CONTROL-001** | Establish Project Control System | `COMPLETED` | Create `PROJECT.md`, `TASKS.md`, `DECISIONS.md`. No source code modifications. | Closed. Activate IDENTITY-001 in a dedicated new task chat. |
| **IDENTITY-001** | Telegram Identity Trust | `NEXT` | Implement backend server-side Telegram `initData` signature validation. | Await owner activation in dedicated task chat. |
| **SECURITY-001** | Broad Security Audit | `DEFERRED` | Comprehensive project security review. | Deferred by `OWNER DECISION`. Do not start automatically. |

---

## 2. Task Lifecycle

1. **`PLANNED`**: Queued task defining future work.
2. **`NEXT`**: High-priority task staged for immediate execution in a new task chat.
3. **`ACTIVE`**: Currently being executed in an isolated task context.
4. **`IN VERIFICATION`**: Changes complete, undergoing build/test execution.
5. **`COMPLETED`**: Verified task with an approved Return Packet.
6. **`DEFERRED`**: Intentionally paused or delayed by `OWNER DECISION`.

---

## 3. TASK PACKET Template

Future task assignments must follow this format:

```markdown
CIPHERX TASK PACKET
TASK-ID: [TASK-ID]
TASK: [Short Description]

==================================================
STARTING STATE
==================================================
Baseline Commit: [e.g. d7db060 Baseline-001]
Verified Pre-conditions:
- [Pre-condition 1]

==================================================
GOAL
==================================================
[Detailed goal statement]

==================================================
SCOPE & BOUNDARIES
==================================================
Allowed Changes:
- [Allowed change 1]

Explicit Non-Goals:
- [Non-goal 1]

==================================================
HUMAN GATES
==================================================
- [Gate 1]

==================================================
REQUIRED VERIFICATION
==================================================
- [Verification command 1]
```

---

## 4. RETURN PACKET Template

All completing tasks must output a Return Packet before ending:

```markdown
CIPHERX RETURN PACKET
TASK-ID: [TASK-ID]

STATUS: [SUCCESS / FAILED / DEFERRED]

CREATED / MODIFIED FILES:
- [file 1]

VERIFIED FINDINGS:
- [Finding 1 with evidence label]

COMMANDS / TESTS EXECUTED:
- [Command 1 and exact result]

UNVERIFIED ITEMS:
- [Unverified item 1]

UNEXPECTED FINDINGS:
- [Unexpected finding or none]

REMAINING RISKS:
- [Risk 1]

SOURCE CODE MUTATED:
- [YES / NO]

GIT STATUS:
- [Output of git status summary]

RECOMMENDED NEXT ACTION:
- [Single safest next step]
```

---

## 5. Rules for Task Isolation

1. **Context Boundary**: Each task must run within its own isolated context or dedicated session.
2. **Single Assignment**: An agent must work ONLY on the assigned Task ID.
3. **No Scope Creep**: Agents must never silently expand scope or perform unrequested edits.
4. **No Milestone Reopening**: Completed or deferred milestones must remain untouched unless explicit owner instruction with evidence is provided.
5. **Source Code Protection**: Application source code (`src/`, `frontend/src/`) must not be touched unless explicitly authorised in the Task Packet.

---

## 6. Rules for Separate Task/Chat Contexts

A separate, clean task context or chat MUST be created when:

1. Starting work on a new `NEXT` or `PLANNED` Task ID (e.g. moving from `CONTROL-001` to `IDENTITY-001`).
2. The current task reaches completion or deferral.
3. A task requires substantial independent design, refactoring, or investigation.
4. Context window accumulation threatens context clarity or risks monolithic-agent behavior.
