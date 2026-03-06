---
phase: 03-experience
plan: 04
subsystem: ui
tags: [localStorage, persistence, auto-save, replay, game-history, react]

# Dependency graph
requires:
  - phase: 01-engine-board
    provides: "Game engine (createGame, applyMove, getLegalMoves, getGameStatus), Board component"
  - phase: 02-ai-opponent
    provides: "useGame, useAIGame hooks, GameScreen with AI/Local routing"
provides:
  - "SavedGame/GameRecord types for game persistence"
  - "localStorage storage functions (save/load/clear current game, save/load history)"
  - "useAutoSave hook for automatic game persistence on every move"
  - "useGameResume hook for detecting interrupted games"
  - "HistoryScreen component listing completed games"
  - "ReplayScreen component with step controls, scrubber, and auto-play"
  - "App routing for history, replay, and resume-on-launch"
affects: [04-multiplayer]

# Tech tracking
tech-stack:
  added: []
  patterns: [localStorage-persistence, auto-save-via-useEffect, move-replay-through-engine]

key-files:
  created:
    - src/history/types.ts
    - src/history/storage.ts
    - src/history/storage.test.ts
    - src/history/useGameHistory.ts
    - src/history/HistoryScreen.tsx
    - src/history/HistoryScreen.test.tsx
    - src/history/ReplayScreen.tsx
    - src/history/ReplayScreen.test.tsx
  modified:
    - src/hooks/useGame.ts
    - src/hooks/useAIGame.ts
    - src/App.tsx
    - src/components/SetupScreen/SetupScreen.tsx

key-decisions:
  - "Store only moveHistory (Move[]) not full GameState -- reconstruct via engine replay for smaller storage"
  - "useAutoSave detects game completion via status transition from ongoing to terminal"
  - "Resume modal shown on app mount if saved game detected; user can resume or start new"
  - "ReplayScreen builds all state snapshots up front via engine replay for instant scrubbing"

patterns-established:
  - "localStorage persistence: try/catch all operations, fail silently on QuotaExceededError"
  - "Game history capped at 50 entries, newest first"
  - "vi.stubGlobal('localStorage', mock) pattern for Node 25 compatibility in tests"

requirements-completed: [HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06]

# Metrics
duration: 10min
completed: 2026-03-06
---

# Phase 3 Plan 4: Game History & Replay Summary

**localStorage auto-save on every move, game resume on reopen, history list with metadata, and full replay viewer with step/scrubber/auto-play controls**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-06T19:19:27Z
- **Completed:** 2026-03-06T19:30:22Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Every move auto-saves to localStorage; interrupted games resume on app reopen
- Completed games stored in history list (capped at 50) with date, opponent, result, duration
- Full replay viewer with forward/backward step, first/last jump, timeline scrubber, and auto-play at 1 move/second
- App routing for history and replay screens; SetupScreen gets "Game History" button
- 20 new tests (10 storage + 3 history + 7 replay), all 187 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Storage layer, auto-save, and resume** - `5c6b7a2` (feat)
2. **Task 2: History screen, replay viewer, and app routing** - `eb71202` (feat)

## Files Created/Modified
- `src/history/types.ts` - SavedGame, GameRecord types and localStorage key constants
- `src/history/storage.ts` - localStorage CRUD for current game and history list
- `src/history/storage.test.ts` - 10 tests covering all storage functions and error cases
- `src/history/useGameHistory.ts` - useAutoSave and useGameResume hooks, replayMoves utility
- `src/history/HistoryScreen.tsx` - Completed games list with date, opponent, result, duration
- `src/history/HistoryScreen.test.tsx` - 3 tests for empty state, rendering, and click handling
- `src/history/ReplayScreen.tsx` - Replay viewer with Board, controls, scrubber, auto-play
- `src/history/ReplayScreen.test.tsx` - 7 tests for navigation, scrubber, auto-play, play/pause
- `src/hooks/useGame.ts` - Added useAutoSave integration and clearCurrentGame on new game
- `src/hooks/useAIGame.ts` - Added useAutoSave integration and clearCurrentGame on new game
- `src/App.tsx` - Added history/replay screen routing and resume modal
- `src/components/SetupScreen/SetupScreen.tsx` - Added optional "Game History" button

## Decisions Made
- Store only moveHistory (Move[]) in localStorage, not full GameState -- engine replay reconstructs state, keeping storage size minimal
- useAutoSave tracks status transitions to detect game completion (avoids duplicate history saves)
- ReplayScreen pre-computes all state snapshots on mount via engine replay for instant scrubbing
- Resume modal overlays SetupScreen rather than replacing it; user can dismiss to start fresh
- Used vi.stubGlobal('localStorage', mock) pattern because Node 25's built-in localStorage lacks standard Web API methods

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Node 25 localStorage incompatibility in tests**
- **Found during:** Task 1 (storage tests)
- **Issue:** Node 25 provides a bare localStorage global without getItem/setItem/removeItem/clear methods, shadowing jsdom's proper implementation
- **Fix:** Used vi.stubGlobal('localStorage', mockStorage) with a Map-backed mock implementing the full Storage interface
- **Files modified:** src/history/storage.test.ts
- **Verification:** All 10 storage tests pass
- **Committed in:** 5c6b7a2

**2. [Rule 1 - Bug] Invalid test move sequence for ReplayScreen**
- **Found during:** Task 2 (ReplayScreen tests)
- **Issue:** Test used 3 PLACE moves but tigers don't place from pool (they start on board); second PLACE targeted an occupied tiger node
- **Fix:** Changed test moves to valid sequence: goat PLACE, tiger MOVE, goat PLACE
- **Files modified:** src/history/ReplayScreen.test.tsx
- **Verification:** All 7 replay tests pass
- **Committed in:** eb71202

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for test correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Game persistence foundation complete for multiplayer phase
- History/replay infrastructure can be extended for online game records
- All 187 tests pass, production build succeeds

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (5c6b7a2, eb71202) confirmed in git log. SUMMARY.md exists.

---
*Phase: 03-experience*
*Completed: 2026-03-06*
