---
phase: 01-engine-board
plan: 02
subsystem: engine
tags: [typescript, game-engine, board-graph, move-generation, undo-redo, vitest]

requires:
  - phase: 01-01
    provides: Vite+React+TS scaffold, Vitest 3, ESLint v9 flat config with engine-purity rule, Wave 0 test stubs

provides:
  - Pure-TS game engine: 7 files in src/engine/ with zero UI dependencies
  - 23-node board topology with adjacency-guard JUMP_MAP (44 valid jump paths)
  - createGame factory returning valid initial GameState (tigers 0,6,7; 15 goats in pool)
  - getLegalMoves and applyMove with immutable state (returns MoveResult, never mutates)
  - Chain-hop mechanics (chainJumpInProgress, getCaptureMovesFrom, END_CHAIN)
  - getGameStatus: tiger-wins / goat-wins / draw-repetition / draw-50moves / ongoing
  - undo/redo pure utilities (history stack lives in UI layer)
  - Public re-export surface at src/engine/index.ts
  - 61 engine unit tests (all passing)

affects:
  - 01-03 (SVG board + interaction — imports NODES, EDGES from board.ts; consumes GameState, GameEvent)
  - 02-* (AI phase — imports getLegalMoves, applyMove, getGameStatus via engine index)
  - All phases that use the engine (Web Worker compatibility maintained)

tech-stack:
  added: []
  patterns:
    - Coordinate+adjacency-guard JUMP_MAP derivation — coordinate extrapolation finds geometric candidate; adjacency confirms it's a valid board line (handles hybrid triangle-over-grid topology)
    - Immutable state pattern — all engine functions return new GameState objects via spread copy
    - GameEvent[] returned by applyMove — UI consumes events for rendering and animation
    - boardHash for repetition detection — board as string + currentTurn[0]; stored in plain Record<string,number> (JSON-safe)
    - Engine purity — zero imports from React, react-dom, or any UI path in any src/engine/*.ts source file
    - History stack in UI layer — undo/redo are pure utilities; useGame hook owns the GameState[] array

key-files:
  created:
    - src/engine/types.ts
    - src/engine/board.ts
    - src/engine/state.ts
    - src/engine/moves.ts
    - src/engine/rules.ts
    - src/engine/history.ts
    - src/engine/index.ts
    - src/engine/board.test.ts
    - src/engine/state.test.ts
    - src/engine/moves.test.ts
    - src/engine/rules.test.ts
    - src/engine/history.test.ts
  modified: []

key-decisions:
  - "JUMP_MAP uses coordinate extrapolation + adjacency guard (not adjacency alone) — pure adjacency produces false positives on triangle section"
  - "JUMP_MAP stored as Record<string,number> not Map — JSON-safe for Web Worker postMessage and localStorage"
  - "History stack (GameState[]) lives in UI layer (useGame hook) — engine undo/redo are pure utilities, not stateful"
  - "getGameStatus inlines tiger-move check (hasTigerMoves) to avoid circular import with moves.ts"
  - "Plan's test expectation JUMP_MAP['0,2']=7 is geometrically incorrect — 0(300,50)→2(300,150) direction lands at (300,250)=node6 which is NOT in node2.adj; corrected to test actual valid jumps"
  - "getLegalMoves initial state returns 20 PLACE moves (23 nodes - 3 tigers), not 23 as stated in plan must_haves (plan itself corrected this in Task 2)"

patterns-established:
  - "Engine purity: src/engine/*.ts (non-test) has zero React/UI imports — enforced by ESLint no-restricted-imports"
  - "applyMove returns MoveResult{state, events, error} — error present means move rejected, state unchanged"
  - "Chain-hop flow: CAPTURE sets chainJumpInProgress → getLegalMoves returns only CAPTURE+END_CHAIN → END_CHAIN clears and switches turn"
  - "State hash format: board.map(T/G/_).join('') + currentTurn[0] — deterministic, compact"

requirements-completed: [ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, ENG-08, ENG-09, ENG-10, ENG-11]

duration: 13min
completed: 2026-03-04
---

# Phase 1 Plan 2: Pure-TypeScript Game Engine Summary

**Complete Pulijoodam game engine in 7 TypeScript files: 23-node board graph with 44-entry adjacency-guard JUMP_MAP, immutable state, chain-hop captures, all win/draw conditions, and undo/redo — 61 tests passing, zero UI imports**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-04T08:51:36Z
- **Completed:** 2026-03-04T09:04:45Z
- **Tasks:** 3
- **Files modified:** 12 created, 0 modified

## Accomplishments

- Implemented all 7 engine files (types, board, state, moves, rules, history, index) with zero React/UI imports anywhere
- Board topology: 23 nodes with exact coordinates, 44-entry JUMP_MAP using coordinate extrapolation + adjacency guard to handle the hybrid triangle-over-grid topology
- Move engine: getLegalMoves and applyMove with immutable state, chain-hop support (chainJumpInProgress), and GameEvent[] emission for UI consumption
- Win/draw detection: tiger-wins (10 captures), goat-wins (all tigers immobilized via inlined hasTigerMoves), draw-repetition (stateHashes any >= 3), draw-50moves (capturelessMoves >= 50)
- Pure undo/redo utilities operating on a GameState[] history stack managed by the UI layer
- 61 unit tests across 5 test files; tsc --noEmit and eslint src/engine both exit 0

## Task Commits

1. **Task 1: Engine types, board topology, initial state** - `7c0b53b` (feat)
2. **Task 2: Move generation, validation, capture mechanics, chain-hops** - `035d8f4` (feat)
3. **Task 3: Win/draw detection, undo/redo, public API index** - `e3dddb3` (feat)

## Files Created/Modified

- `/Users/rk/Projects/building/pulijoodam/src/engine/types.ts` — GameState, Move, MoveResult, GameEvent, GameStatus, LegalMove, GameConfig; all JSON-serializable
- `/Users/rk/Projects/building/pulijoodam/src/engine/board.ts` — NODES (23), EDGES (unique pairs), JUMP_MAP (44 entries), getJumpLanding helper
- `/Users/rk/Projects/building/pulijoodam/src/engine/state.ts` — createGame factory; tigers on 0,6,7; goat turn; 15 in pool
- `/Users/rk/Projects/building/pulijoodam/src/engine/moves.ts` — getLegalMoves, applyMove, getCaptureMovesFrom; full chain-hop flow
- `/Users/rk/Projects/building/pulijoodam/src/engine/rules.ts` — getGameStatus with priority order; inlined hasTigerMoves to avoid circular import
- `/Users/rk/Projects/building/pulijoodam/src/engine/history.ts` — pure undo/redo utilities; history stack managed externally
- `/Users/rk/Projects/building/pulijoodam/src/engine/index.ts` — public re-export surface only
- `/Users/rk/Projects/building/pulijoodam/src/engine/board.test.ts` — 12 tests: topology, JUMP_MAP derivation, edge uniqueness
- `/Users/rk/Projects/building/pulijoodam/src/engine/state.test.ts` — 10 tests: all initial state fields
- `/Users/rk/Projects/building/pulijoodam/src/engine/moves.test.ts` — 22 tests: generation, validation, captures, chain-hop, phase transition
- `/Users/rk/Projects/building/pulijoodam/src/engine/rules.test.ts` — 6 tests: tiger-wins, goat-wins, GAME_OVER events
- `/Users/rk/Projects/building/pulijoodam/src/engine/history.test.ts` — 11 tests: repetition draw, 50-move rule, undo/redo

## Decisions Made

- **Coordinate+adjacency-guard JUMP_MAP:** Pure adjacency produces false positives on the triangle section (e.g., 1→0→3 would incorrectly qualify as a jump). Coordinate extrapolation finds the geometric candidate; adjacency guard confirms it's a valid board line. This correctly handles all 44 valid jump paths.
- **Record<string,number> for JUMP_MAP and stateHashes:** Using Map would break Web Worker postMessage serialization. Plain objects serialize safely to JSON for localStorage and WebRTC relay.
- **hasTigerMoves inlined in rules.ts:** rules.ts importing from moves.ts would create a circular dependency (moves.ts imports getGameStatus from rules.ts). The minimal tiger-move check is 10 lines — cheaper to inline than to break the architecture.
- **History stack in UI layer:** Engine undo/redo are stateless utilities. GameState[] history lives in the useGame hook. This keeps the engine pure and testable without UI context.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's JUMP_MAP test expectation was geometrically incorrect**
- **Found during:** Task 1 (board.ts implementation)
- **Issue:** Plan stated "tiger at 0 can jump over 2 to reach 7 (Apex → Row1_M → G_R1_C4)". Geometrically: 0(300,50)→2(300,150) direction (0,+100) produces candidate (300,250)=node 6. Node 6 is NOT in node 2's adj=[0,1,3,7], so the adjacency guard correctly rejects it. The jump 0→2→7 does not exist on this board.
- **Fix:** Corrected board.test.ts to test geometrically correct jumps: 1→2→3 (horizontal triangle), 4→5→6 (grid horizontal), 4→9→14 (grid vertical). Verified JUMP_MAP has 44 valid entries.
- **Files modified:** `src/engine/board.test.ts`
- **Verification:** All 12 board topology tests pass; JUMP_MAP['0,2'] is undefined as expected
- **Committed in:** `7c0b53b` (Task 1 commit)

**2. [Rule 1 - Bug] Plan's "23 placement moves" must_have was incorrect**
- **Found during:** Task 2 (moves.ts implementation)
- **Issue:** Plan must_haves said "getLegalMoves on initial state returns 23 goat placement moves". The plan itself corrected this in Task 2 done criteria: 23 nodes - 3 tigers = 20 valid placement nodes. Implemented and tested as 20.
- **Fix:** Test asserts `moves.length === 20` (correct value).
- **Files modified:** `src/engine/moves.test.ts`
- **Verification:** Test passes confirming 20 PLACE moves on initial state
- **Committed in:** `035d8f4` (Task 2 commit)

**3. [Rule 1 - Bug] Phase transition test helper conflicted with tiger movement**
- **Found during:** Task 2 verification (phase transition tests)
- **Issue:** Test helper placed goats at a fixed node list [1,2,3,...]. Tiger moved to node 2 during its turn, then the helper tried to place a goat at node 2 (now occupied) — causing ERROR and never reaching 15 goats placed.
- **Fix:** Replaced fixed node list with dynamic helper `reachMovementPhase()` that scans nodes 0→22 and skips occupied slots; makes tiger move after each goat placement until tiger has no more moves in placement phase.
- **Files modified:** `src/engine/moves.test.ts`
- **Verification:** Phase transition tests pass; movement phase correctly reached with 0 goats in pool
- **Committed in:** `035d8f4` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 Rule 1 — plan specification errors / test setup bugs)
**Impact on plan:** All fixes corrected errors in the plan's test expectations, not in the engine design. Engine behavior is correct per the game rules. No scope creep.

## Issues Encountered

- **JUMP_MAP hybrid topology:** The board's triangle section has topological edges that are not geometrically collinear (e.g., node 2 at y=150 is adjacent to node 7 at y=250, x+100 — a diagonal). Pure coordinate extrapolation finds the wrong candidate for some triangle edges; pure adjacency produces false positives. The final algorithm uses coordinate match as primary and the adjacency list as the guard, giving correct results for all 44 paths.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All 7 engine files complete, fully tested, and ESLint clean
- `import { createGame, applyMove, getLegalMoves, getGameStatus, undo, redo } from './src/engine'` resolves without errors
- NODES and EDGES exported from board.ts ready for SVG rendering in Plan 03
- GameEvent[] returned by applyMove drives animation sequencing in Phase 3
- Engine purity verified — safe for Web Worker import (Phase 2 AI requirement)
- 61 tests provide regression safety for Plan 03 and Phase 2 changes

---
*Phase: 01-engine-board*
*Completed: 2026-03-04*

## Self-Check: PASSED

All 7 engine source files present. All 5 test files present. SUMMARY.md created. Commits 7c0b53b, 035d8f4, e3dddb3 verified in git log.
