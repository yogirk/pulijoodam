---
phase: 01-engine-board
plan: 03
subsystem: ui-board
tags: [react, svg, hooks, useReducer, game-ui, tailwind]

requires:
  - phase: 01-02
    provides: Engine API (createGame, applyMove, getLegalMoves, getGameStatus, undo, redo), NODES, EDGES, JUMP_MAP, all types

provides:
  - useGame hook: UIState/UIAction reducer bridging engine API to React state with selection, chain-hop, undo/redo
  - Board.tsx: SVG root with viewBox 0 0 600 700, edges/nodes/pieces in painter's layer order
  - BoardNode.tsx: interactive node with 44x44 SVG unit hit area, selection highlight, legal-move ring
  - TigerPiece.tsx: red rotated diamond polygon (visually dominant)
  - GoatPiece.tsx: tan circle (visually distinct from tigers and board nodes)
  - GameScreen.tsx: full game layout composing board + HUD + undo/redo controls + overlay
  - TurnIndicator.tsx: current player + phase subtitle
  - PoolCounter.tsx: goat pool and captured counter
  - GameOverOverlay.tsx: fixed overlay with result text for all 4 terminal states
  - Playable hot-seat game at http://localhost:5173

affects:
  - 02-* (AI phase — GameScreen will wire up Web Worker messages; useGame dispatches will stay the same)
  - 03-* (Animation phase — lastEvents array from useGame already threaded through; Board can subscribe)

tech-stack:
  added: []
  patterns:
    - UIState/UIAction useReducer pattern — single dispatch function for all game interactions
    - Painter's model SVG layering — edges, then nodes, then pieces (source order = z-order)
    - 44x44 transparent rect as mandatory hit area — rendered last in group to be topmost click target
    - Placement hint auto-highlight — all valid placement nodes highlighted during goat placement (no explicit selection needed)
    - Chain-hop destination highlight — legalMoves filtered to CAPTURE type when chainJumpInProgress active

key-files:
  created:
    - src/hooks/useGame.ts
    - src/components/Board/Board.tsx
    - src/components/Board/BoardEdge.tsx
    - src/components/Board/BoardNode.tsx
    - src/components/Board/TigerPiece.tsx
    - src/components/Board/GoatPiece.tsx
    - src/components/GameScreen/GameScreen.tsx
    - src/components/GameScreen/TurnIndicator.tsx
    - src/components/GameScreen/PoolCounter.tsx
    - src/components/GameScreen/GameOverOverlay.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "Goat placement auto-highlights all valid nodes (no tap-to-select needed) — goats have exactly one phase=placement action per turn; selection adds unnecessary friction"
  - "legalMoves filtered to from===selectedNode for destination highlights — prevents showing moves of all same-color pieces simultaneously"
  - "GameScreen calls useGame() internally — cleaner than prop-drilling; AI phase will replace with worker-aware hook variant"
  - "lastEvents threaded through UIState but not consumed in Phase 1 — ready for Phase 3 animation hooks without re-architecture"

duration: 8min
completed: 2026-03-04
---

# Phase 1 Plan 3: SVG Board, Interaction Hook, and HUD Summary

**React SVG board with tap-tap interaction, useReducer hook bridging the engine, HUD counters, game-over overlay, and full undo/redo — two humans can play a complete game of Pulijoodam at http://localhost:5173**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-04T09:03:00Z
- **Completed:** 2026-03-04T09:11:24Z
- **Tasks:** 3
- **Files modified:** 10 created, 1 modified

## Accomplishments

- useGame hook: full UIState/UIAction reducer with NODE_TAPPED (placement, movement, chain-hop), END_CHAIN, UNDO, REDO, NEW_GAME; history stack lives in UI layer
- Board SVG: viewBox 0 0 600 700, responsive (width:100%/maxWidth:600px), 23 nodes, correct edge set from EDGES, painter's z-order layering
- BoardNode: 44x44 transparent rect hit area (BRD-10), amber selection highlight, cyan legal-move ring, cursor:pointer
- TigerPiece: rotated red polygon — visually dominant and shape-distinct from goats
- GoatPiece: tan circle — color and shape distinct from both tigers and board nodes
- Goat placement auto-highlights all valid placement nodes (no tap-to-select step needed for goats)
- GameScreen: full game layout with TurnIndicator, PoolCounter (pool + captured), Board, End Turn button (chain-hop), Undo/Redo
- GameOverOverlay: fixed semi-transparent overlay with correct result text for tiger-wins, goat-wins, draw-repetition, draw-50moves
- npm run build exits 0; all 24 component/hook test stubs pass (pending)

## Task Commits

1. **Task 1: useGame hook — engine bridge with selection and undo/redo state** - `7a3b4d4` (feat)
2. **Task 2: SVG Board components — edges, nodes, and pieces** - `5fee6af` (feat)
3. **Task 3: GameScreen HUD, game-over overlay, and App wiring** - `42629c3` (feat)

## Files Created/Modified

- `/Users/rk/Projects/building/pulijoodam/src/hooks/useGame.ts` — UIState/UIAction reducer; exports useGame() with all interaction handlers
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/Board.tsx` — SVG root, edges/nodes/pieces layers, highlight logic
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/BoardEdge.tsx` — SVG line per edge
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/BoardNode.tsx` — interactive node: circle + highlight ring + 44x44 hit rect
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/TigerPiece.tsx` — red rotated polygon
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/GoatPiece.tsx` — tan circle
- `/Users/rk/Projects/building/pulijoodam/src/components/GameScreen/GameScreen.tsx` — game layout compositor
- `/Users/rk/Projects/building/pulijoodam/src/components/GameScreen/TurnIndicator.tsx` — turn display with phase subtitle
- `/Users/rk/Projects/building/pulijoodam/src/components/GameScreen/PoolCounter.tsx` — labeled numeric counter
- `/Users/rk/Projects/building/pulijoodam/src/components/GameScreen/GameOverOverlay.tsx` — terminal state overlay with New Game button
- `/Users/rk/Projects/building/pulijoodam/src/App.tsx` — now renders GameScreen

## Decisions Made

- **Goat placement auto-highlights:** During placement phase on goat's turn, all valid placement nodes show cyan rings without requiring a tap-to-select step. Goats have exactly one action type per turn (PLACE); selection adds unnecessary friction vs. tigers which have multiple pieces to choose from.
- **legalMoves filtered to selectedNode:** Destination highlights only show reachable nodes from the currently selected piece, not all legal move destinations across the board. This prevents confusing highlights when multiple pieces have moves.
- **GameScreen owns useGame internally:** Cleaner than prop-drilling the hook return value. Phase 2 AI integration will swap in a worker-aware hook variant without changing GameScreen's internal usage pattern.
- **lastEvents threaded but not consumed:** The lastEvents array from useGame is available in UIState and returned from the hook. Phase 3 animation hooks can subscribe to it without re-architecting the state management.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — engine API was clean and all types matched. Build succeeded on first attempt.

## User Setup Required

None — `npm run dev` starts the playable game at http://localhost:5173.

## Next Phase Readiness

- Playable hot-seat game complete; two humans can play a full game from start to game-over
- useGame hook is the stable integration point for Phase 2 AI (Web Worker messages replace direct applyMove calls)
- lastEvents array ready for Phase 3 animation sequencing
- SVG viewBox rendering is responsive; Tailwind shell provides mobile-first layout
- All 61 engine tests + 24 component stubs in green state; npm run build exits 0

---
*Phase: 01-engine-board*
*Completed: 2026-03-04*

## Self-Check: PASSED

All 10 source files present. SUMMARY.md created. Commits 7a3b4d4, 5fee6af, 42629c3 verified in git log. npm run build exits 0.
