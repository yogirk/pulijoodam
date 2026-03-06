---
phase: 3
slug: experience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-07
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | vite.config.ts (test section) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | POL-01 | unit | `npx vitest run src/components/Board/GoatPiece.test.tsx -t "transition"` | No -- Wave 0 | pending |
| 03-01-02 | 01 | 1 | POL-02 | unit | `npx vitest run src/components/Board/TigerPiece.test.tsx -t "capture"` | No -- Wave 0 | pending |
| 03-01-03 | 01 | 1 | POL-03 | unit | `npx vitest run src/hooks/useAnimationQueue.test.ts` | No -- Wave 0 | pending |
| 03-01-04 | 01 | 1 | POL-04 | unit | `npx vitest run src/components/Board/GoatPiece.test.tsx -t "placement"` | No -- Wave 0 | pending |
| 03-02-01 | 02 | 1 | POL-05 | unit | `npx vitest run src/audio/AudioEngine.test.ts` | No -- Wave 0 | pending |
| 03-02-02 | 02 | 1 | POL-06 | unit | `npx vitest run src/hooks/useSettings.test.ts -t "sound"` | No -- Wave 0 | pending |
| 03-02-03 | 02 | 1 | POL-07 | unit | `npx vitest run src/theme/theme.test.ts` | No -- Wave 0 | pending |
| 03-02-04 | 02 | 1 | POL-08 | unit | `npx vitest run src/hooks/useSettings.test.ts -t "theme"` | No -- Wave 0 | pending |
| 03-02-05 | 02 | 1 | POL-09 | unit | `npx vitest run src/hooks/useSettings.test.ts -t "persist"` | No -- Wave 0 | pending |
| 03-03-01 | 03 | 2 | TUT-01 | integration | `npx vitest run src/tutorial/Tutorial.test.ts -t "lesson 1"` | No -- Wave 0 | pending |
| 03-03-02 | 03 | 2 | TUT-02 | integration | `npx vitest run src/tutorial/Tutorial.test.ts -t "lesson 2"` | No -- Wave 0 | pending |
| 03-03-03 | 03 | 2 | TUT-03 | integration | `npx vitest run src/tutorial/Tutorial.test.ts -t "lesson 3"` | No -- Wave 0 | pending |
| 03-03-04 | 03 | 2 | TUT-04 | unit | `npx vitest run src/tutorial/TutorialOverlay.test.tsx -t "highlight"` | No -- Wave 0 | pending |
| 03-03-05 | 03 | 2 | TUT-05 | unit | `npx vitest run src/tutorial/TutorialOverlay.test.tsx -t "overlay"` | No -- Wave 0 | pending |
| 03-03-06 | 03 | 2 | TUT-06 | unit | `npx vitest run src/tutorial/TutorialOverlay.test.tsx -t "skip"` | No -- Wave 0 | pending |
| 03-03-07 | 03 | 2 | TUT-07 | unit | `npx vitest run src/tutorial/FirstLaunchModal.test.tsx` | No -- Wave 0 | pending |
| 03-04-01 | 04 | 2 | HIST-01 | unit | `npx vitest run src/history/storage.test.ts -t "auto-save"` | No -- Wave 0 | pending |
| 03-04-02 | 04 | 2 | HIST-02 | unit | `npx vitest run src/history/storage.test.ts -t "resume"` | No -- Wave 0 | pending |
| 03-04-03 | 04 | 2 | HIST-03 | unit | `npx vitest run src/history/HistoryScreen.test.tsx` | No -- Wave 0 | pending |
| 03-04-04 | 04 | 2 | HIST-04 | unit | `npx vitest run src/history/ReplayScreen.test.tsx -t "step"` | No -- Wave 0 | pending |
| 03-04-05 | 04 | 2 | HIST-05 | unit | `npx vitest run src/history/ReplayScreen.test.tsx -t "scrubber"` | No -- Wave 0 | pending |
| 03-04-06 | 04 | 2 | HIST-06 | unit | `npx vitest run src/history/ReplayScreen.test.tsx -t "auto-play"` | No -- Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/audio/AudioEngine.test.ts` -- stubs for POL-05 (Web Audio API needs mock AudioContext)
- [ ] `src/hooks/useAnimationQueue.test.ts` -- stubs for POL-03
- [ ] `src/hooks/useSettings.test.ts` -- stubs for POL-06, POL-08, POL-09
- [ ] `src/theme/theme.test.ts` -- stubs for POL-07
- [ ] `src/tutorial/Tutorial.test.ts` -- stubs for TUT-01, TUT-02, TUT-03
- [ ] `src/tutorial/TutorialOverlay.test.tsx` -- stubs for TUT-04, TUT-05, TUT-06
- [ ] `src/tutorial/FirstLaunchModal.test.tsx` -- stubs for TUT-07
- [ ] `src/history/storage.test.ts` -- stubs for HIST-01, HIST-02
- [ ] `src/history/HistoryScreen.test.tsx` -- stubs for HIST-03
- [ ] `src/history/ReplayScreen.test.tsx` -- stubs for HIST-04, HIST-05, HIST-06
- [ ] `src/components/Board/GoatPiece.test.tsx` -- stubs for POL-01, POL-04
- [ ] `src/components/Board/TigerPiece.test.tsx` -- stubs for POL-02

Note: Web Audio API tests require mocking `AudioContext`, `OscillatorNode`, `GainNode`. Use `vi.fn()` and `vi.spyOn()`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Animation feels smooth & weighted | POL-01, POL-02, POL-03 | Subjective visual quality | Play a full game; verify piece movements feel physical, captures show arc, chain-hops play sequentially |
| Sound quality matches theme | POL-05 | Subjective audio quality | Toggle between Traditional/Modern themes; verify stone vs wood sound character |
| Theme visual appearance | POL-07 | Subjective visual quality | Switch themes; verify Traditional = temple stone, Modern = minimal dark |
| Tutorial tone is warm & cultural | TUT-01-TUT-03 | Subjective copywriting | Complete all 3 lessons; verify cultural references and encouraging tone |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
