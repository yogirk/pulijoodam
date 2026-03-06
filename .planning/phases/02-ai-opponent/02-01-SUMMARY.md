---
phase: 02-ai-opponent
plan: 01
subsystem: ai
tags: [evaluation, heuristic, web-worker, typescript]

# Dependency graph
requires:
  - phase: 01-engine-board
    provides: "GameState, getLegalMoves, getGameStatus, applyMove, NODES, JUMP_MAP"
provides:
  - "AIRequest, AIResponse, AIConfig, AIDifficulty type contracts"
  - "DIFFICULTY_CONFIGS mapping (easy/medium/hard/expert)"
  - "evaluate(state) heuristic evaluation function"
  - "chooseMove(state, config) entry point (random placeholder)"
  - "Web Worker shell (worker.ts) with message round-trip"
affects: [02-ai-opponent, 03-ui-ai-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI eval scores from tiger perspective (positive = tiger advantage)"
    - "Worker message protocol: COMPUTE_MOVE request / MOVE_COMPUTED response"
    - "AI files in src/engine/ai/ maintain engine purity (zero UI imports)"

key-files:
  created:
    - src/engine/ai/types.ts
    - src/engine/ai/eval.ts
    - src/engine/ai/index.ts
    - src/engine/ai/worker.ts
    - src/engine/ai/__tests__/eval.test.ts
    - src/engine/ai/__tests__/worker.test.ts
  modified:
    - eslint.config.js

key-decisions:
  - "Eval weights: captures*100, mobility*10, trapped*-80, vulnerable*15, walls*-5, centrality*3"
  - "chooseMove is a random placeholder -- MCTS/minimax dispatch added in Plan 02"
  - "Worker tests validate chooseMove directly (Vitest runs in Node, not browser)"

patterns-established:
  - "AI evaluation: terminal states checked first via getGameStatus, then weighted factor sum"
  - "Web Worker globals (self, MessageEvent, postMessage) added to ESLint config for worker files"
  - "AI test helpers: stateWith() spreads createGame() with overrides for custom board positions"

requirements-completed: [AI-01, AI-02]

# Metrics
duration: 4min
completed: 2026-03-06
---

# Phase 02 Plan 01: AI Foundation Summary

**AI type contracts, heuristic eval function with 6 weighted factors, and Web Worker shell with random-move placeholder**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T14:09:39Z
- **Completed:** 2026-03-06T14:14:05Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- AI type contracts exported: AIDifficulty, AIConfig, AIRequest, AIResponse, DIFFICULTY_CONFIGS
- Heuristic eval function scores terminal states correctly and monotonically increases with tiger advantage
- chooseMove returns a legal move for any valid GameState (placement, movement, chain-hop)
- Worker entry point compiles and handles COMPUTE_MOVE / MOVE_COMPUTED round-trip
- All 78 tests pass (12 new AI + 66 existing), zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: AI types and heuristic evaluation function**
   - `28b01ff` (test: failing tests for AI types and eval)
   - `f863bd9` (feat: implement heuristic evaluation function)
2. **Task 2: Web Worker shell and chooseMove placeholder** - `70e8134` (feat)

_TDD task 1 has RED + GREEN commits._

## Files Created/Modified
- `src/engine/ai/types.ts` - AIDifficulty, AIConfig, AIRequest, AIResponse, DIFFICULTY_CONFIGS
- `src/engine/ai/eval.ts` - Heuristic evaluate() with terminal detection and 6 weighted factors
- `src/engine/ai/index.ts` - chooseMove() random-move placeholder
- `src/engine/ai/worker.ts` - Web Worker entry point for off-main-thread AI computation
- `src/engine/ai/__tests__/eval.test.ts` - 8 tests covering terminal and mid-game scoring
- `src/engine/ai/__tests__/worker.test.ts` - 4 tests covering placement, movement, chain-hop
- `eslint.config.js` - Added Web Worker globals (self, MessageEvent, postMessage)

## Decisions Made
- Eval weights chosen from research doc: captures (100) is dominant signal, trapped tigers (-80) is strong penalty, mobility (10) and vulnerable goats (15) are secondary
- Worker tests exercise chooseMove directly rather than spawning actual Worker (Vitest runs in Node, not browser context)
- ESLint config extended with worker globals pattern for any `*worker*.ts` file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint worker globals not configured**
- **Found during:** Task 2 (Web Worker shell)
- **Issue:** ESLint flagged `self` and `MessageEvent` as undefined in worker.ts -- Web Worker globals not in ESLint config
- **Fix:** Added ESLint config block for `*worker*.ts` files with self, MessageEvent, postMessage globals
- **Files modified:** eslint.config.js
- **Verification:** `npx eslint src/engine/` passes clean
- **Committed in:** 70e8134 (Task 2 commit)

**2. [Rule 1 - Bug] Test board setup for goat-wins didn't block jump landings**
- **Found during:** Task 1 TDD GREEN (eval tests)
- **Issue:** Goat-wins test board had tigers "surrounded" by goats but jump landings were empty, so tigers could still capture -- not truly trapped
- **Fix:** Added goats at jump landing positions to fully block all tiger moves and captures
- **Files modified:** src/engine/ai/__tests__/eval.test.ts
- **Verification:** All 8 eval tests pass, goat-wins state correctly returns -10000
- **Committed in:** f863bd9 (Task 1 GREEN commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- Vitest does not support `-x` flag (used `--bail 1` instead for fail-fast behavior)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Type contracts ready for MCTS and minimax implementations (Plan 02)
- evaluate() ready for use as rollout heuristic and leaf evaluation
- chooseMove() placeholder ready to be replaced with algorithm dispatch
- Worker shell ready to receive real AI computation

---
*Phase: 02-ai-opponent*
*Completed: 2026-03-06*
