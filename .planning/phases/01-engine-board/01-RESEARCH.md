# Phase 1: Engine + Board — Research

**Researched:** 2026-03-04
**Domain:** TypeScript game engine + SVG React board rendering
**Confidence:** HIGH (architecture fully specified by user; research verifies tooling and documents implementation patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Board topology:** 23 nodes from `specs/board-graph.md` — canonical source. Each node has `id` (0-22), label, adjacency list.
- **SVG coordinates:** Triangle (nodes 0-3) above a 5×4 grid (nodes 4-22). Computed at implementation time.
- **Jump path derivation:** For adjacent pair (A,B), compute direction vector, find C at B+direction, validate C exists AND is adjacent to B. Store as `Map<string, number>` keyed by `"tigerPos,goatPos" → landingPos`. Adjacency validation is the guard — NOT coordinate distance checks.
- **Initial piece positions:** Tigers on nodes 0, 6, 7. 15 goats in off-board pool. Goat player moves first.
- **Game phases (Andhra preset):** Placement phase: goats place on empty nodes, tigers move OR capture, goats cannot move. Movement phase begins when all 15 goats placed.
- **Chain-hops:** Allowed. After a capture, tiger may continue jumping if another capture is available (optional). `chainJumpInProgress` lives in engine state, NOT UI state.
- **Win conditions:** Tiger wins when 10+ goats captured. Goat wins when all 3 tigers immobilized.
- **Draw conditions:** Threefold repetition (same board + turn 3×) OR 50 consecutive captureless moves.
- **Engine API:** Functional with immutable state. Core surface: `createGame`, `applyMove`, `getLegalMoves`, `getGameStatus`, `undo`, `redo`. `applyMove` returns `MoveResult` with new `GameState` + `GameEvent[]`.
- **State representation:** `board` (23-slot array), `phase`, `currentTurn`, `goatsInPool`, `goatsCaptured`, `moveHistory`, `stateHashes`, `capturelessMoves`, `chainJumpInProgress`.
- **Rendering:** SVG + React components. `<line>` for edges, `<circle>` for nodes. `viewBox` for responsive scaling. No animations in Phase 1.
- **Board interaction:** Tap-tap model. No drag-to-move in Phase 1.
- **UI:** Turn indicator, goat pool counter, captured goat counter, game over overlay. Minimal chrome.
- **Scaffolding:** Vite + React + TypeScript (strict mode). Tailwind CSS v4 (shell only, not SVG). Vitest for engine tests. GitHub Pages deployment via GitHub Actions.
- **Testing:** Exhaustive engine unit tests are a PRIMARY deliverable.

### Claude's Discretion

- Exact SVG coordinate values for node positions (as long as the board looks correct)
- CSS styling details for the board shell (colors, fonts, spacing)
- Internal data structure optimizations
- Test framework configuration details
- Exact error message wording for invalid moves

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENG-01 | Board topology: 23 nodes with coordinates, adjacency lists, derived jump paths | Jump path derivation algorithm; adjacency-based validation approach |
| ENG-02 | Game state tracking: board positions, phase, turn, goat pool, captures, chain-hop progress | Immutable state interface design; state hash approach for draw detection |
| ENG-03 | Move generation: all legal moves for current player (placement and movement) | Functional getLegalMoves pattern; phase-conditional logic |
| ENG-04 | Move validation: reject illegal moves with clear error reason | MoveResult error pattern; validation guard ordering |
| ENG-05 | Capture mechanics: single jump and chain-hop (Andhra preset) | Chain-hop continuation pattern; chainJumpInProgress state field |
| ENG-06 | Phase transition: placement to movement when all 15 goats placed | GameEvent emission on transition; automatic detection in applyMove |
| ENG-07 | Tiger win detection: 10+ goats captured | Post-move status check in applyMove |
| ENG-08 | Goat win detection: all tigers immobilized | getLegalMoves called for tiger after every goat move |
| ENG-09 | Draw detection: threefold repetition | State hash map (board serialization + turn) |
| ENG-10 | Draw detection: 50 consecutive captureless moves | capturelessMoves counter; reset on capture |
| ENG-11 | Undo/redo: move history stack | History stack of full GameState snapshots |
| ENG-12 | Zero UI dependencies: pure TypeScript, functional API, immutable state | Structural constraint: no React imports in src/engine/ |
| ENG-13 | Engine unit tests: topology, moves, captures, chain-hops, win/draw, phase transitions | Vitest configuration; test file structure |
| BRD-01 | SVG board renders 23 nodes at correct positions with connecting edges | SVG coordinate system; viewBox pattern |
| BRD-02 | Tiger and goat pieces render distinctly | SVG shape conventions for asymmetric pieces |
| BRD-03 | Tap-tap interaction: tap piece/node to select, tap destination to move/place | React onClick on SVG elements; selection state in UI hook |
| BRD-04 | Legal move highlighting: valid destinations on selection | getLegalMoves called on selection; highlight circle pattern |
| BRD-05 | Turn indicator: whose turn it is | React state display component; GameState.currentTurn |
| BRD-06 | Goat pool counter: remaining goats to place | GameState.goatsInPool display |
| BRD-07 | Captured goat counter: goats captured | GameState.goatsCaptured display |
| BRD-08 | Game over screen: result with replay option | GameStatus check; overlay component |
| BRD-09 | Responsive layout: mobile, tablet, desktop | SVG viewBox + CSS width:100% pattern |
| BRD-10 | Touch targets: minimum 44×44px on mobile | SVG `<rect>` hit-area overlay on interactive nodes |
</phase_requirements>

---

## Summary

Phase 1 is a greenfield implementation. The architecture is fully decided: a pure TypeScript functional engine (`src/engine/`) with zero UI dependencies, driving an SVG + React board. All major design choices (state shape, API surface, board topology, game rules, tool stack) are locked in CONTEXT.md. Research confirms the toolchain choices are current and well-supported. The primary engineering challenges are (1) correct jump path derivation on a hybrid topology, (2) chain-hop state management, (3) SVG touch target sizing for mobile, and (4) ensuring the engine module boundary is enforced from day one.

The project scaffold is greenfield, so the very first task must establish the Vite + React + TypeScript + Tailwind v4 + Vitest project before any engine or board work begins.

**Primary recommendation:** Scaffold with `npm create vite@latest` (react-ts template), install Tailwind v4 via `@tailwindcss/vite` (no PostCSS config needed), install Vitest 4.x, and enforce the engine purity boundary via TypeScript path aliases and a lint rule from the first commit.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 6.x (latest) | Build tool, dev server | Locked in project decision; fastest TS/React dev experience |
| React | 19.x | UI framework | Locked in project decision |
| TypeScript | 5.x (strict) | Language | Locked in project decision |
| Vitest | 4.x | Unit testing | Locked in project decision; shares Vite config, no extra config needed |
| Tailwind CSS | 4.x | Shell UI styling | Locked in project decision; NOT for SVG elements |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tailwindcss/vite | 4.x | Tailwind Vite plugin | Required for Tailwind v4 (replaces PostCSS flow) |
| @vitejs/plugin-react | 4.x | React HMR + JSX | Required by Vite React template |
| @testing-library/react | 16.x | React component tests | Only for UI component tests (BRD-*); NOT for engine tests |
| jsdom | 25.x | DOM environment for Vitest | Needed for React component tests; NOT needed for engine-only tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest 4.x | Jest | Vitest shares Vite config and runs faster; Jest requires extra TS transform config |
| Tailwind v4 | CSS Modules | Tailwind v4 is locked decision; CSS Modules would be equally valid for shell-only styling |
| useReducer + Context | Zustand | CONTEXT.md says upgrade to Zustand "if needed" — start with hooks, defer until complexity warrants it |
| Immutable by convention | Immer | Immer simplifies nested updates but adds a dependency; game state is flat enough to avoid it |

### Installation

```bash
# Scaffold
npm create vite@latest pulijoodam -- --template react-ts
cd pulijoodam

# Tailwind v4
npm install tailwindcss @tailwindcss/vite

# Testing
npm install -D vitest @vitest/coverage-v8

# For React component tests (BRD-* tests only)
npm install -D @testing-library/react @testing-library/jest-dom jsdom
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/               # Pure TypeScript — ZERO UI imports allowed here
│   ├── types.ts          # All shared types: GameState, Move, MoveResult, GameEvent, etc.
│   ├── board.ts          # 23-node topology, coordinates, adjacency, jump path derivation
│   ├── state.ts          # createGame, initial state factory
│   ├── moves.ts          # getLegalMoves, applyMove, move validation
│   ├── rules.ts          # getGameStatus, win/draw detection
│   ├── history.ts        # undo, redo, state hash helpers
│   └── index.ts          # Public API re-exports only
├── components/
│   ├── Board/
│   │   ├── Board.tsx     # SVG root: viewBox, edges, nodes, pieces
│   │   ├── BoardEdge.tsx # <line> for each adjacency
│   │   ├── BoardNode.tsx # <circle> + hit area <rect> + highlight ring
│   │   ├── TigerPiece.tsx
│   │   └── GoatPiece.tsx
│   ├── GameScreen/
│   │   ├── GameScreen.tsx  # Composes board + HUD
│   │   ├── TurnIndicator.tsx
│   │   ├── PoolCounter.tsx
│   │   └── GameOverOverlay.tsx
│   └── ...
├── hooks/
│   └── useGame.ts        # useReducer wrapping engine API; selection state
├── App.tsx
└── main.tsx
```

### Pattern 1: Engine Module Boundary (ENG-12)

**What:** `src/engine/` imports nothing from React, React DOM, or any UI library. This is enforced by the directory structure and can be validated with ESLint `no-restricted-imports`.

**When to use:** Always — every file under `src/engine/`.

**Example:**
```typescript
// src/engine/index.ts — the ONLY public surface
export type { GameState, Move, MoveResult, GameEvent, GameStatus, LegalMove } from './types';
export { createGame } from './state';
export { applyMove, getLegalMoves } from './moves';
export { getGameStatus } from './rules';
export { undo, redo } from './history';

// FORBIDDEN in any engine file:
// import React from 'react';          // Engine purity violation
// import { useState } from 'react';   // Engine purity violation
```

### Pattern 2: Jump Path Derivation (ENG-01)

**What:** Pre-compute all valid tiger jump triples at initialization. Store as a lookup map.

**When to use:** Called once in `board.ts` module initialization; result is a frozen constant.

**Critical pitfall:** Do NOT use coordinate distance to validate collinearity on this hybrid topology. The triangle nodes (0-3) have non-grid spacing. The adjacency list IS the ground truth for "collinearity."

```typescript
// Source: specs/TECH-SPEC.md Section 2.4 + CONTEXT.md decisions
interface NodeDef {
  id: number;
  x: number;
  y: number;
  adj: number[];
}

function deriveJumpPaths(nodes: NodeDef[]): Map<string, number> {
  const jumpMap = new Map<string, number>();
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  for (const nodeA of nodes) {
    for (const bId of nodeA.adj) {
      const nodeB = nodeById.get(bId)!;
      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const cx = nodeB.x + dx;
      const cy = nodeB.y + dy;

      // Find candidate C by coordinate match
      const nodeC = nodes.find(n => Math.abs(n.x - cx) < 0.001 && Math.abs(n.y - cy) < 0.001);

      // CRITICAL: C must also be adjacent to B (adjacency guard, not just coordinate check)
      if (nodeC && nodeB.adj.includes(nodeC.id)) {
        jumpMap.set(`${nodeA.id},${bId}`, nodeC.id);
      }
    }
  }
  return jumpMap;
}
```

### Pattern 3: Immutable State + MoveResult (ENG-02, ENG-03, ENG-04)

**What:** Every engine function returns new state objects, never mutates. `applyMove` returns `MoveResult` containing the new state and events array.

**When to use:** Always — this is the core engine API contract.

```typescript
// Source: specs/TECH-SPEC.md Section 2.3
type Piece = 'tiger' | 'goat';
type Phase = 'placement' | 'movement';
type Role = 'tiger' | 'goat';

interface GameState {
  board: (Piece | null)[];          // length 23
  phase: Phase;
  currentTurn: Role;
  goatsInPool: number;
  goatsCaptured: number;
  moveHistory: Move[];
  stateHashes: Record<string, number>; // hash → count (use plain object, not Map, for JSON-safe serialization)
  capturelessMoves: number;
  chainJumpInProgress: number | null;
  config: GameConfig;
}

interface MoveResult {
  state: GameState;
  events: GameEvent[];
  error?: string;             // present if move was rejected
}

type GameEvent =
  | { type: 'PIECE_MOVED'; from: number; to: number; piece: Piece }
  | { type: 'GOAT_CAPTURED'; at: number; landedAt: number }
  | { type: 'GOAT_PLACED'; at: number }
  | { type: 'PHASE_CHANGED'; newPhase: Phase }
  | { type: 'GAME_OVER'; status: GameStatus }
  | { type: 'CHAIN_JUMP_AVAILABLE'; tigerAt: number }
  | { type: 'CHAIN_JUMP_ENDED'; tigerAt: number };

function applyMove(state: GameState, move: Move): MoveResult {
  // 1. Validate
  const validationError = validateMove(state, move);
  if (validationError) return { state, events: [], error: validationError };

  // 2. Apply (produce new state, never mutate)
  const newBoard = [...state.board];
  const events: GameEvent[] = [];
  // ... apply changes ...

  // 3. Check post-move status
  const newState: GameState = { ...state, board: newBoard, /* ... */ };
  const status = getGameStatus(newState);
  if (status !== 'ongoing') events.push({ type: 'GAME_OVER', status });

  return { state: newState, events };
}
```

### Pattern 4: Chain-Hop State Management (ENG-05)

**What:** `chainJumpInProgress` in engine state records the tiger node mid-chain. `getLegalMoves` checks this field and, when set, returns ONLY further capture moves from that node (or an empty set, signaling turn ends).

**When to use:** After every tiger capture; cleared when tiger has no further captures or player ends chain.

```typescript
function getLegalMoves(state: GameState): LegalMove[] {
  if (state.chainJumpInProgress !== null) {
    // Only further captures from the landing node are legal
    return getCaptureMovesFrom(state, state.chainJumpInProgress);
    // If empty, caller knows the chain is exhausted — UI shows "end turn" or auto-ends
  }
  // Normal move generation...
}
```

### Pattern 5: Threefold Repetition via State Hash (ENG-09)

**What:** After every move, serialize the board + currentTurn into a short string hash and increment a counter in `stateHashes`. If any hash reaches 3, declare draw.

**When to use:** Inside `applyMove`, after producing the new state.

```typescript
function boardHash(state: GameState): string {
  // Compact: join board slots as single chars, append turn
  return state.board.map(p => p === 'tiger' ? 'T' : p === 'goat' ? 'G' : '_').join('') + state.currentTurn[0];
}

// In applyMove, after building newState:
const hash = boardHash(newState);
const hashCount = (newState.stateHashes[hash] ?? 0) + 1;
const updatedHashes = { ...newState.stateHashes, [hash]: hashCount };
if (hashCount >= 3) events.push({ type: 'GAME_OVER', status: 'draw-repetition' });
```

Note: Use a plain `Record<string, number>` instead of `Map` so state is JSON-serializable (needed for localStorage persistence in Phase 3 and Web Worker messaging in Phase 2).

### Pattern 6: SVG Board with Responsive Scaling (BRD-01, BRD-09)

**What:** SVG element with `viewBox` set to internal coordinate space. No `width`/`height` attributes on `<svg>`. CSS makes it fill its container.

**When to use:** The Board component root.

```tsx
// Source: MDN SVG viewBox + responsive SVG patterns
// Internal coordinate space: 600×700 (fits triangle + grid)
const VIEWBOX = '0 0 600 700';

function Board({ state, onNodeClick, selectedNode, legalMoves }: BoardProps) {
  return (
    <svg
      viewBox={VIEWBOX}
      style={{ width: '100%', height: '100%', maxWidth: '600px' }}
      role="img"
      aria-label="Pulijoodam game board"
    >
      {EDGES.map(([a, b]) => (
        <BoardEdge key={`${a}-${b}`} from={NODES[a]} to={NODES[b]} />
      ))}
      {NODES.map(node => (
        <BoardNode
          key={node.id}
          node={node}
          piece={state.board[node.id]}
          isSelected={node.id === selectedNode}
          isLegalMove={legalMoves.some(m => m.to === node.id)}
          onClick={() => onNodeClick(node.id)}
        />
      ))}
    </svg>
  );
}
```

### Pattern 7: Touch Target Sizing via SVG Hit Area (BRD-10)

**What:** SVG nodes as circles may be too small for the 44×44px minimum touch target. Overlay an invisible `<rect>` or larger `<circle>` with `fill="transparent"` as the actual click target.

**When to use:** Every interactive BoardNode.

```tsx
const HIT_AREA_SIZE = 44; // px in SVG coordinate space (if viewBox is pixel-scaled)

function BoardNode({ node, onClick, isSelected, isLegalMove }: BoardNodeProps) {
  return (
    <g transform={`translate(${node.x}, ${node.y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Visual node */}
      <circle r={8} fill={isSelected ? '#f59e0b' : '#6b7280'} />
      {/* Legal move highlight ring */}
      {isLegalMove && <circle r={14} fill="none" stroke="#22d3ee" strokeWidth={2} opacity={0.8} />}
      {/* Invisible hit area for touch targets */}
      <rect
        x={-HIT_AREA_SIZE / 2}
        y={-HIT_AREA_SIZE / 2}
        width={HIT_AREA_SIZE}
        height={HIT_AREA_SIZE}
        fill="transparent"
      />
    </g>
  );
}
```

### Pattern 8: useGame Hook (UI–Engine Bridge)

**What:** `useReducer` wraps the engine API. Dispatched actions call engine functions and store the returned state. Selection state (which node is tapped) lives here — NOT in the engine.

**When to use:** The single source of truth for all game UI state.

```typescript
// src/hooks/useGame.ts
interface UIState {
  gameState: GameState;
  selectedNode: number | null;
  legalMoves: LegalMove[];
  lastEvents: GameEvent[];
}

type UIAction =
  | { type: 'NODE_TAPPED'; nodeId: number }
  | { type: 'NEW_GAME' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

function gameReducer(uiState: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'NODE_TAPPED': {
      const { gameState, selectedNode } = uiState;

      // Placement phase: goat player taps empty node
      if (gameState.phase === 'placement' && gameState.currentTurn === 'goat') {
        const result = applyMove(gameState, { type: 'PLACE', to: action.nodeId });
        if (result.error) return { ...uiState }; // invalid tap — no change (UI shows flash)
        return { gameState: result.state, selectedNode: null, legalMoves: [], lastEvents: result.events };
      }

      // Selection: tap own piece
      if (selectedNode === null) {
        const moves = getLegalMoves(gameState, action.nodeId);
        if (moves.length > 0) return { ...uiState, selectedNode: action.nodeId, legalMoves: moves };
        return uiState; // tap on piece with no moves — no selection
      }

      // Destination tap
      const move = uiState.legalMoves.find(m => m.to === action.nodeId);
      if (!move) return { ...uiState, selectedNode: null, legalMoves: [] }; // deselect
      const result = applyMove(gameState, move);
      return { gameState: result.state, selectedNode: null, legalMoves: [], lastEvents: result.events };
    }
    // ...
  }
}
```

### Pattern 9: Undo/Redo (ENG-11)

**What:** The simplest correct approach is storing the full history of `GameState` snapshots in `moveHistory`. Undo pops the last state; redo pushes a previously popped state from a redo stack.

**When to use:** User triggers undo/redo action.

```typescript
// Simplest approach: history is an array of complete GameState snapshots
// moveHistory[0] = initial state, moveHistory[n] = current state
// undo: return moveHistory[n-1], set redoStack.push(moveHistory[n])
// redo: return redoStack.pop()

// The GameState already holds moveHistory: Move[] for replay
// For undo/redo of state, keep a parallel stateHistory: GameState[] in the UI layer
// This avoids re-playing all moves (expensive for long games) while keeping engine pure
```

### Anti-Patterns to Avoid

- **Coordinate-distance collinearity for jump validation:** The hybrid topology (triangle + grid) means coordinate distance checks produce false positives. Always use adjacency list as the guard.
- **Mutable state in engine functions:** Any mutation of the input `GameState` breaks undo/redo and causes subtle bugs. Always spread-copy before modifying.
- **React imports in `src/engine/`:** Breaks Web Worker portability (Phase 2) and Rust port compatibility (future). Enforce from day one.
- **Map/Set in GameState:** `Map` and `Set` are not JSON-serializable. Use plain objects and arrays. This matters for Web Worker `postMessage` (structured clone) and Phase 3 localStorage.
- **Storing only moves (not states) for undo:** Re-applying moves from scratch is expensive and complex for chain-hops. Store full state snapshots in the UI layer's undo history.
- **Placing goat pool/capture counter logic in UI:** These are engine concerns, tracked in `GameState`. UI only reads and displays them.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project scaffolding | Custom webpack/rollup setup | `npm create vite@latest -- --template react-ts` | Vite template gives HMR, TS, React, path aliases in seconds |
| CSS utility classes | Custom CSS framework | Tailwind v4 via `@tailwindcss/vite` | No PostCSS config needed in v4; single `@import "tailwindcss"` |
| Unit test runner | Custom test harness | Vitest 4.x | Shares Vite config; runs engine tests without any extra transform setup |
| State hash for repetition | Complex Zobrist hash | Simple board serialization string | Board is only 23 nodes × 3 states = 69 bits; string concat is fast enough, no collision risk at this scale |

**Key insight:** The engine itself is custom (no board game library covers Pulijoodam), but the toolchain around it (scaffold, tests, styling) should use the ecosystem standard with zero custom infrastructure.

---

## Common Pitfalls

### Pitfall 1: False Collinearity on Hybrid Topology

**What goes wrong:** A developer computes jump landing by coordinate arithmetic `(C = B + (B - A))` and accepts any node near that coordinate as valid.

**Why it happens:** On a pure grid, coordinate arithmetic perfectly identifies valid jump targets. The Pulijoodam board is NOT a pure grid — the triangle section (nodes 0-3) has different spacing. Two nodes can be at the "correct" coordinate distance but not actually be adjacent in the graph.

**How to avoid:** After computing candidate C by coordinate, ALWAYS verify: (a) a node at those coordinates exists, AND (b) that node is in B's adjacency list. The adjacency list from `board-graph.md` is the single source of truth.

**Warning signs:** Tigers making "jumps" that skip over non-adjacent nodes; illegal captures accepted during testing.

### Pitfall 2: Chain-Hop Turn Termination Logic

**What goes wrong:** After a tiger capture, the turn is immediately passed to the goat player without checking if further captures are available.

**Why it happens:** Simple turn-alternation logic doesn't account for multi-jump continuations.

**How to avoid:** After every tiger capture, call `getCaptureMovesFrom(state, landingNode)`. If non-empty AND `chainJumpInProgress` is set, keep the turn with tigers. If empty, clear `chainJumpInProgress` and switch turn.

**Warning signs:** Tigers cannot chain-hop even when the board clearly allows it; or tigers can continue indefinitely without the move being optional.

### Pitfall 3: Module Boundary Leakage

**What goes wrong:** An engine function imports a React hook or a component-level constant "just this once." Later, the engine can't run in a Web Worker (Phase 2 breaks).

**Why it happens:** Convenience — it seems simpler to share a constant by importing from a component file.

**How to avoid:** All constants used by the engine must live in `src/engine/`. Add an ESLint rule: `"no-restricted-imports": [{ "patterns": ["react*", "../components/*"] }]` in `src/engine/.eslintrc`.

**Warning signs:** `import React` or `import { something } from '../components'` appearing in any `src/engine/*.ts` file.

### Pitfall 4: Map/Set in GameState Breaking Serialization

**What goes wrong:** `stateHashes` stored as a `Map<string, number>` causes `JSON.stringify(state)` to produce `{}` (Maps don't serialize). Web Worker `postMessage` via structured clone works, but localStorage (Phase 3) and debugging break.

**Why it happens:** Map feels natural for a hash table.

**How to avoid:** Use `Record<string, number>` (plain object) for `stateHashes`. All GameState fields must be JSON-serializable. Document this constraint in `types.ts`.

**Warning signs:** `JSON.stringify(gameState)` produces `"stateHashes":{}` in console.

### Pitfall 5: Goat Movement During Placement Phase

**What goes wrong:** `getLegalMoves` for goats during placement phase includes adjacent-node movement moves.

**Why it happens:** The rules differ between phases. A generic "get moves for piece" function might not check the current phase.

**How to avoid:** `getLegalMoves` must branch on `state.phase`. During `placement`, goat moves = place from pool only (if goatsInPool > 0). Goats on the board cannot move.

**Warning signs:** Goats on board have legal move highlights during placement phase.

### Pitfall 6: Touch Targets Too Small on Mobile

**What goes wrong:** SVG `<circle r={8}>` renders as ~16px circle. On a phone, users repeatedly miss nodes.

**Why it happens:** SVG visual size is determined by viewBox scaling, not device pixels.

**How to avoid:** Each `BoardNode` must include an invisible `<rect>` or `<circle>` with at minimum 44 SVG units in each dimension as the actual click target. If the viewBox is 600 units wide and the board is displayed at 360px on a small phone (0.6× scale), then 44 SVG units = 26.4 device pixels — marginally under the target. Consider a viewBox around 400 wide so scaling is better, or increase hit area to ~60 units.

**Warning signs:** User testing on real devices shows frequent mis-taps on nodes.

### Pitfall 7: Tiger Win Threshold Confusion

**What goes wrong:** Tiger win is checked as "6 or fewer goats on board" rather than "10 or more goats captured."

**Why it happens:** The two conditions are equivalent at game start (15 goats total), but goatsInPool != 0 during placement. A goat in the pool is NOT on the board, so "goats on board" count is misleading mid-game.

**How to avoid:** Tiger win condition: `state.goatsCaptured >= 10`. Always check the captured counter, not board presence.

**Warning signs:** Tiger wins declared during placement phase when pool goats haven't been placed yet.

---

## Board Topology: Computed Coordinates

The 23 nodes fit this layout (internal SVG coordinate space, viewBox `0 0 600 700`):

```
Triangle (nodes 0-3):
  Node 0 (Apex):     x=300, y=50
  Node 1 (Row1_L):   x=200, y=150
  Node 2 (Row1_M):   x=300, y=150
  Node 3 (Row1_R):   x=400, y=150

Grid (nodes 4-22, 5 columns × 4 rows):
  Grid top-left = x=100, y=250. Column step = 100. Row step = 100.
  Row 1: nodes  4(100,250), 5(200,250), 6(300,250), 7(400,250), 8(500,250)
  Row 2: nodes  9(100,350),10(200,350),11(300,350),12(400,350),13(500,350)
  Row 3: nodes 14(100,450),15(200,450),16(300,450),17(400,450),18(500,450)
  Row 4: nodes 19(100,550),20(200,550),21(300,550),22(400,550)
```

Note: Node 22 is the 4th of 4 nodes in row 4 (the bottom row has only 4 nodes — verify against `board-graph.md` adjacency: node 22 adj = [17, 21], which is column 4, consistent with x=400).

**Confidence:** MEDIUM — coordinate values are within Claude's discretion per CONTEXT.md. These are reasonable starting values; the implementer should adjust for visual quality. The adjacency structure is HIGH confidence from `specs/board-graph.md`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (unified — Vitest reads Vite config) |
| Quick run command | `npx vitest run src/engine` |
| Full suite command | `npx vitest run` |

### Vitest Configuration (embedded in vite.config.ts)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Engine tests run in node environment (no DOM needed — engine has no UI deps)
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      reporter: ['text', 'lcov'],
    },
  },
});
```

For React component tests (BRD-*), individual test files or a separate Vitest project can override `environment: 'jsdom'` via a file-level comment or vitest project config.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENG-01 | 23 nodes with correct adjacency; jump path count and correctness | unit | `npx vitest run src/engine/board.test.ts` | ❌ Wave 0 |
| ENG-02 | createGame returns correct initial state | unit | `npx vitest run src/engine/state.test.ts` | ❌ Wave 0 |
| ENG-03 | getLegalMoves returns correct moves for placement and movement phases | unit | `npx vitest run src/engine/moves.test.ts` | ❌ Wave 0 |
| ENG-04 | applyMove rejects illegal moves with error field | unit | `npx vitest run src/engine/moves.test.ts` | ❌ Wave 0 |
| ENG-05 | Tiger capture: single jump; chain-hop continuation; chain-hop termination | unit | `npx vitest run src/engine/moves.test.ts` | ❌ Wave 0 |
| ENG-06 | Phase transitions from placement to movement at 15th goat | unit | `npx vitest run src/engine/rules.test.ts` | ❌ Wave 0 |
| ENG-07 | Tiger win declared when goatsCaptured >= 10 | unit | `npx vitest run src/engine/rules.test.ts` | ❌ Wave 0 |
| ENG-08 | Goat win declared when all tigers have zero legal moves | unit | `npx vitest run src/engine/rules.test.ts` | ❌ Wave 0 |
| ENG-09 | Draw declared on threefold repetition | unit | `npx vitest run src/engine/history.test.ts` | ❌ Wave 0 |
| ENG-10 | Draw declared after 50 captureless moves | unit | `npx vitest run src/engine/history.test.ts` | ❌ Wave 0 |
| ENG-11 | Undo restores previous state; redo re-applies; mid-chain-hop undo | unit | `npx vitest run src/engine/history.test.ts` | ❌ Wave 0 |
| ENG-12 | No React/UI imports in engine files | lint | `npx eslint src/engine` | ❌ Wave 0 |
| ENG-13 | All above engine tests passing | unit | `npx vitest run src/engine` | ❌ Wave 0 |
| BRD-01 | Board SVG renders 23 nodes and correct edge count | smoke | `npx vitest run src/components/Board/Board.test.tsx` | ❌ Wave 0 |
| BRD-02 | Tiger/goat pieces render with distinct visual markers | smoke | `npx vitest run src/components/Board/Board.test.tsx` | ❌ Wave 0 |
| BRD-03 | Node click triggers selection state | unit | `npx vitest run src/hooks/useGame.test.ts` | ❌ Wave 0 |
| BRD-04 | Legal move highlights appear after piece selection | unit | `npx vitest run src/hooks/useGame.test.ts` | ❌ Wave 0 |
| BRD-05–08 | Turn indicator, counters, game over overlay display correct data | smoke | `npx vitest run src/components` | ❌ Wave 0 |
| BRD-09 | SVG scales correctly (no fixed pixel dimensions on svg element) | smoke | `npx vitest run src/components/Board/Board.test.tsx` | ❌ Wave 0 |
| BRD-10 | Each node has hit area ≥ 44×44 SVG units | unit | `npx vitest run src/components/Board/BoardNode.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/engine` (engine tests only, < 5 seconds)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/engine/board.test.ts` — covers ENG-01 (topology, coordinates, jump paths)
- [ ] `src/engine/state.test.ts` — covers ENG-02 (initial state)
- [ ] `src/engine/moves.test.ts` — covers ENG-03, ENG-04, ENG-05, ENG-06
- [ ] `src/engine/rules.test.ts` — covers ENG-07, ENG-08
- [ ] `src/engine/history.test.ts` — covers ENG-09, ENG-10, ENG-11
- [ ] `src/hooks/useGame.test.ts` — covers BRD-03, BRD-04
- [ ] `src/components/Board/Board.test.tsx` — covers BRD-01, BRD-02, BRD-09
- [ ] `src/components/Board/BoardNode.test.tsx` — covers BRD-10
- [ ] `src/components/GameScreen/GameScreen.test.tsx` — covers BRD-05–08
- [ ] Project scaffold itself (`package.json`, `vite.config.ts`, `tsconfig.json`) — Wave 0 prerequisite
- [ ] Framework install: `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom`

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PostCSS + tailwind.config.js | `@tailwindcss/vite` plugin + single `@import "tailwindcss"` | Tailwind v4 (Jan 2025) | No tailwind.config.js or postcss.config.js needed |
| Vitest 3.x | Vitest 4.x (stable Browser Mode, Visual Regression) | Oct 2025 | Vitest 4 has breaking changes vs 3.x — check migration guide if upgrading |
| `create-react-app` | `npm create vite@latest -- --template react-ts` | ~2022, fully cemented by 2024 | CRA is deprecated; Vite is the standard |
| Redux for all game state | `useReducer` + Context (Zustand if needed) | Ongoing since React Hooks | Simpler; Redux only needed for very large apps |

---

## Open Questions

1. **SVG coordinate tuning for board aesthetics**
   - What we know: Triangle nodes above a 5×4 grid; coordinate values are Claude's discretion.
   - What's unclear: Whether the triangle-to-grid vertical gap and triangle angles look correct visually.
   - Recommendation: Start with computed values (see Topology section above), render early in development, adjust based on visual inspection. No functional impact.

2. **Chain-hop "done" UI affordance**
   - What we know: After a capture with further captures available, the tiger player can continue or stop.
   - What's unclear: Whether a "Done" button or a timed auto-end is better UX.
   - Recommendation: Add an explicit "End Turn" button that appears only when `chainJumpInProgress !== null` and further captures are available. Simpler than timed logic.

3. **50-move rule: what counts as a "move"?**
   - What we know: "50 consecutive captureless moves" — standard interpretation is one half-move (ply) per player.
   - What's unclear: Whether a chain-hop sequence counts as 1 or N moves for the counter.
   - Recommendation: Count a complete turn (including all chain-hop jumps) as 1 move. Reset counter only on actual capture. This is the most common interpretation for similar games.

---

## Sources

### Primary (HIGH confidence)
- `specs/board-graph.md` — 23-node adjacency list, canonical topology
- `specs/game-rules.md` — Placement/movement phases, capture mechanics, win conditions
- `specs/TECH-SPEC.md` — Architecture, state interface, engine API, coordinate derivation algorithm
- `.planning/phases/01-engine-board/01-CONTEXT.md` — All locked implementation decisions
- Vitest official docs (vitest.dev/guide) — Framework version (4.x), configuration patterns
- Tailwind CSS v4 blog + docs (tailwindcss.com) — `@tailwindcss/vite` plugin setup, no PostCSS needed
- MDN SVG viewBox docs — Responsive SVG scaling pattern

### Secondary (MEDIUM confidence)
- WebSearch: Vitest 4.0 released Oct 2025 (InfoQ, VoidZero announcements) — version confirmed
- WebSearch: Tailwind v4 Vite setup guides (dev.to, Medium) — installation commands confirmed against official docs
- WebSearch: React 19 useReducer for game state — useReducer preferred for complex multi-field state (multiple sources agree)
- WebSearch: SVG touch target patterns — 44×44px minimum via transparent overlay rect (WCAG 2.1 standard)
- Chess engine threefold repetition detection (chessprogramming.org) — state hash approach; adapted to simpler board

### Tertiary (LOW confidence — for validation)
- WebSearch only: SVG coordinate values for board layout — no authoritative source; implementation must verify visually

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Vite/React/TypeScript/Vitest/Tailwind versions verified via web search against official sources
- Architecture: HIGH — Directly specified in CONTEXT.md and TECH-SPEC.md
- Jump path algorithm: HIGH — Algorithm specified in TECH-SPEC.md; pitfall (adjacency guard) verified as critical in CONTEXT.md
- Board coordinates: MEDIUM — Reasonable values derived from topology description; visual validation required
- Pitfalls: HIGH for engine pitfalls (from spec analysis); MEDIUM for touch target sizing (device-specific)

**Research date:** 2026-03-04
**Valid until:** 2026-06-04 (90 days — stable ecosystem; Vitest 4.x and Tailwind v4 unlikely to have breaking changes in this window)
