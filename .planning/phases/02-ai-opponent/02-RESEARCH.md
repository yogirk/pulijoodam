# Phase 2: AI Opponent - Research

**Researched:** 2026-03-06
**Domain:** Game AI (MCTS + Minimax), Web Workers, React integration
**Confidence:** HIGH

## Summary

Phase 2 adds an AI opponent to Pulijoodam using a hybrid search strategy: MCTS for the placement phase (high branching factor with ~20 empty nodes per goat drop) and Minimax with alpha-beta pruning for the movement phase (smaller, more evaluable game trees). The AI must run in a Web Worker to keep the UI responsive, with four difficulty levels that are correctly ranked.

The existing engine is perfectly prepared for this: all state is JSON-serializable (no Map/Set), the functional API returns new state objects (safe for postMessage), and `getLegalMoves` + `applyMove` provide everything the AI needs to explore the game tree. The key technical challenges are: (1) designing an evaluation function that captures the asymmetric nature of tiger vs goat play, (2) tuning MCTS rollouts to avoid the well-known goat-bias problem where random rollouts undervalue goat strategy, and (3) integrating the worker-based AI with React state management without disrupting the existing useGame hook architecture.

**Primary recommendation:** Build AI as pure engine code in `src/engine/ai/`, communicate via a thin Web Worker message protocol, and create a `useAIGame` hook that wraps the existing `useGame` reducer with AI turn handling.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | AI runs in a Web Worker to keep UI responsive | Vite native Worker support with `new Worker(new URL(...))` syntax; engine already JSON-serializable |
| AI-02 | Heuristic evaluation function scores positions from tiger perspective | Eval function design documented in Architecture Patterns; based on tiger-goat game AI research |
| AI-03 | MCTS algorithm for placement phase | MCTS with UCB1 selection; heuristic-guided rollouts to counter goat bias |
| AI-04 | Minimax with alpha-beta pruning for movement phase | Negamax variant with iterative deepening and transposition table for Hard/Expert |
| AI-05 | 4 difficulty levels: Easy, Medium, Hard, Expert | Parameter table in Architecture Patterns maps levels to MCTS sims, minimax depth, and randomization |
| AI-06 | Hard difficulty completes moves in < 2 seconds | Iterative deepening with time budget ensures hard cutoff |
| AI-07 | Expert difficulty completes moves in < 5 seconds | Same time-budgeted iterative deepening; higher sim count and depth |
| AI-08 | Game setup screen lets user choose role and difficulty | New SetupScreen component + App routing |
| AI-09 | AI move has brief delay for natural feel | Minimum delay floor (400ms) in worker response; prevents jarring instant moves |
| AI-10 | Undo/redo available in AI games | useAIGame hook undoes both player move AND preceding AI move as a pair |
| AI-11 | AI self-play validation confirms difficulty levels correctly ranked | Automated test script running N games per difficulty pair |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Worker (native) | N/A | Run AI off main thread | Browser API, zero dependencies, Vite has first-class support |
| Vite Worker support | (bundled) | Bundle worker as module | `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | No external AI or worker libraries needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw postMessage | Comlink (1.1kB) | Adds proxy-based RPC; nice DX but overkill for a single request/response pattern. Skip for now. |
| Custom MCTS | mcts npm package | Generic packages lack game-specific optimizations (heuristic rollouts, asymmetric eval). Hand-roll. |

**Installation:**
```bash
# No new dependencies required
# Vite handles Web Worker bundling natively
```

## Architecture Patterns

### Recommended Project Structure
```
src/engine/ai/
  eval.ts          # Heuristic evaluation function (tiger perspective)
  mcts.ts          # MCTS for placement phase
  minimax.ts       # Minimax + alpha-beta for movement phase
  index.ts         # AI entry point: chooseMove(state, config) -> Move
  types.ts         # AIDifficulty, AIConfig types
  worker.ts        # Web Worker entry: onmessage handler
src/hooks/
  useGame.ts       # Existing (unchanged)
  useAIGame.ts     # Wraps useGame reducer, adds AI turn handling via worker
src/components/
  SetupScreen/
    SetupScreen.tsx # Role + difficulty picker
  GameScreen/
    GameScreen.tsx  # Updated to accept optional AI config
```

### Pattern 1: Web Worker Message Protocol
**What:** Simple request/response protocol for AI computation
**When to use:** All AI move computation

```typescript
// Worker message types (src/engine/ai/types.ts)
interface AIRequest {
  type: 'COMPUTE_MOVE';
  state: GameState;       // JSON-serializable, no Map/Set
  config: AIConfig;
}

interface AIResponse {
  type: 'MOVE_COMPUTED';
  move: Move;
  thinkTimeMs: number;
}

// Worker entry (src/engine/ai/worker.ts)
self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { state, config } = e.data;
  const startTime = performance.now();
  const move = chooseMove(state, config);
  const elapsed = performance.now() - startTime;
  self.postMessage({
    type: 'MOVE_COMPUTED',
    move,
    thinkTimeMs: elapsed,
  } satisfies AIResponse);
};

// Main thread instantiation
const worker = new Worker(
  new URL('../engine/ai/worker.ts', import.meta.url),
  { type: 'module' }
);
```

### Pattern 2: useAIGame Hook
**What:** Extends game state management to handle AI turns automatically
**When to use:** AI game mode (human vs AI)

```typescript
// src/hooks/useAIGame.ts
function useAIGame(config: { humanRole: Role; difficulty: AIDifficulty }) {
  const [state, dispatch] = useReducer(aiGameReducer, initialState);
  const workerRef = useRef<Worker | null>(null);

  // Create worker on mount, terminate on unmount
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../engine/ai/worker.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current.onmessage = (e: MessageEvent<AIResponse>) => {
      // Apply minimum delay for natural feel (AI-09)
      const elapsed = e.data.thinkTimeMs;
      const delay = Math.max(0, MIN_AI_DELAY_MS - elapsed);
      setTimeout(() => {
        dispatch({ type: 'AI_MOVE_RECEIVED', move: e.data.move });
      }, delay);
    };
    return () => workerRef.current?.terminate();
  }, []);

  // Trigger AI when it's AI's turn
  useEffect(() => {
    if (isAITurn(state, config.humanRole) && state.status === 'ongoing') {
      dispatch({ type: 'AI_THINKING' });
      workerRef.current?.postMessage({
        type: 'COMPUTE_MOVE',
        state: state.gameState,
        config: difficultyConfigs[config.difficulty],
      } satisfies AIRequest);
    }
  }, [state.gameState.currentTurn, state.gameState.chainJumpInProgress]);

  // Expose same interface as useGame + AI-specific state
  return {
    ...gameFields,
    isAIThinking: state.isAIThinking,
    // Undo in AI games undoes both AI move + human move (AI-10)
    onUndo: () => dispatch({ type: 'UNDO_PAIR' }),
  };
}
```

### Pattern 3: Evaluation Function (Tiger Perspective)
**What:** Heuristic scoring from tiger's point of view
**When to use:** Both MCTS (for heuristic rollout guidance) and minimax leaf evaluation

The evaluation function must handle the asymmetric nature of the game. All scores are from tiger's perspective (higher = better for tiger). When AI plays as goat, it negates the score.

```typescript
// src/engine/ai/eval.ts
function evaluate(state: GameState): number {
  // Terminal states: return extreme values
  const status = getGameStatus(state);
  if (status === 'tiger-wins') return +10000;
  if (status === 'goat-wins') return -10000;
  if (status.startsWith('draw')) return 0;

  let score = 0;

  // 1. Captured goats (strongest signal)
  score += state.goatsCaptured * CAPTURE_WEIGHT;    // e.g., 100

  // 2. Tiger mobility (number of legal tiger moves)
  score += tigerMobility(state) * MOBILITY_WEIGHT;  // e.g., 10

  // 3. Trapped tigers (tigers with zero moves)
  score -= trappedTigers(state) * TRAPPED_WEIGHT;   // e.g., 80

  // 4. Vulnerable goats (goats adjacent to tiger with empty landing)
  score += vulnerableGoats(state) * VULN_WEIGHT;    // e.g., 15

  // 5. Goat cluster penalty (goats forming walls = bad for tiger)
  score -= goatWallStrength(state) * WALL_WEIGHT;   // e.g., 5

  // 6. Central position bonus for tigers
  score += tigerCentrality(state) * CENTER_WEIGHT;  // e.g., 3

  return score;
}
```

### Pattern 4: MCTS with Heuristic Rollouts
**What:** Monte Carlo Tree Search that avoids pure-random rollout bias
**When to use:** Placement phase (goat drops, tiger moves/captures)

```typescript
// Key MCTS parameters by difficulty
// UCB1 constant: C = sqrt(2) is standard; tune to 1.4 for this game
function ucb1(node: MCTSNode, parentVisits: number): number {
  if (node.visits === 0) return Infinity;
  return node.value / node.visits + C * Math.sqrt(Math.log(parentVisits) / node.visits);
}

// Heuristic rollout: instead of pure random, bias move selection
// using lightweight eval (e.g., prefer captures for tiger, prefer blocking for goat)
function heuristicRollout(state: GameState, maxMoves: number): number {
  let current = state;
  for (let i = 0; i < maxMoves; i++) {
    const status = getGameStatus(current);
    if (status !== 'ongoing') return terminalScore(status);
    const moves = getLegalMoves(current);
    // Weight captures higher, blocking moves higher for goat
    const move = weightedRandomMove(current, moves);
    const result = applyMove(current, move.move);
    current = result.state;
  }
  // Non-terminal: use eval function
  return normalize(evaluate(current));
}
```

### Pattern 5: Minimax with Iterative Deepening + Time Budget
**What:** Negamax with alpha-beta, deepens until time runs out
**When to use:** Movement phase

```typescript
function iterativeDeepeningSearch(
  state: GameState,
  timeBudgetMs: number,
  role: Role
): Move {
  const deadline = performance.now() + timeBudgetMs;
  let bestMove: Move = fallbackMove(state);
  let timeExpired = false;

  for (let depth = 1; depth <= MAX_DEPTH && !timeExpired; depth++) {
    try {
      const result = negamax(state, depth, -Infinity, Infinity, role, deadline);
      bestMove = result.move;
    } catch (e) {
      if (e instanceof TimeoutError) break;
      throw e;
    }
  }
  return bestMove;
}
```

### Pattern 6: Difficulty Configuration
**What:** Maps difficulty levels to AI parameters
**When to use:** AI configuration

| Level | MCTS Sims | Minimax Depth | Time Budget | Move Selection | Extra |
|-------|-----------|---------------|-------------|----------------|-------|
| Easy | 200 | 2 | 500ms | Random from top-3 | Intentionally suboptimal |
| Medium | 2,000 | 4 | 1,000ms | Best move | Basic alpha-beta |
| Hard | 10,000 | 6 | 2,000ms | Best move | Iterative deepening |
| Expert | 50,000 | 8+ | 5,000ms | Best move | + transposition table |

Note: MCTS simulation counts from TECH-SPEC.md (500/5000/25000/100000) may be too high for mobile. Use time-budgeted approach as primary control and simulation count as secondary cap.

### Anti-Patterns to Avoid
- **Sharing worker across games:** Create a new worker per game. Terminate on unmount. Stale messages from previous games cause bugs.
- **Mutating state in AI:** The engine is immutable. AI must work with `applyMove` returning new states, never mutate board arrays.
- **Blocking main thread "just for Easy":** Even Easy difficulty must use the worker. Blocking for "just 10ms" causes jank on low-end phones.
- **Using `structuredClone` for worker messages:** `postMessage` already does structured clone internally. Don't double-clone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Worker bundling | Custom webpack worker plugin | Vite native `new Worker(new URL(...))` | Vite handles bundling, HMR, and production builds automatically |
| UCB1 formula | Custom exploration formula | Standard UCB1 with C=1.4 | Well-studied, proven for game trees |
| Zobrist hashing | Custom hash for transposition table | Standard Zobrist with XOR | O(1) incremental updates; well-documented technique for board games |
| Move ordering | No ordering | Captures first, then eval-sorted | Move ordering is critical for alpha-beta efficiency; unordered search is exponentially slower |

**Key insight:** The game-specific parts (eval function, rollout policy) need hand-tuning. The algorithmic frameworks (MCTS structure, alpha-beta, iterative deepening) are textbook -- implement them correctly, don't innovate.

## Common Pitfalls

### Pitfall 1: MCTS Goat Bias
**What goes wrong:** Pure random rollouts systematically undervalue goat play because random goat moves are terrible strategy, making MCTS overestimate tiger's chances.
**Why it happens:** Goats need coordinated placement (walls, traps); random placement scatters them uselessly.
**How to avoid:** Use heuristic-guided rollouts that bias goat moves toward blocking and clustering. Weight captures for tiger rollouts.
**Warning signs:** AI plays much stronger as tiger than as goat at the same difficulty level.

### Pitfall 2: Eval Function Weight Tuning
**What goes wrong:** Initial weight guesses produce an AI that plays oddly -- e.g., valuing mobility so highly it ignores captures, or vice versa.
**Why it happens:** Weights interact non-linearly; reasonable-sounding values can produce bad play.
**How to avoid:** Implement self-play validation (AI-11) early and iterate. Start with capture weight dominant (100), mobility secondary (10-15), adjust from there.
**Warning signs:** AI makes moves that "feel wrong" -- ignoring obvious captures, or moving tigers to corners.

### Pitfall 3: Worker Message Timing
**What goes wrong:** AI move arrives after user has already clicked undo, or a new game was started, causing the AI move to apply to wrong game state.
**Why it happens:** Worker computation is async; UI state can change while worker is thinking.
**How to avoid:** Include a `requestId` or state hash in the request/response. Discard responses that don't match current state. Also terminate/recreate worker on new game.
**Warning signs:** Pieces move to unexpected positions, especially after undo or new game during AI thinking.

### Pitfall 4: Chain-Hop Handling in AI
**What goes wrong:** AI doesn't properly handle chain-hop sequences, either missing multi-capture opportunities or getting stuck in infinite loops.
**Why it happens:** Chain-hops create intermediate states where `chainJumpInProgress !== null` and only CAPTURE or END_CHAIN are legal. The search tree branches differently here.
**How to avoid:** In both MCTS and minimax, treat chain-hop continuations as part of the same "turn" -- don't switch perspective until chain is ended. The existing `getLegalMoves` already handles this correctly; use it faithfully.
**Warning signs:** AI ends chains prematurely or never captures chains at all.

### Pitfall 5: Mobile Performance
**What goes wrong:** AI that runs fine on desktop takes 10+ seconds on a mid-range phone.
**Why it happens:** Mobile CPUs are 3-5x slower than desktop. Simulation counts from desktop testing don't transfer.
**How to avoid:** Use time-budgeted iterative deepening (not fixed depth/sim count) as the primary constraint. Test on throttled CPU (Chrome DevTools 4x slowdown).
**Warning signs:** Expert AI exceeds 5-second budget on real devices.

### Pitfall 6: Undo Pairing in AI Games
**What goes wrong:** Undo only steps back one move, leaving the board in a state where it's the AI's turn and the AI immediately re-moves.
**Why it happens:** The history stack treats each move independently.
**How to avoid:** In AI games, undo must step back TWO moves (the AI's move + the human's preceding move) as a single operation. Handle edge case where the first move was by AI (human plays tiger, AI goat goes first).
**Warning signs:** Pressing undo causes the AI to immediately make another move, appearing to do nothing.

## Code Examples

### Zobrist Hashing for Transposition Table
```typescript
// Initialize random bitstrings (once at module load)
// 23 nodes x 3 states (empty=0, tiger=1, goat=2) + 2 turn bits
const ZOBRIST: number[][] = Array.from({ length: 23 }, () =>
  Array.from({ length: 3 }, () => Math.floor(Math.random() * 0xFFFFFFFF))
);
const TURN_HASH = [
  Math.floor(Math.random() * 0xFFFFFFFF), // tiger
  Math.floor(Math.random() * 0xFFFFFFFF), // goat
];

function zobristHash(state: GameState): number {
  let hash = 0;
  for (let i = 0; i < 23; i++) {
    const piece = state.board[i];
    const idx = piece === null ? 0 : piece === 'tiger' ? 1 : 2;
    hash ^= ZOBRIST[i][idx];
  }
  hash ^= TURN_HASH[state.currentTurn === 'tiger' ? 0 : 1];
  return hash;
}
```

Note: JavaScript bitwise ops work on 32-bit ints. For a 23-node board with 3 piece types, 32-bit Zobrist hashing has acceptable collision probability. No need for BigInt.

### Transposition Table Entry
```typescript
interface TTEntry {
  hash: number;
  depth: number;
  score: number;
  flag: 'EXACT' | 'LOWER' | 'UPPER';
  bestMove: Move | null;
}

// Fixed-size table to avoid memory issues
const TT_SIZE = 1 << 20; // ~1M entries
const table = new Array<TTEntry | null>(TT_SIZE).fill(null);

function ttLookup(hash: number): TTEntry | null {
  const entry = table[hash & (TT_SIZE - 1)];
  return entry?.hash === hash ? entry : null;
}

function ttStore(entry: TTEntry): void {
  table[entry.hash & (TT_SIZE - 1)] = entry;
}
```

### AI Move Delay for Natural Feel (AI-09)
```typescript
const MIN_AI_DELAY_MS = 400; // Minimum thinking time appearance

function handleAIResponse(response: AIResponse) {
  const remaining = MIN_AI_DELAY_MS - response.thinkTimeMs;
  if (remaining > 0) {
    setTimeout(() => applyAIMove(response.move), remaining);
  } else {
    applyAIMove(response.move);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed depth minimax | Time-budgeted iterative deepening | Standard practice | Guarantees response time regardless of device speed |
| Pure random MCTS rollouts | Heuristic-guided rollouts | ~2015+ | Critical for asymmetric games like tiger-goat |
| Comlink for worker RPC | Raw postMessage (simple cases) | Ongoing | For single request/response, raw postMessage is simpler; Comlink better for complex APIs |
| `?worker` import suffix | `new URL()` + `import.meta.url` | Vite recommendation | Standards-aligned, better for TypeScript |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | vite.config.ts (test section) |
| Quick run command | `npx vitest run src/engine/ai/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | Worker keeps UI responsive | manual-only | Manual: verify no jank during AI think | N/A |
| AI-02 | Eval function scores correctly | unit | `npx vitest run src/engine/ai/eval.test.ts -x` | Wave 0 |
| AI-03 | MCTS returns legal moves | unit | `npx vitest run src/engine/ai/mcts.test.ts -x` | Wave 0 |
| AI-04 | Minimax returns legal moves | unit | `npx vitest run src/engine/ai/minimax.test.ts -x` | Wave 0 |
| AI-05 | 4 difficulty configs exist | unit | `npx vitest run src/engine/ai/index.test.ts -x` | Wave 0 |
| AI-06 | Hard < 2s | unit | `npx vitest run src/engine/ai/timing.test.ts -x` | Wave 0 |
| AI-07 | Expert < 5s | unit | `npx vitest run src/engine/ai/timing.test.ts -x` | Wave 0 |
| AI-08 | Setup screen renders | smoke | `npx vitest run src/components/SetupScreen/ -x` | Wave 0 |
| AI-09 | AI delay present | unit | Part of useAIGame tests | Wave 0 |
| AI-10 | Undo steps back AI+human pair | unit | `npx vitest run src/hooks/useAIGame.test.ts -x` | Wave 0 |
| AI-11 | Difficulty ranking via self-play | integration | `npx vitest run src/engine/ai/selfplay.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/engine/ai/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before verify-work

### Wave 0 Gaps
- [ ] `src/engine/ai/eval.test.ts` -- covers AI-02
- [ ] `src/engine/ai/mcts.test.ts` -- covers AI-03
- [ ] `src/engine/ai/minimax.test.ts` -- covers AI-04
- [ ] `src/engine/ai/index.test.ts` -- covers AI-05
- [ ] `src/engine/ai/timing.test.ts` -- covers AI-06, AI-07
- [ ] `src/engine/ai/selfplay.test.ts` -- covers AI-11
- [ ] `src/hooks/useAIGame.test.ts` -- covers AI-09, AI-10 (needs jsdom environment)
- [ ] vite.config.ts test environment may need `jsdom` for component tests (currently `node`)

## Open Questions

1. **Eval weight tuning iteration budget**
   - What we know: Weights need tuning through self-play; initial guesses will be rough
   - What's unclear: How many tuning iterations needed to get ranked difficulty levels correct
   - Recommendation: Start with weights from Bagh Chal research (capture dominant), validate with 50-game self-play batches per difficulty pair. Budget 2-3 tuning rounds.

2. **MCTS simulation counts on mobile**
   - What we know: TECH-SPEC lists 100K sims for Expert; mobile CPUs are 3-5x slower
   - What's unclear: Actual achievable sim count within 5s on mid-range mobile
   - Recommendation: Use time budget as primary constraint, sim count as secondary cap. Profile with Chrome DevTools 4x CPU throttle.

3. **Placement-to-movement algorithm transition**
   - What we know: MCTS for placement, minimax for movement
   - What's unclear: Exact cutoff -- switch when `goatsInPool === 0`, or switch earlier when branching factor drops?
   - Recommendation: Switch at phase transition (`goatsInPool === 0`). Simpler, matches engine phases, avoids edge cases.

## Sources

### Primary (HIGH confidence)
- Vite documentation on Web Workers: `new Worker(new URL(...))` syntax confirmed as recommended approach
- Existing engine codebase: JSON-serializable state, functional API verified by reading all source files
- TECH-SPEC.md: AI architecture, difficulty parameters, eval function design

### Secondary (MEDIUM confidence)
- [Bagh Chal Wikipedia](https://en.wikipedia.org/wiki/Bagh-Chal) - Similar game AI approaches, minimax with alpha-beta standard
- [basnetsoyuj/baghchal](https://github.com/basnetsoyuj/baghchal) - Python minimax implementation for related game
- [MCTS Wikipedia](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search) - UCB1, rollout strategies
- [Chessprogramming - Iterative Deepening](https://www.chessprogramming.org/Iterative_Deepening) - Time management, transposition tables
- [Comlink](https://github.com/GoogleChromeLabs/comlink) - Evaluated and rejected for this use case (overkill)
- [Vite Web Workers](https://vite.dev/guide/features) - Worker import syntax

### Tertiary (LOW confidence)
- MCTS simulation count targets from TECH-SPEC may need significant adjustment for mobile performance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No external deps needed; Vite worker support is well-documented
- Architecture: HIGH - Engine API is clean and ready; patterns are textbook game AI
- Eval function: MEDIUM - Weight tuning requires iteration; initial design is sound but untested
- Pitfalls: HIGH - Well-known issues in asymmetric game AI literature

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable domain, no fast-moving deps)
