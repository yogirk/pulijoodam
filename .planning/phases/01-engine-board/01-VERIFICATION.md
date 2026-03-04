---
phase: 01-engine-board
verified: 2026-03-04T09:15:54Z
status: human_needed
score: 23/23 must-haves verified
human_verification:
  - test: "Open http://localhost:5173 and tap an empty node"
    expected: "A goat piece (tan circle) appears on that node and turn switches to Tiger"
    why_human: "Tap-tap placement interaction requires a running browser — cannot verify with grep"
  - test: "Tap a tiger piece (red diamond on nodes 0, 6, or 7)"
    expected: "Tiger highlights with amber, and all legal destination nodes show cyan rings"
    why_human: "Visual highlight state and selection interaction require a running browser"
  - test: "Tap a highlighted cyan destination after selecting a tiger"
    expected: "Tiger moves there instantly; turn switches to Goat"
    why_human: "Movement interaction requires live browser"
  - test: "Set up or play to a tiger capture (tiger adjacent to goat with empty landing)"
    expected: "Goat disappears, tiger lands, 'Captured: 1' counter increments"
    why_human: "Capture rendering and counter update require live browser"
  - test: "Trigger a chain-hop (second capture available after first)"
    expected: "'End Turn' button appears; tapping a second capture destination continues the chain"
    why_human: "Chain-hop UX flow (button appearance, second capture) requires live browser"
  - test: "Play to a terminal state (e.g. 10 goat captures)"
    expected: "Game-over overlay appears with 'Tigers Win! 10 goats captured.' and a New Game button"
    why_human: "Overlay rendering and game-over text require live browser"
  - test: "Tap 'New Game' in the overlay"
    expected: "Board resets to initial state: 3 tigers on nodes 0/6/7, all other nodes empty"
    why_human: "Reset visual state requires live browser"
  - test: "Resize browser window from mobile width (~375px) to desktop (~1280px)"
    expected: "SVG board scales smoothly to fill available width with no horizontal scroll at any size"
    why_human: "Responsive layout behavior requires live browser"
  - test: "On a touch device or browser devtools touch simulation, tap a node near its edge"
    expected: "Tap registers correctly — 44x44 SVG unit hit area ensures touch targets are large enough"
    why_human: "Touch target feel requires physical or simulated touch interaction"
---

# Phase 1: Engine + Board Verification Report

**Phase Goal:** A human can play a complete, rules-correct game of Pulijoodam against another human on the same device
**Verified:** 2026-03-04T09:15:54Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 23-node board topology with correct adjacency lists renders in SVG | VERIFIED | `NODES` array in `src/engine/board.ts` has exactly 23 entries with adjacency matching `board-graph.md`; `Board.tsx` renders one `BoardNode` per `NODES` entry; 12 board topology tests pass |
| 2 | Tiger pieces are visually distinct from goat pieces | VERIFIED | `TigerPiece.tsx` renders a red rotated polygon (`#dc2626`); `GoatPiece.tsx` renders a tan circle (`#d4a76a`); shape + colour differ; both exist and are rendered in `Board.tsx`'s pieces layer |
| 3 | Tapping an empty node during placement places a goat | VERIFIED (auto) | `useGame.ts` reducer handles `NODE_TAPPED` in placement/goat branch — finds PLACE move, calls `applyMove`, pushes state; wired to `onNodeTap` in `GameScreen.tsx` |
| 4 | Tapping a tiger selects it and highlights all legal destinations | VERIFIED (auto) | `useGame.ts` sets `selectedNode` on tiger tap; `Board.tsx` populates `highlightedNodes` from `legalMoves` filtered to `from===selectedNode`; `BoardNode.tsx` renders cyan ring when `isLegalMove` |
| 5 | Tapping a highlighted destination moves the piece | VERIFIED (auto) | `useGame.ts` finds matching `LegalMove` from `selectedNode→nodeId`, calls `applyMove`, clears selection; covers both MOVE and CAPTURE types |
| 6 | Turn indicator shows current player above the board | VERIFIED | `TurnIndicator.tsx` renders `{currentTurn === 'tiger' ? '🐯 Tiger' : '🐐 Goat'}'s Turn`; wired in `GameScreen.tsx` with `gameState.currentTurn` |
| 7 | Goat pool counter shows remaining goats to place | VERIFIED | `PoolCounter` receives `count={gameState.goatsInPool}` and `visible={gameState.phase === 'placement'}`; hides in movement phase |
| 8 | Captured goat counter shows how many goats tigers have taken | VERIFIED | Second `PoolCounter` receives `count={gameState.goatsCaptured}` with no `visible` guard (always shown) |
| 9 | Game-over overlay appears with correct result text and New Game button | VERIFIED | `GameOverOverlay.tsx` covers all 4 terminal states (`tiger-wins`, `goat-wins`, `draw-repetition`, `draw-50moves`); shown when `status !== 'ongoing'` in `GameScreen.tsx`; `onNewGame` dispatches `NEW_GAME` |
| 10 | SVG scales responsively without horizontal scroll | VERIFIED | `Board.tsx` SVG has `style={{ width: '100%', height: '100%', maxWidth: '600px' }}` — no fixed `width`/`height` attributes |
| 11 | Every board node has a 44x44 SVG unit touch target | VERIFIED | `BoardNode.tsx` renders `<rect x={-22} y={-22} width={44} height={44} fill="transparent" />` as last child (top z-order) |
| 12 | Engine returns 20 legal placement moves on initial state | VERIFIED | `moves.test.ts` test "returns 20 PLACE moves for goat on initial state" passes (23 nodes − 3 tigers = 20 empty) |
| 13 | A tiger capture removes the goat and increments goatsCaptured | VERIFIED | `moves.ts` CAPTURE branch: `newBoard[move.over] = null`, `newState.goatsCaptured = state.goatsCaptured + 1`; confirmed by passing capture test |
| 14 | Chain-hop sets chainJumpInProgress after capture when further captures exist | VERIFIED | `moves.ts` checks `getCaptureMovesFrom(newState, move.to)` after CAPTURE; sets `chainJumpInProgress = move.to` if non-empty; 22-test `moves.test.ts` confirms |
| 15 | applyMove returns error for illegal moves without mutating state | VERIFIED | `validateMove` returns error string; `applyMove` returns `{ state, events: [], error }` (original state unchanged); confirmed by validation tests |
| 16 | Tiger wins when goatsCaptured >= 10 | VERIFIED | `rules.ts`: `if (state.goatsCaptured >= 10) return 'tiger-wins'`; rules tests pass |
| 17 | Goat wins when all tigers are immobilized | VERIFIED | `rules.ts` inlines `hasTigerMoves` checking both slides and captures for all tiger nodes; board state with all neighbors blocked returns `goat-wins` in tests |
| 18 | Draw by threefold repetition detected | VERIFIED | `rules.ts`: `Object.values(state.stateHashes).some(count => count >= 3)`; `history.test.ts` confirms |
| 19 | Draw by 50 captureless moves detected | VERIFIED | `rules.ts`: `state.capturelessMoves >= 50`; `history.test.ts` confirms |
| 20 | Undo restores previous GameState | VERIFIED | `useGame.ts` UNDO case: pops `history[history.length - 2]`, shrinks history, pushes current to `redoStack`; `history.test.ts` engine undo tests pass |
| 21 | Phase transitions to movement after 15th goat placement | VERIFIED | `moves.ts` PLACE branch: when `goatsInPool === 0`, sets `phase = 'movement'` and emits `PHASE_CHANGED`; phase transition test passes |
| 22 | Engine has zero UI dependencies | VERIFIED | `npx eslint src/engine/` exits 0; no `react` imports found in any `src/engine/*.ts` non-test file |
| 23 | All 61 engine unit tests pass with zero pending | VERIFIED | `npx vitest run src/engine/` — 5 files, 61 tests, 0 failures, 0 pending |

**Score:** 23/23 truths verified (automated)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/types.ts` | All shared types: GameState, Move, MoveResult, GameEvent, GameStatus, LegalMove, GameConfig | VERIFIED | File exists; exports all required types; JSON-serializable (no Map/Set in GameState) |
| `src/engine/board.ts` | 23-node topology with NODES, EDGES, JUMP_MAP | VERIFIED | 23 nodes with exact coords from spec; EDGES derived via `id < neighborId` guard; JUMP_MAP uses coordinate extrapolation + adjacency guard (44 entries) |
| `src/engine/state.ts` | createGame factory | VERIFIED | Tigers on 0,6,7; goatsInPool=15; phase=placement; currentTurn=goat; all fields correct |
| `src/engine/moves.ts` | getLegalMoves, applyMove, chain-hop | VERIFIED | Full implementation; immutable (spreads board); chain-hop via `getCaptureMovesFrom`; END_CHAIN supported |
| `src/engine/rules.ts` | getGameStatus with all 4 terminal conditions | VERIFIED | Priority order correct; `hasTigerMoves` inlined to avoid circular import |
| `src/engine/history.ts` | Pure undo/redo utilities | VERIFIED | `undo` and `redo` exported; history stack lives in UI layer |
| `src/engine/index.ts` | Public re-export surface | VERIFIED | Re-exports createGame, applyMove, getLegalMoves, getGameStatus, undo, redo, NODES, EDGES, JUMP_MAP, and all types |
| `src/hooks/useGame.ts` | UIState/UIAction reducer bridging engine to React | VERIFIED | Full reducer with NODE_TAPPED (all phases), END_CHAIN, UNDO, REDO, NEW_GAME; exports `useGame()` |
| `src/components/Board/Board.tsx` | SVG root: viewBox, edges, nodes, pieces | VERIFIED | viewBox="0 0 600 700"; painter's layer order (edges → nodes → pieces); highlight logic correct |
| `src/components/Board/BoardNode.tsx` | Interactive node with 44x44 hit area | VERIFIED | 44x44 `<rect>` rendered last in group; cyan ring on `isLegalMove`; amber fill on `isSelected` |
| `src/components/Board/BoardEdge.tsx` | SVG line per edge | VERIFIED | File exists; renders `<line>` with node coords |
| `src/components/Board/TigerPiece.tsx` | Red rotated polygon (visually dominant) | VERIFIED | File exists; rotated polygon in red (`#dc2626`) |
| `src/components/Board/GoatPiece.tsx` | Tan circle (distinct from tigers and nodes) | VERIFIED | File exists; circle in tan (`#d4a76a`) |
| `src/components/GameScreen/GameScreen.tsx` | Full game view: board + HUD + overlays | VERIFIED | Composes Board, TurnIndicator, PoolCounter (x2), End Turn button, Undo/Redo, GameOverOverlay |
| `src/components/GameScreen/TurnIndicator.tsx` | Current player + phase subtitle | VERIFIED | Renders `{tiger/goat}'s Turn`; shows `(Placement)` subtitle when `phase === 'placement'` |
| `src/components/GameScreen/PoolCounter.tsx` | Labeled numeric counter | VERIFIED | Accepts `label`, `count`, optional `visible`; returns null when hidden |
| `src/components/GameScreen/GameOverOverlay.tsx` | Terminal state overlay | VERIFIED | Covers all 4 terminal states; `onNewGame` button; fixed full-screen overlay |
| `src/App.tsx` | Renders GameScreen | VERIFIED | Single-line render of `<GameScreen />`; no placeholder |
| `vite.config.ts` | Unified Vite + Vitest config | VERIFIED | `test: { environment: 'node', globals: true, include: ['src/**/*.test.ts', 'src/**/*.test.tsx'] }` |
| `eslint.config.js` | ESLint v9 flat config with engine-purity rule | VERIFIED | `no-restricted-imports` on `src/engine/**/*.ts` (excluding test files); bans react*, @testing-library/*, ../components/*, ../hooks/* |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/engine/moves.ts` | `src/engine/board.ts` | `JUMP_MAP.get` (as `JUMP_MAP[key]`) | VERIFIED | `JUMP_MAP[key]` used in `getCaptureMovesFrom` and `validateCapture` |
| `src/engine/moves.ts` | `src/engine/rules.ts` | `getGameStatus` called inside `applyMove` | VERIFIED | `getGameStatus(newState)` called at end of `applyMove`; GAME_OVER event emitted if not ongoing |
| `src/engine/history.ts` | `src/engine/types.ts` | `GameState[]` snapshot stack | VERIFIED | `undo`/`redo` accept and return `GameState` arrays |
| `src/hooks/useGame.ts` | `src/engine/index.ts` | Imports createGame, applyMove, getLegalMoves, getGameStatus | VERIFIED | `import { createGame, applyMove, getLegalMoves, getGameStatus } from '../engine'` on line 2 |
| `src/components/Board/Board.tsx` | `src/hooks/useGame.ts` | Receives gameState, selectedNode, legalMoves, onNodeTap | VERIFIED | `BoardProps` interface and all props passed from `GameScreen.tsx` which owns `useGame()` |
| `src/components/Board/BoardNode.tsx` | `Board.tsx` | Rendered per node; onClick dispatches via onNodeTap | VERIFIED | `onClick={() => onNodeTap(node.id)}` in `Board.tsx`; all 23 nodes rendered |
| `src/components/GameScreen/GameOverOverlay.tsx` | `src/hooks/useGame.ts` | `onNewGame` dispatches `NEW_GAME` | VERIFIED | `NEW_GAME` case in reducer calls `makeInitialUIState()`; passed as prop to `GameOverOverlay` |
| `vite.config.ts` | `src/**/*.test.ts` | Vitest include glob | VERIFIED | `include: ['src/**/*.test.ts', 'src/**/*.test.tsx']` present |
| `eslint.config.js` | `src/engine/**` | Engine purity override | VERIFIED | Override block with `files: ['src/engine/**/*.ts']`, `ignores: ['src/engine/**/*.test.ts']` |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ENG-01 | 01-02, 01-04 | Board topology: 23 nodes, adjacency lists, jump paths | SATISFIED | `board.ts` has 23 nodes matching `board-graph.md`; JUMP_MAP with adjacency guard; 12 tests pass |
| ENG-02 | 01-02, 01-04 | Game state: board positions, phase, turn, pool, captures, chain-hop | SATISFIED | `state.ts` + `types.ts`; all fields present and tested; 10 state tests pass |
| ENG-03 | 01-02, 01-04 | Move generation: all legal moves for current player | SATISFIED | `getLegalMoves` covers placement/movement/chain-hop; 22 move tests pass |
| ENG-04 | 01-02, 01-04 | Move validation: rejects illegal moves with error reason | SATISFIED | `validateMove` covers wrong player, occupied destination, non-adjacent, etc.; validation tests pass |
| ENG-05 | 01-02, 01-04 | Capture mechanics: single jump and chain-hop (Andhra) | SATISFIED | `getCaptureMovesFrom` + chain-hop flow in `applyMove`; chain-hop two-capture test passes |
| ENG-06 | 01-02, 01-04 | Phase transition: placement → movement after 15 goats placed | SATISFIED | `applyMove` PLACE branch checks `goatsInPool === 0`; emits PHASE_CHANGED; test passes |
| ENG-07 | 01-02, 01-04 | Tiger win: 10+ goats captured | SATISFIED | `getGameStatus`: `goatsCaptured >= 10`; 6 rules tests pass including threshold test |
| ENG-08 | 01-02, 01-04 | Goat win: all tigers immobilized | SATISFIED | `hasTigerMoves` inlined in `rules.ts`; board state with all neighbors blocked tested |
| ENG-09 | 01-02, 01-04 | Draw: threefold repetition | SATISFIED | `stateHashes` tracked in `applyMove`; `Object.values(...).some(>= 3)` check; tests pass |
| ENG-10 | 01-02, 01-04 | Draw: 50 captureless moves | SATISFIED | `capturelessMoves` increments on non-capture, resets on capture; `>= 50` check; tests pass |
| ENG-11 | 01-02, 01-04 | Undo/redo via move history stack | SATISFIED | `history.ts` pure utilities; `useGame.ts` maintains `GameState[]`; undo/redo tests pass |
| ENG-12 | 01-01, 01-02 | Engine: zero UI dependencies | SATISFIED | `npx eslint src/engine/` exits 0; no React imports verified in all engine source files |
| ENG-13 | 01-01, 01-04 | Engine unit tests covering all requirements | SATISFIED | 61 tests, 5 files, 0 pending, 0 failures; ~93.78% statement coverage per SUMMARY |
| BRD-01 | 01-03 | SVG board renders 23 nodes at correct positions with edges | SATISFIED | `Board.tsx` renders one `BoardNode` per `NODES` (23) and one `BoardEdge` per `EDGES`; build passes |
| BRD-02 | 01-03 | Tiger and goat pieces render distinctly | SATISFIED | `TigerPiece` = red rotated polygon; `GoatPiece` = tan circle; shape + colour differ |
| BRD-03 | 01-03 | Tap-tap interaction: tap piece/node to select, tap destination to move/place | NEEDS HUMAN | Reducer logic verified in code; runtime interaction requires live browser |
| BRD-04 | 01-03 | Legal move highlighting on piece/node selection | SATISFIED (auto) | `highlightedNodes` logic in `Board.tsx` correct; `BoardNode` renders cyan ring when `isLegalMove`; runtime needs human |
| BRD-05 | 01-03 | Turn indicator shows whose turn it is | SATISFIED | `TurnIndicator.tsx` correctly reads `currentTurn` and `phase`; wired in `GameScreen.tsx` |
| BRD-06 | 01-03 | Goat pool counter | SATISFIED | `PoolCounter` with `label="Pool"` and `visible={phase === 'placement'}`; wired correctly |
| BRD-07 | 01-03 | Captured goat counter | SATISFIED | `PoolCounter` with `label="Captured"` always visible; reads `goatsCaptured` |
| BRD-08 | 01-03 | Game over screen with result and replay option | SATISFIED | `GameOverOverlay.tsx` covers all 4 statuses; `onNewGame` resets state |
| BRD-09 | 01-03 | Responsive layout | SATISFIED (auto) | `svg` has `width: '100%', maxWidth: '600px'`, no fixed dimensions; confirmed in source |
| BRD-10 | 01-03 | Touch targets minimum 44x44px | SATISFIED (auto) | `<rect x={-22} y={-22} width={44} height={44}>` in `BoardNode.tsx`; meets minimum |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/Board/Board.tsx` | 95 | `return null` | Info | Legitimate: skips null board slots — not a stub |
| `src/components/GameScreen/PoolCounter.tsx` | 8 | `return null` | Info | Legitimate: conditional render when `visible=false` — not a stub |

No blockers. No TODOs, FIXMEs, empty implementations, or placeholder comments found anywhere in `src/`.

---

### Human Verification Required

The engine is fully implemented and tested (61/61 passing). The UI wiring is complete and correct in source code. The following items require a live browser to confirm the goal — "a human can play a complete game" — is actually achievable end-to-end:

#### 1. Goat Placement Interaction

**Test:** Open `http://localhost:5173`. Tap any empty node on the board.
**Expected:** A tan circle (goat) appears on that node; turn indicator switches to "Tiger's Turn".
**Why human:** Tap event dispatch through SVG requires a real browser.

#### 2. Tiger Selection and Legal Move Highlights

**Test:** Tap one of the three initial tiger pieces (red diamond on nodes 0, 6, or 7).
**Expected:** Tiger highlights amber; all adjacent empty nodes show cyan rings.
**Why human:** Visual highlight state and selection require a running browser.

#### 3. Tiger Movement

**Test:** After selecting a tiger, tap a highlighted cyan destination node.
**Expected:** Tiger moves there instantly; highlights clear; turn switches to Goat.
**Why human:** Movement interaction requires live browser.

#### 4. Capture Rendering and Counter

**Test:** Play to a position where a tiger can jump over a goat (goat on adjacent node, empty landing node).
**Expected:** Goat disappears from board; tiger lands at destination; "Captured: 1" counter increments.
**Why human:** Capture visual update and counter increment require live browser.

#### 5. Chain-Hop UX

**Test:** Arrange or play to a double-capture position (tiger captures one goat and a second capture is immediately available).
**Expected:** "End Turn" button appears; tapping a second valid goat/destination continues the chain; chain ends either via button or when no more captures exist.
**Why human:** Chain-hop button appearance and multi-step interaction require live browser.

#### 6. Game-Over Overlay

**Test:** Play until 10 goats are captured.
**Expected:** Semi-transparent overlay appears with "Tigers Win! 10 goats captured." and a "New Game" button.
**Why human:** Overlay appearance and result text require live browser.

#### 7. New Game Reset

**Test:** With overlay visible, tap "New Game".
**Expected:** Board resets to initial state: 3 red tigers on nodes 0, 6, 7; all other nodes empty; turn reverts to Goat/Placement.
**Why human:** Visual board reset requires live browser.

#### 8. Responsive Layout

**Test:** Resize browser window from ~375px (mobile) to ~1280px (desktop).
**Expected:** SVG board scales smoothly to fill available width; no horizontal scroll at any size.
**Why human:** Responsive CSS behavior requires live browser inspection.

#### 9. Touch Target Feel

**Test:** On touch device or devtools touch simulation, tap a node near its edge (not the center).
**Expected:** Tap registers correctly; 44x44 SVG unit hit area ensures reliable touch registration on mobile.
**Why human:** Touch target feel requires physical or simulated touch input.

---

### Gaps Summary

No gaps found. All 23 observable truths verified automatically against the codebase. All 20 required requirements (ENG-01 through ENG-13, BRD-01 through BRD-10) are satisfied by existing code and passing tests. The 9 human verification items above are confirmation tests, not gap remediation — the code is correct and complete, but a human must confirm the assembled UI delivers the playable game experience the phase promises.

---

_Verified: 2026-03-04T09:15:54Z_
_Verifier: Claude (gsd-verifier)_
