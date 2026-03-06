---
phase: 02-ai-opponent
plan: 02
subsystem: ai
tags: [mcts, minimax, alpha-beta, zobrist, iterative-deepening, transposition-table]

requires:
  - phase: 02-ai-opponent-01
    provides: "AI types, heuristic evaluation function, worker shell"
provides:
  - "MCTS algorithm for placement phase with heuristic-weighted rollouts"
  - "Minimax with alpha-beta pruning and iterative deepening for movement phase"
  - "Zobrist hashing for transposition table"
  - "chooseMove dispatcher routing by game phase"
affects: [02-ai-opponent-03, ui-integration]

tech-stack:
  added: []
  patterns: [UCB1-selection, negamax-alpha-beta, iterative-deepening, zobrist-hashing, transposition-table]

key-files:
  created:
    - src/engine/ai/mcts.ts
    - src/engine/ai/minimax.ts
    - src/engine/ai/zobrist.ts
    - src/engine/ai/__tests__/mcts.test.ts
    - src/engine/ai/__tests__/minimax.test.ts
    - src/engine/ai/__tests__/timing.test.ts
  modified:
    - src/engine/ai/index.ts

key-decisions:
  - "UCB1 exploration constant C=1.4 for MCTS selection"
  - "Heuristic-weighted rollouts: tiger captures 5x, goat tiger-adjacent 3x"
  - "Zobrist PRNG seed 0xDEAD_BEEF via xorshift32 for deterministic hashing"
  - "Transposition table 262144 entries with replace-always strategy"
  - "Negamax variant with chain-hop depth preservation"

patterns-established:
  - "MCTS for high-branching placement, minimax for evaluable movement"
  - "TimeoutError thrown every 1000 nodes to enforce time budgets"
  - "Chain-hop continuations don't decrement search depth (same logical turn)"

requirements-completed: [AI-03, AI-04, AI-05, AI-06, AI-07]

duration: 4min
completed: 2026-03-06
---

# Phase 2 Plan 02: MCTS and Minimax AI Algorithms Summary

**MCTS with UCB1 selection and heuristic rollouts for placement, negamax alpha-beta with Zobrist transposition table and iterative deepening for movement, time-budgeted across all difficulty levels**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-06T14:17:04Z
- **Completed:** 2026-03-06T14:22:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- MCTS algorithm with UCB1 selection, heuristic-weighted rollouts (tiger: captures 5x, near-goat 2x; goat: tiger-adjacent 3x, clustering 2x), and time budget enforcement
- Minimax with negamax alpha-beta pruning, iterative deepening, move ordering (TT best > captures > others), and 262144-entry transposition table with Zobrist hashing
- chooseMove dispatcher routing placement phase to MCTS and movement phase to minimax
- All 4 difficulty levels produce legal moves within time budgets (Hard <2s, Expert <5s verified)
- 15 new tests (5 MCTS + 8 minimax/zobrist/dispatch + 2 timing), 27 total AI tests, 93 total passing

## Task Commits

Each task was committed atomically:

1. **Task 1: MCTS for placement phase** - `3ea5112` (test: failing MCTS tests) -> `aedde3a` (feat: MCTS implementation)
2. **Task 2: Minimax with alpha-beta, Zobrist, iterative deepening, chooseMove dispatch** - `825326e` (test: failing minimax/timing tests) -> `fc91dba` (feat: minimax, zobrist, chooseMove dispatch)

_TDD tasks have paired commits (test -> feat)_

## Files Created/Modified
- `src/engine/ai/mcts.ts` - MCTS algorithm with UCB1, heuristic rollouts, time budget
- `src/engine/ai/minimax.ts` - Negamax alpha-beta with iterative deepening and transposition table
- `src/engine/ai/zobrist.ts` - Deterministic Zobrist hashing with xorshift32 PRNG
- `src/engine/ai/index.ts` - chooseMove dispatcher (replaced random placeholder)
- `src/engine/ai/__tests__/mcts.test.ts` - 5 tests covering legal moves, sim counts, time budget, chain-hops
- `src/engine/ai/__tests__/minimax.test.ts` - 8 tests covering legal moves, capture finding, time budget, zobrist, dispatch
- `src/engine/ai/__tests__/timing.test.ts` - 2 tests verifying Hard (<2s) and Expert (<5s) timing constraints

## Decisions Made
- UCB1 exploration constant C=1.4 (standard value, balances exploration/exploitation)
- Heuristic-weighted rollouts instead of pure random (addresses MCTS goat bias from RESEARCH.md)
- Zobrist PRNG uses fixed seed 0xDEAD_BEEF via xorshift32 for deterministic, worker-consistent hashing
- Transposition table sized at 2^18 (262144 entries) with replace-always strategy (simple, effective)
- Chain-hop continuations preserve search depth (same logical turn, not a new ply)
- Time budget checked every 100 MCTS iterations and every 1000 minimax nodes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core AI algorithms complete and verified
- chooseMove dispatches correctly by game phase
- Ready for Plan 03: difficulty tuning, self-play validation, worker integration
- AI plays legal, strategically-aware moves at all difficulty levels

## Self-Check: PASSED

All 7 files verified present. All 4 task commits verified in git log.

---
*Phase: 02-ai-opponent*
*Completed: 2026-03-06*
