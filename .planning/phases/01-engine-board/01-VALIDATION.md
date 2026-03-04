---
phase: 1
slug: engine-board
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vite.config.ts` (unified — Vitest reads Vite config) |
| **Quick run command** | `npx vitest run src/engine` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/engine`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | ENG-01 | unit | `npx vitest run src/engine/board.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | ENG-02 | unit | `npx vitest run src/engine/state.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | ENG-03, ENG-04 | unit | `npx vitest run src/engine/moves.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | ENG-05 | unit | `npx vitest run src/engine/moves.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | ENG-06 | unit | `npx vitest run src/engine/rules.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | ENG-07, ENG-08 | unit | `npx vitest run src/engine/rules.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-07 | 01 | 1 | ENG-09, ENG-10 | unit | `npx vitest run src/engine/history.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-08 | 01 | 1 | ENG-11 | unit | `npx vitest run src/engine/history.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-09 | 01 | 1 | ENG-12 | lint | `npx eslint src/engine` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | BRD-01, BRD-02 | smoke | `npx vitest run src/components/Board/Board.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | BRD-03, BRD-04 | unit | `npx vitest run src/hooks/useGame.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | BRD-05, BRD-06, BRD-07, BRD-08 | smoke | `npx vitest run src/components/GameScreen/GameScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-04 | 02 | 2 | BRD-09 | smoke | `npx vitest run src/components/Board/Board.test.tsx` | ❌ W0 | ⬜ pending |
| 01-02-05 | 02 | 2 | BRD-10 | unit | `npx vitest run src/components/Board/BoardNode.test.tsx` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | ENG-13 | unit | `npx vitest run src/engine` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/board.test.ts` — stubs for ENG-01 (topology, coordinates, jump paths)
- [ ] `src/engine/state.test.ts` — stubs for ENG-02 (initial state)
- [ ] `src/engine/moves.test.ts` — stubs for ENG-03, ENG-04, ENG-05, ENG-06
- [ ] `src/engine/rules.test.ts` — stubs for ENG-07, ENG-08
- [ ] `src/engine/history.test.ts` — stubs for ENG-09, ENG-10, ENG-11
- [ ] `src/hooks/useGame.test.ts` — stubs for BRD-03, BRD-04
- [ ] `src/components/Board/Board.test.tsx` — stubs for BRD-01, BRD-02, BRD-09
- [ ] `src/components/Board/BoardNode.test.tsx` — stubs for BRD-10
- [ ] `src/components/GameScreen/GameScreen.test.tsx` — stubs for BRD-05–08
- [ ] Project scaffold (`package.json`, `vite.config.ts`, `tsconfig.json`) — Wave 0 prerequisite
- [ ] Framework install: `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG board looks correct visually | BRD-01, BRD-02 | Visual layout correctness | Open app, verify 23 nodes at correct positions with triangle-over-grid layout |
| Touch targets feel right on mobile | BRD-10 | Device-specific haptics | Test on actual mobile device, verify all nodes tappable without mis-taps |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
