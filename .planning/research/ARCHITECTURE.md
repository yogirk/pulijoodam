# Architecture Research

**Domain:** Web-based asymmetric strategy board game with AI and P2P multiplayer
**Researched:** 2026-03-04
**Confidence:** HIGH (stack is decided; patterns are well-established for this class of app)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  SVG Board   │  │  UI Panels   │  │   Screens    │              │
│  │  (React +    │  │ (status, HUD,│  │ (Home, Setup,│              │
│  │   SVG comps) │  │  pool, score)│  │  History...) │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         └─────────────────┼─────────────────┘                       │
│                           ↓                                          │
├───────────────────────────────────────────────────────────────────  │
│                        APPLICATION LAYER                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   useGame Hook / Game Context                 │   │
│  │   (owns: GameState, dispatch, animation queue, AI status)     │   │
│  └──────────┬──────────────────────────────────────┬────────────┘   │
│             ↓                                        ↓               │
│  ┌──────────────────┐                  ┌───────────────────────┐    │
│  │  useAI Hook      │                  │  useP2P Hook          │    │
│  │  (Worker proxy)  │                  │  (WebRTC controller)  │    │
│  └──────────┬───────┘                  └───────────┬───────────┘    │
│             │                                       │               │
├─────────────│───────────────────────────────────────│───────────────┤
│             │     ENGINE LAYER (zero UI deps)        │               │
│             │                                        │               │
│  ┌──────────▼───────────────────────────────────┐   │               │
│  │              src/engine/                      │   │               │
│  │  board.ts  state.ts  moves.ts  rules.ts       │   │               │
│  │  history.ts   ai/(minimax, mcts, eval)        │   │               │
│  └──────────────────────────────────────────────┘   │               │
│                                                      │               │
├──────────────────────────────────────────────────────────────────── │
│                   BOUNDARY PROCESSES                                  │
│                                                                      │
│  ┌────────────────────┐          ┌──────────────────────────────┐   │
│  │   AI Web Worker    │          │   WebRTC Data Channel        │   │
│  │  (engine copy,     │          │  (command relay, SDP offer/  │   │
│  │   runs search)     │          │   answer exchange)           │   │
│  └────────────────────┘          └──────────────────────────────┘   │
│                                                                      │
├──────────────────────────────────────────────────────────────────── │
│                   PERSISTENCE LAYER                                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │  localStorage  (game saves, settings, history, auto-save)  │      │
│  └────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Engine (`src/engine/`) | Pure game logic: move gen, validation, state transitions, win detection | Nothing — pure functions, called by hooks |
| `useGame` hook | Owns live `GameState`, dispatches moves, sequences animations, routes to AI or P2P | Engine functions, `useAI`, `useP2P`, localStorage |
| SVG Board components | Render board lines, nodes, pieces; fire tap events | `useGame` (reads state, calls dispatchMove) |
| UI Panels / Screens | Status display, menus, setup, history | `useGame` (reads state), React Router |
| `useAI` hook | Wraps Web Worker; sends state, receives move | AI Web Worker via `postMessage` |
| AI Web Worker | Imports engine, runs MCTS/Minimax; stateless per call | `useAI` hook via `postMessage` |
| `useP2P` hook | Owns RTCPeerConnection + data channel; sends/receives move commands | `useGame` (injects remote moves), WebRTC API |
| localStorage adapter | Serializes/deserializes GameState; auto-save and history list | `useGame` (writes), History screen (reads) |

---

## Recommended Project Structure

```
src/
├── engine/                   # Pure TS game engine — zero UI/framework deps
│   ├── types.ts              # All shared types (GameState, Move, Phase, Role...)
│   ├── board.ts              # 23-node topology, coordinates, adjacency map
│   ├── state.ts              # createGame(), state constructors
│   ├── moves.ts              # getLegalMoves(), applyMove(), MoveResult
│   ├── rules.ts              # getGameStatus(), win/draw detection, rule presets
│   ├── history.ts            # undo(), redo(), state hash for repetition detection
│   ├── ai/
│   │   ├── index.ts          # AI entry: chooseMove(state, config) → Move
│   │   ├── mcts.ts           # MCTS for placement phase
│   │   ├── minimax.ts        # Minimax + alpha-beta for movement phase
│   │   └── eval.ts           # Heuristic evaluation function
│   └── index.ts              # Public API surface (re-exports)
│
├── workers/
│   └── ai.worker.ts          # Web Worker entry: receives state, calls engine AI, posts move
│
├── hooks/
│   ├── useGame.ts            # Central game controller (state, dispatch, animation queue)
│   ├── useAI.ts              # Worker proxy: send state → receive Move
│   ├── useP2P.ts             # WebRTC lifecycle, offer/answer, data channel
│   └── useLocalStorage.ts    # Typed localStorage read/write with versioning
│
├── components/
│   ├── Board/
│   │   ├── Board.tsx         # SVG root: viewBox, edges, nodes
│   │   ├── Edge.tsx          # <line> for each board edge
│   │   ├── Node.tsx          # <circle> intersection with tap handler
│   │   ├── TigerPiece.tsx    # Animated SVG tiger
│   │   ├── GoatPiece.tsx     # Animated SVG goat
│   │   └── MoveHighlight.tsx # Legal move indicator ring
│   ├── GameScreen/
│   │   ├── GameScreen.tsx    # Layout: board + HUD
│   │   ├── StatusBar.tsx     # Turn, phase, captured count
│   │   └── GoatPool.tsx      # Visual goats-in-pool display
│   ├── HomeScreen/
│   ├── SetupScreen/
│   ├── TutorialScreen/
│   ├── HistoryScreen/
│   ├── ReplayScreen/
│   └── P2PScreen/            # Invite code exchange UI
│
├── store/                    # If Zustand is adopted (start with hooks, upgrade if needed)
│   └── gameStore.ts
│
├── App.tsx                   # Router, screen switching
└── main.tsx                  # Vite entry point
```

### Structure Rationale

- **`engine/` isolation:** Zero imports from React, Vite, or any UI lib. This enables: (1) unit testing with plain Node, (2) running inside Web Worker without pulling in UI bundle, (3) clean interface for future Rust port.
- **`workers/` separation:** Worker entry points live outside `engine/` because they import from engine but also handle the postMessage protocol — mixing concerns if placed in engine/.
- **`hooks/` as application layer:** Hooks own all the stateful coordination: which mode (AI/local/P2P), animation sequencing, persistence timing. Components stay purely presentational.
- **`components/Board/` decomposed:** SVG board broken into Edge, Node, Piece subcomponents so each animates independently via CSS transitions on `transform`/`opacity`.

---

## Architectural Patterns

### Pattern 1: Functional Engine with Immutable State

**What:** Every engine function takes `GameState` and returns a new `GameState` (plus events). Nothing mutates in place. `applyMove` returns `{ nextState: GameState, events: GameEvent[] }`.

**When to use:** Always for game logic — not just board games, any state machine where you want undo/redo, replay, or deterministic testing.

**Trade-offs:** Slightly more GC pressure than mutation (negligible for a 23-node board). Gains: trivial undo (pop state stack), deterministic AI simulation (no side effects), safe parallel use in Web Worker.

**Example:**
```typescript
// Engine API — all pure functions
function applyMove(state: GameState, move: Move): MoveResult {
  const nextState: GameState = {
    ...state,
    board: applyBoardChange(state.board, move),
    moveHistory: [...state.moveHistory, move],
    // ...
  };
  const events = deriveEvents(state, nextState, move);
  return { nextState, events };
}

// Caller (useGame hook)
const { nextState, events } = applyMove(currentState, move);
setHistory(prev => [...prev, currentState]); // trivial undo
setState(nextState);
animationQueue.enqueue(events);
```

### Pattern 2: Web Worker as Stateless AI Subprocess

**What:** The AI Worker receives a complete serialized `GameState` and `AIConfig`, runs the search algorithm, and posts back a single `Move`. The worker is stateless between calls — no caching of search trees across moves (simplest correct design; transposition tables are internal to the search, not persisted across worker messages).

**When to use:** Any computation that risks blocking the UI thread beyond ~16ms. For board game AI at Hard/Expert difficulty (2-5 seconds), this is mandatory.

**Trade-offs:** Serialization cost for large states (negligible for 23 nodes). Cannot share memory directly with main thread — use `postMessage` with structured clone. `SharedArrayBuffer` is overkill here.

**Example:**
```typescript
// ai.worker.ts
import { chooseMove } from '../engine/ai';
import type { AIWorkerRequest, AIWorkerResponse } from '../engine/types';

self.onmessage = (e: MessageEvent<AIWorkerRequest>) => {
  const { state, config } = e.data;
  const move = chooseMove(state, config);
  const response: AIWorkerResponse = { move };
  self.postMessage(response);
};

// useAI.ts (main thread)
function useAI() {
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/ai.worker.ts', import.meta.url),
      { type: 'module' }
    );
    return () => workerRef.current?.terminate();
  }, []);

  const requestMove = useCallback((state: GameState, config: AIConfig): Promise<Move> => {
    return new Promise(resolve => {
      workerRef.current!.onmessage = (e) => resolve(e.data.move);
      workerRef.current!.postMessage({ state, config });
    });
  }, []);

  return { requestMove };
}
```

### Pattern 3: Command Relay for P2P Synchronization

**What:** In P2P mode, each peer runs the full engine locally. Peers send *moves* (commands), not *state*. Receiving peer validates and applies the move independently. State never travels over the wire — only the command that caused the state change.

**When to use:** Deterministic turn-based games where both clients have the same starting state. Vastly reduces bandwidth vs state sync. Works because the engine is pure and deterministic.

**Trade-offs:** Both clients must start from identical state (enforced by host-sends-initial-config at connection time). Any engine non-determinism breaks sync silently — this is why the engine must be purely functional.

**Example:**
```typescript
// P2P message types
type P2PMessage =
  | { type: 'MOVE'; move: Move }
  | { type: 'GAME_CONFIG'; config: GameConfig }  // host sends at start
  | { type: 'RESIGN' }
  | { type: 'DRAW_OFFER' };

// useP2P.ts
dataChannel.onmessage = (e) => {
  const msg: P2PMessage = JSON.parse(e.data);
  if (msg.type === 'MOVE') {
    // Apply opponent's move on our local engine
    dispatchMove(msg.move);
  }
};

function sendMove(move: Move) {
  const msg: P2PMessage = { type: 'MOVE', move };
  dataChannel.send(JSON.stringify(msg));
}
```

### Pattern 4: Event-Driven Animation Queue

**What:** `applyMove` returns `GameEvent[]` describing what changed. The UI layer consumes these sequentially to animate: piece slides, captures, phase transitions. State is updated immediately; animations play from the queue independently.

**When to use:** Any UI that needs sequential animations after a state change. Especially important for chain-hops (multiple captures that must animate in order).

**Trade-offs:** Animation queue adds a thin coordination layer to the hook. Worth it: prevents "update state and hope CSS catches up" race conditions.

**Example:**
```typescript
type GameEvent =
  | { type: 'PIECE_MOVED'; from: NodeId; to: NodeId; role: Role }
  | { type: 'GOAT_CAPTURED'; nodeId: NodeId }
  | { type: 'PHASE_CHANGED'; newPhase: Phase }
  | { type: 'GAME_OVER'; result: GameResult };

// useGame.ts — process event queue sequentially
async function processEvents(events: GameEvent[]) {
  for (const event of events) {
    await animateEvent(event);   // returns Promise that resolves after CSS transition
  }
}
```

---

## Data Flow

### Player Move Flow (Local / AI Game)

```
Player taps node
    ↓
Board component fires onNodeClick(nodeId)
    ↓
useGame.handleNodeClick(nodeId)
    ├── if no selection: highlight legal sources → set selectedNode
    └── if selection exists:
        ├── validate move (engine.getLegalMoves)
        ├── engine.applyMove(state, move) → { nextState, events }
        ├── update state (React setState)
        ├── persist to localStorage
        ├── animate events (sequential queue)
        └── if AI turn: useAI.requestMove(nextState) → Worker → Move
                         └── loop back to applyMove with AI move
```

### AI Move Flow

```
useGame detects it's AI's turn
    ↓
useAI.requestMove(state, difficultyConfig)
    ↓ postMessage
AI Web Worker
    ├── placement phase? → MCTS(state, config.simulations) → Move
    └── movement phase? → Minimax+AB(state, config.depth)  → Move
    ↓ postMessage(move)
useGame receives Move
    ↓
applyMove → animate → check game over
```

### P2P Multiplayer Flow

```
HOST                                    GUEST
  │                                       │
  ├── createOffer() → SDP blob            │
  ├── base64 encode → display code        │
  │                                       │
  │          [user copy-pastes]           │
  │                                       │
  │                        paste SDP offer│
  │                   createAnswer() ─────┤
  │                   base64 encode ──────┤
  │                   display code        │
  │                                       │
  │   [user copy-pastes]                  │
  paste answer                            │
  setRemoteDescription() ────────────────►│
  │                   ICE negotiation     │
  ├── data channel OPEN ─────────────────►│
  │                                       │
  ├── send GAME_CONFIG ──────────────────►│
  │                   both init same state│
  │                                       │
  ├── MOVE (host's turn) ────────────────►│
  │                        apply locally  │
  │◄─── MOVE (guest's turn) ─────────────┤
  apply locally                           │
```

### State Management

```
GameState (immutable value)
    │
    ↓ (read)                       ↑ (write via setState)
React components                useGame hook
(Board, StatusBar, etc.)            │
    │                               │
    └── user events ────────────────┘
                              │
                    engine.applyMove()
                    localStorage.save()
                    animationQueue.enqueue()
                    (if AI turn) useAI.requestMove()
                    (if P2P turn) useP2P.sendMove()
```

---

## Suggested Build Order

The components have clear dependencies. Build bottom-up:

| Order | Component | Depends On | Why First |
|-------|-----------|-----------|-----------|
| 1 | `engine/types.ts` | Nothing | All other modules depend on types |
| 2 | `engine/board.ts` | types | Move generation needs topology |
| 3 | `engine/state.ts` | board, types | Moves need state shape |
| 4 | `engine/moves.ts` | board, state | Core mechanic; everything else needs it |
| 5 | `engine/rules.ts` | moves, state | Win detection; needed for AI and UI |
| 6 | `engine/history.ts` | state, moves | Undo/redo; used by useGame |
| 7 | Engine unit tests | engine/* | Validate before building on top |
| 8 | SVG Board rendering | board topology | Visualize what you built |
| 9 | `useGame` hook | engine, Board | Wires interaction to engine |
| 10 | Local 2P play | useGame | First playable milestone (Phase 1) |
| 11 | `engine/ai/eval.ts` | moves, rules | Needed by both MCTS and Minimax |
| 12 | `engine/ai/minimax.ts` | eval | Movement phase AI |
| 13 | `engine/ai/mcts.ts` | eval | Placement phase AI |
| 14 | `ai.worker.ts` + `useAI` | ai/ | Wire AI to Web Worker |
| 15 | SetupScreen + difficulty | useAI | Single-player mode (Phase 2) |
| 16 | Animations + audio | useGame events | Polish (Phase 3) |
| 17 | Tutorial system | engine, Board | Guided learning (Phase 4) |
| 18 | localStorage history | useGame | Replay/save (Phase 5) |
| 19 | `useP2P` + P2P UI | useGame, engine | Multiplayer (Phase 6) |
| 20 | Service worker + PWA | Vite build | Progressive enhancement (Phase 7) |

**Critical dependency:** The AI Worker imports engine code directly (`import { chooseMove } from '../engine/ai'`). Vite handles this with `new URL('../workers/ai.worker.ts', import.meta.url)` + `{ type: 'module' }` — this bundles the worker separately including its engine imports. Confirm Vite worker config before building AI.

---

## Anti-Patterns

### Anti-Pattern 1: Engine That Imports React

**What people do:** Put game state in a Zustand store or React context *inside* the engine directory, or import `useState` in engine functions.

**Why it's wrong:** Breaks Web Worker compatibility (React isn't available in workers). Breaks portability for the future Rust port. Prevents pure unit testing.

**Do this instead:** Engine is `GameState → GameState`. React hooks consume the engine; engine never knows React exists.

### Anti-Pattern 2: Sharing State Over P2P Instead of Commands

**What people do:** Serialize and send the full `GameState` object over the data channel after each move.

**Why it's wrong:** State is large and redundant. Worse, it couples the wire format to internal state shape — any refactor of `GameState` breaks serialization. It also defeats local validation: if you just accept remote state wholesale, you can't detect cheating or bugs.

**Do this instead:** Send `Move` objects only. Both clients run the engine locally. State stays a local implementation detail.

### Anti-Pattern 3: Blocking the Main Thread with AI Computation

**What people do:** Call the AI search synchronously in a button handler or `useEffect`, assuming it's "fast enough."

**Why it's wrong:** MCTS at 25,000 simulations will freeze the browser for several seconds. Even at Easy (500 simulations), there's a visible jank spike.

**Do this instead:** AI runs in a Web Worker unconditionally for all difficulty levels. The worker receives a message, computes, responds. The main thread remains responsive and can show a "thinking" indicator.

### Anti-Pattern 4: Mutable Board Array

**What people do:** Mutate the `board` array in place (e.g., `state.board[nodeId] = 'goat'`) for "performance."

**Why it's wrong:** Makes undo/redo require deep-copy logic everywhere. Makes AI simulation leak into real state if not careful. Creates subtle bugs when React bails out of re-render because reference hasn't changed.

**Do this instead:** `board` is a plain JS array — spread it on update: `board: [...state.board]` with the changed slot. For a 23-element array, this is negligible cost and eliminates an entire class of bugs.

### Anti-Pattern 5: One Monolithic Game Component

**What people do:** Build a single `<Game />` component that contains all state, all rendering, all handlers — 600+ line component.

**Why it's wrong:** Untestable, hard to animate independently, performance: any state change re-renders everything including the SVG board.

**Do this instead:** Separate `useGame` hook (logic) from `GameScreen` (layout) from `Board` (SVG) from individual `Piece` components. Memo the board when only UI state (selected node) changes but game state hasn't.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Contract |
|----------|--------------|---------|
| Engine ↔ hooks | Direct function calls (same bundle) | `applyMove(state, move): MoveResult` |
| `useGame` ↔ `useAI` | Promise-based async call | `requestMove(state, config): Promise<Move>` |
| Main thread ↔ AI Worker | `postMessage` / `onmessage` | `AIWorkerRequest` / `AIWorkerResponse` typed messages |
| `useGame` ↔ `useP2P` | Callback injection | `onRemoteMove: (move: Move) => void` passed to useP2P |
| `useGame` ↔ localStorage | Sync read/write on state change | Versioned JSON schema |
| Board ↔ `useGame` | React props + callbacks | `gameState`, `legalMoves`, `onNodeClick` |

### External Boundaries

| Service | Integration | Notes |
|---------|------------|-------|
| WebRTC (browser API) | `useP2P` hook wraps `RTCPeerConnection` | No signaling server; manual SDP exchange via UI |
| localStorage | `useLocalStorage` hook + versioned schema | Migrate schema on version bump |
| Service Worker (Phase 7) | Vite PWA plugin (`vite-plugin-pwa`) | Precaches built assets; no dynamic data |
| GitHub Pages | Vite build → `gh-pages` branch via GitHub Actions | Static files only, hash-based routing |

---

## Scaling Considerations

This is a static SPA with no server. "Scaling" means bundle size, AI performance, and rendering smoothness — not user concurrency.

| Concern | Current approach | If it becomes a problem |
|---------|-----------------|------------------------|
| Bundle size (< 1MB target) | Tree-shaking via Vite, lazy-load non-game screens | Code-split screens; lazy-import audio assets |
| AI computation time | Web Worker isolates it; difficulty caps control time | Iterative deepening with time budget; WASM Rust port |
| Board re-render on every move | React.memo on Board; pieces re-render only on their node change | Already sufficient for 23 nodes |
| localStorage size | ~1KB per game state; history can grow | Cap history at N games; offer export/clear |
| WebRTC ICE negotiation | Manual SDP copy-paste sidesteps signaling server cost | Add a free STUN server (Google's public STUN is fine) |

---

## Sources

- MDN: WebRTC Data Channels for Games — https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels
- WebRTC Hacks: P2P Multiplayer via DataChannel — https://webrtchacks.com/datachannel-multiplayer-game/
- LogRocket: Web Workers with React and TypeScript — https://blog.logrocket.com/web-workers-react-typescript/
- boardgame.io — open-source turn-based game framework (G/ctx pattern, engine/UI separation) — https://boardgame.io/documentation/
- Game Programming Patterns (Nystrom) — Command pattern for game actions — https://gameprogrammingpatterns.com/command.html
- Vite Worker docs — module worker bundling — https://vitejs.dev/guide/features.html#web-workers
- Project TECH-SPEC.md — canonical architecture decisions for this project

---
*Architecture research for: web-based asymmetric board game with AI and P2P multiplayer*
*Researched: 2026-03-04*
