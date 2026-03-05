---
phase: 2
slug: ai-opponent
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | AI-01 | unit | `npx vitest run src/engine/ai/worker` | W0 | pending |
| 02-01-02 | 01 | 1 | AI-02 | unit | `npx vitest run src/engine/ai/evaluate` | W0 | pending |
| 02-02-01 | 02 | 1 | AI-03 | unit | `npx vitest run src/engine/ai/mcts` | W0 | pending |
| 02-02-02 | 02 | 1 | AI-04 | unit | `npx vitest run src/engine/ai/minimax` | W0 | pending |
| 02-02-03 | 02 | 1 | AI-05 | unit | `npx vitest run src/engine/ai/difficulty` | W0 | pending |
| 02-03-01 | 03 | 2 | AI-06, AI-07 | perf | `npx vitest run src/engine/ai/timing` | W0 | pending |
| 02-03-02 | 03 | 2 | AI-08 | unit | `npx vitest run src/components/SetupScreen` | W0 | pending |
| 02-03-03 | 03 | 2 | AI-09 | unit | `npx vitest run src/hooks/useAIGame` | W0 | pending |
| 02-03-04 | 03 | 2 | AI-10 | unit | `npx vitest run src/hooks/useAIGame` | W0 | pending |
| 02-03-05 | 03 | 2 | AI-11 | integration | `npx vitest run src/engine/ai/self-play` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/ai/__tests__/worker.test.ts` — stubs for AI-01
- [ ] `src/engine/ai/__tests__/evaluate.test.ts` — stubs for AI-02
- [ ] `src/engine/ai/__tests__/mcts.test.ts` — stubs for AI-03
- [ ] `src/engine/ai/__tests__/minimax.test.ts` — stubs for AI-04
- [ ] `src/engine/ai/__tests__/difficulty.test.ts` — stubs for AI-05
- [ ] `src/engine/ai/__tests__/timing.test.ts` — stubs for AI-06, AI-07
- [ ] `src/engine/ai/__tests__/self-play.test.ts` — stubs for AI-11

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UI stays responsive during AI move | AI-01 | Requires visual/interaction check | Start AI game, click around board while AI thinks — no jank |
| AI move feels natural (not instant) | AI-09 | Subjective UX timing | Observe 400ms+ delay before AI places/moves piece |
| Setup screen UX flow | AI-08 | Visual layout verification | Choose tiger/goat, select difficulty, start game |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
