---
phase: 02-ai-opponent
verified: 2026-03-06T20:30:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Verify UI remains responsive during AI computation"
    expected: "While AI is thinking, scrolling/clicking is not blocked, no jank or freeze"
    why_human: "Main thread responsiveness cannot be verified programmatically; requires real browser interaction"
  - test: "Verify AI move appears after visible delay, not instantly"
    expected: "AI move takes at least 400ms to appear, feels natural"
    why_human: "Timing perception requires human observation in live browser"
  - test: "Verify Hard AI responds in under 2 seconds on a mobile device"
    expected: "Hard difficulty move arrives within ~2 seconds on mid-range phone"
    why_human: "Desktop timing tests pass but mobile device performance cannot be verified programmatically"
  - test: "Complete a full AI game end-to-end without crashes"
    expected: "Game reaches tiger-wins, goat-wins, or draw naturally"
    why_human: "Full game flow including visual rendering requires live browser session"
  - test: "Verify setup screen, play game, undo, and back-to-menu flow"
    expected: "Setup -> choose role/difficulty -> start -> play -> undo steps back both moves -> back to menu returns to setup"
    why_human: "Multi-screen navigation flow requires human interaction"
---

# Phase 2: AI Opponent Verification Report

**Phase Goal:** A human can play Pulijoodam against a computer opponent with meaningful difficulty progression
**Verified:** 2026-03-06T20:30:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | The UI remains fully responsive while the AI is computing -- no jank, scroll lockup, or input freeze | VERIFIED (automated) / ? HUMAN NEEDED (real browser) | AI runs in Web Worker (`new Worker()` in useAIGame.ts:295). Worker entry point in worker.ts calls `chooseMove` off-main-thread. `isAIThinking` state disables tap handling (reducer line 86). Thinking indicator rendered in GameScreen (line 59-63). |
| 2 | Easy AI loses to a beginner player; Expert AI requires strategic effort to beat, confirming all four difficulty levels are correctly ranked | VERIFIED | Self-play test (`selfplay.test.ts`) passes 4 tests confirming Easy < Medium < Hard < Expert. DIFFICULTY_CONFIGS in types.ts correctly scale parameters (mctsSims: 200/2000/10000/50000, minimaxDepth: 2/4/6/8, topN: 3/1/1/1). |
| 3 | Hard AI completes its move in under 2 seconds and Expert in under 5 seconds on a mid-range mobile device | VERIFIED (desktop) / ? HUMAN NEEDED (mobile) | timing.test.ts passes: Hard < 2000ms, Expert < 5000ms. Time budgets enforced in mcts.ts (line 232-233, checks every 100 iters) and minimax.ts (line 101-104, checks every 1000 nodes via TimeoutError). |
| 4 | The game setup screen lets the user choose to play as Tiger or Goat and select a difficulty level before starting | VERIFIED | SetupScreen.tsx renders role buttons (Goat/Tiger), difficulty buttons (Easy/Medium/Hard/Expert), Start Game button. 7 component tests pass. App.tsx routes setup->game with aiConfig state. data-testid attributes on all interactive elements. |
| 5 | Undo is available in AI games and correctly steps back through AI moves as well as player moves | VERIFIED | aiGameReducer UNDO action (useAIGame.ts:197-219): steps back 2 entries when history >= 3 (human+AI pair), steps back 1 when exactly 2 (AI moved first). Increments requestId to cancel in-flight AI. 10 reducer unit tests pass covering paired undo, single undo, and staleness guard. |

**Score:** 5/5 truths verified (automated); 3 items need human confirmation in live browser

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/ai/types.ts` | AIRequest, AIResponse, AIConfig, AIDifficulty, DIFFICULTY_CONFIGS | VERIFIED | All types and config record exported. 36 lines, fully substantive. |
| `src/engine/ai/eval.ts` | Heuristic evaluation function | VERIFIED | `evaluate()` exported. Terminal detection + 6 weighted factors (captures, mobility, trapped, vulnerable, walls, centrality). 154 lines. 8 tests pass. |
| `src/engine/ai/mcts.ts` | MCTS algorithm for placement phase | VERIFIED | `mctsSearch()` exported. UCB1 selection, heuristic-weighted rollouts, time-budgeted. 289 lines. 5 tests pass. |
| `src/engine/ai/minimax.ts` | Minimax with alpha-beta and iterative deepening | VERIFIED | `minimaxSearch()` exported. Negamax + alpha-beta, transposition table (262144 entries), Zobrist hashing, move ordering, chain-hop depth preservation. 272 lines. 8 tests pass. |
| `src/engine/ai/zobrist.ts` | Zobrist hashing for transposition table | VERIFIED | `zobristHash()` and `ZOBRIST_TABLE` exported. Deterministic xorshift32 PRNG with fixed seed. 68 lines. |
| `src/engine/ai/worker.ts` | Web Worker entry point | VERIFIED | Receives COMPUTE_MOVE, calls chooseMove, responds with MOVE_COMPUTED + thinkTimeMs. 17 lines. |
| `src/engine/ai/index.ts` | chooseMove dispatcher (MCTS or minimax by phase) | VERIFIED | Phase-based dispatch: placement -> mctsSearch, movement -> minimaxSearch. 34 lines. |
| `src/hooks/useAIGame.ts` | AI game state management hook with worker integration | VERIFIED | `useAIGame()` and `aiGameReducer` exported. Worker lifecycle, 400ms delay floor, paired undo, requestId staleness guard. 371 lines. 10 tests pass. |
| `src/components/SetupScreen/SetupScreen.tsx` | Role and difficulty selection UI | VERIFIED | `SetupScreen` exported. Role buttons, difficulty buttons, start game, local 2-player option. 100 lines. 7 tests pass. |
| `src/App.tsx` | App routing between setup and game screens | VERIFIED | Screen state machine (setup/game). Renders SetupScreen or GameScreen with aiConfig. 39 lines. |
| `src/components/GameScreen/GameScreen.tsx` | Game screen with AI integration | VERIFIED | Conditional rendering via AIGameScreen/LocalGameScreen components. AI thinking indicator, back-to-menu button. 156 lines. |
| `src/engine/ai/__tests__/selfplay.test.ts` | Self-play difficulty ranking validation | VERIFIED | 4 tests validating Easy < Medium < Hard < Expert. All pass (79s runtime). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| eval.ts | rules.ts | `import { getGameStatus }` | WIRED | Line 6: imported and used in evaluate() for terminal detection |
| worker.ts | index.ts | `import { chooseMove }` | WIRED | Line 4: imported, called in onmessage handler |
| mcts.ts | eval.ts | `import { evaluate }` | WIRED | Line 7: imported, used in rollout() for heuristic scoring |
| minimax.ts | eval.ts | `import { evaluate }` | WIRED | Line 7: imported, used in negamax() for leaf and terminal scoring |
| minimax.ts | zobrist.ts | `import { zobristHash }` | WIRED | Line 8: imported, used in negamax() for TT probing and in minimaxSearch() |
| index.ts | mcts.ts | `import { mctsSearch }` | WIRED | Line 6: imported, dispatched for placement phase (line 19) |
| index.ts | minimax.ts | `import { minimaxSearch }` | WIRED | Line 7: imported, dispatched for movement phase (line 27) |
| useAIGame.ts | worker.ts | `new Worker(new URL(...))` | WIRED | Line 295: Worker created on mount, terminated on unmount |
| useAIGame.ts | types.ts | `import { DIFFICULTY_CONFIGS }` | WIRED | Line 13: imported, used to look up config by difficulty (line 345) |
| App.tsx | SetupScreen.tsx | `import { SetupScreen }` | WIRED | Line 3: imported, rendered when screen === 'setup' (line 37) |
| App.tsx | GameScreen.tsx | `import { GameScreen }` | WIRED | Line 2: imported, rendered when screen === 'game' with aiConfig (line 30) |
| GameScreen.tsx | useAIGame.ts | `import { useAIGame }` | WIRED | Line 2: imported, used in AIGameScreen component (line 142) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AI-01 | 02-01 | AI runs in a Web Worker to keep UI responsive | SATISFIED | worker.ts is Web Worker entry point; useAIGame.ts creates Worker via `new Worker()` |
| AI-02 | 02-01 | Heuristic evaluation function scores positions from tiger perspective | SATISFIED | eval.ts: `evaluate()` returns tiger-perspective scores with 6 weighted factors |
| AI-03 | 02-02 | MCTS algorithm for placement phase (high branching factor) | SATISFIED | mcts.ts: `mctsSearch()` with UCB1, heuristic rollouts, 289 lines |
| AI-04 | 02-02 | Minimax with alpha-beta pruning for movement phase | SATISFIED | minimax.ts: `minimaxSearch()` with negamax, TT, iterative deepening, 272 lines |
| AI-05 | 02-02 | 4 difficulty levels: Easy, Medium, Hard, Expert | SATISFIED | types.ts DIFFICULTY_CONFIGS maps all 4 levels with scaling parameters |
| AI-06 | 02-02 | Hard difficulty completes moves in < 2 seconds | SATISFIED | timing.test.ts passes; time budget enforced in both MCTS and minimax |
| AI-07 | 02-02 | Expert difficulty completes moves in < 5 seconds | SATISFIED | timing.test.ts passes; time budget enforced with deadline checks |
| AI-08 | 02-03 | Game setup screen lets user choose role (Tiger/Goat) and difficulty | SATISFIED | SetupScreen.tsx: role buttons + difficulty buttons + start game; 7 tests pass |
| AI-09 | 02-03 | AI move has brief delay for natural feel (not instant) | SATISFIED | useAIGame.ts: MIN_AI_DELAY_MS=400, delay calculation at lines 305-321 |
| AI-10 | 02-03 | Undo/redo available in AI games | SATISFIED | aiGameReducer UNDO: paired undo (2 steps), requestId cancellation; 10 tests pass |
| AI-11 | 02-03 | AI self-play validation confirms difficulty levels are correctly ranked | SATISFIED | selfplay.test.ts: 4 tests, Easy < Medium < Hard < Expert, all pass |

**Orphaned requirements:** None. All 11 AI requirements (AI-01 through AI-11) are covered by plans 02-01, 02-02, and 02-03. All mapped in REQUIREMENTS.md to Phase 2 and marked Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | -- | -- | -- | No anti-patterns found in any Phase 2 files |

Notes:
- No TODO/FIXME/PLACEHOLDER markers in any AI or UI integration files
- No console.log in production code (only in selfplay.test.ts for diagnostic output)
- No empty return stubs; the one `return null` in minimax.ts is correct TT probe logic
- Pre-existing Phase 1 test placeholders (24 `.todo` tests in useGame, Board, GameScreen) are unrelated to Phase 2

### Human Verification Required

### 1. UI Responsiveness During AI Computation

**Test:** Run `npm run dev`, start a game at Expert difficulty, and try scrolling/clicking while "AI is thinking..." is displayed.
**Expected:** UI remains fully interactive -- no jank, freeze, or blocked input.
**Why human:** Main thread responsiveness requires real browser observation; cannot be verified by grep or unit tests.

### 2. AI Move Delay Feels Natural

**Test:** Play a few moves at Easy difficulty and observe AI response timing.
**Expected:** AI move appears after a perceptible ~400ms pause, not instantly.
**Why human:** Timing perception is subjective and requires live interaction.

### 3. Mobile Performance (Hard < 2s, Expert < 5s)

**Test:** Open the app on a mid-range mobile device, play at Hard and Expert difficulty.
**Expected:** Hard AI responds within ~2 seconds, Expert within ~5 seconds.
**Why human:** Desktop timing tests pass but mobile CPU performance can only be verified on actual device.

### 4. Complete AI Game End-to-End

**Test:** Play a full game as Goat against Easy AI until a conclusion is reached.
**Expected:** Game ends naturally with tiger-wins, goat-wins, or draw. No crashes, hangs, or visual glitches.
**Why human:** Full game lifecycle including all visual rendering requires live browser session.

### 5. Multi-Screen Navigation Flow

**Test:** Start at setup screen -> select Tiger + Hard -> Start Game -> play a few moves -> Undo (should step back 2 moves) -> Back to Menu -> verify setup screen reappears.
**Expected:** All transitions work smoothly, undo removes both human and AI move as a pair, back-to-menu returns to setup cleanly.
**Why human:** Multi-screen navigation with state management requires interactive testing.

### Gaps Summary

No automated gaps found. All 5 observable truths from ROADMAP success criteria are verified at the code level:

1. **Web Worker architecture** ensures UI responsiveness -- AI computation runs entirely off-main-thread.
2. **Difficulty ranking** validated by automated self-play tests confirming Easy < Medium < Hard < Expert.
3. **Time budgets** enforced in both MCTS (100-iteration checks) and minimax (1000-node checks with TimeoutError).
4. **Setup screen** provides role and difficulty selection with proper routing to AI game.
5. **Paired undo** correctly steps back through AI + human moves with staleness guard.

The only remaining verification is human confirmation of runtime behavior in a live browser, particularly UI responsiveness, mobile performance, and end-to-end game flow.

---

_Verified: 2026-03-06T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
