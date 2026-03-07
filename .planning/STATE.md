---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-03-PLAN.md
last_updated: "2026-03-07T03:06:04.841Z"
last_activity: "2026-03-07 — 03-03 complete: interactive tutorial with 3 lessons, first-launch modal, 18 new tests, 191 total passing"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 11
  completed_plans: 11
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** A human can play a complete, rules-correct game of Pulijoodam against a strong AI opponent in a browser — no install, no server, no account.
**Current focus:** Phase 3 — Experience Layer

## Current Position

Phase: 3 of 4 (Experience Layer)
Plan: 3 of 4 in current phase (03-03 complete)
Status: Executing phase 3
Last activity: 2026-03-07 — 03-03 complete: interactive tutorial with 3 lessons, first-launch modal, 18 new tests, 191 total passing

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 9 min
- Total execution time: 84 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-engine-board | 3/4 | 23 min | 8 min |
| 02-ai-opponent | 3/3 | 30 min | 10 min |
| 03-experience | 3/4 | 31 min | 10 min |

**Recent Trend:**
- Last 5 plans: 22 min, 10 min, 11 min, 7 min, 13 min
- Trend: stable

*Updated after each plan completion*
| Phase 02-ai-opponent P01 | 4 | 2 tasks | 7 files |
| Phase 02-ai-opponent P02 | 4 | 2 tasks | 7 files |
| Phase 02-ai-opponent P03 | 22 | 3 tasks | 7 files |
| Phase 03-experience P01 | 11 | 2 tasks | 21 files |
| Phase 03-experience P04 | 10 | 2 tasks | 12 files |
| Phase 03-experience P02 | 7 | 2 tasks | 7 files |
| Phase 03-experience P03 | 13 | 2 tasks | 13 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack: TypeScript + React 19 + Vite — non-negotiable
- Engine purity: zero UI imports in src/engine/ (Web Worker + Rust port compatibility)
- Rendering: SVG with React components (not Canvas) — accessibility and auto-scaling
- AI: MCTS for placement phase, Minimax+alpha-beta for movement phase
- Andhra preset only for v1: chain-hops allowed, 10-capture tiger win
- Hosting: GitHub Pages static SPA — no backend, no database
- ESLint v9 flat config (eslint.config.js) required — .eslintrc.cjs unsupported in ESLint 9
- Split tsconfig: tsconfig.app.json excludes tests; tsconfig.test.json adds vitest/globals types
- Engine purity ESLint rule excludes *.test.ts files (test files legitimately import testing utilities)
- [Phase 01-engine-board]: JUMP_MAP uses coordinate extrapolation + adjacency guard (not adjacency alone) — pure adjacency produces false positives on triangle section
- [Phase 01-engine-board]: History stack (GameState[]) lives in UI layer (useGame hook) — engine undo/redo are pure utilities, not stateful
- [Phase 01-engine-board]: getGameStatus inlines hasTigerMoves to avoid circular import with moves.ts
- [Phase 01-engine-board]: Goat placement auto-highlights all valid nodes (no tap-to-select needed) — goats have exactly one action type per turn; selection adds friction
- [Phase 01-engine-board]: GameScreen owns useGame() internally — AI phase will swap in a worker-aware hook variant without prop-drilling changes
- [Phase 02-ai-opponent]: Eval weights: captures*100, mobility*10, trapped*-80, vulnerable*15, walls*-5, centrality*3
- [Phase 02-ai-opponent]: chooseMove dispatches MCTS (placement) / minimax (movement) by game phase
- [Phase 02-ai-opponent]: Worker tests validate chooseMove directly (Vitest runs in Node, not browser)
- [Phase 02-ai-opponent]: ESLint worker globals pattern: *worker*.ts files get self, MessageEvent, postMessage
- [Phase 02-ai-opponent]: MCTS with UCB1 (C=1.4) and heuristic-weighted rollouts for placement phase
- [Phase 02-ai-opponent]: Negamax alpha-beta with iterative deepening and Zobrist transposition table for movement phase
- [Phase 02-ai-opponent]: Chain-hop continuations preserve search depth (same logical turn)
- [Phase 02-ai-opponent]: useAIGame hook uses separate AIGameScreen/LocalGameScreen components for conditional hook rendering
- [Phase 02-ai-opponent]: Self-play uses reduced test configs (50-400ms) to keep validation under 2 minutes
- [Phase 02-ai-opponent]: Paired undo in AI games: 2-step back normally, 1-step when AI moved first
- [Phase 03-experience]: CSS custom properties on :root/[data-theme] for all colors -- no hardcoded hex in components
- [Phase 03-experience]: useSettings.tsx uses .Provider pattern (not React 19 Context-as-JSX) for esbuild compatibility
- [Phase 03-experience]: happy-dom added for DOM-requiring hook tests (jsdom localStorage broken on opaque origins)
- [Phase 03-experience]: AudioEngine singleton with lazy AudioContext creation on first sound call
- [Phase 03-experience]: Traditional theme: warm stone/earth/brass tones; Modern theme: dark charcoal/cyan/amber tones
- [Phase 03-experience]: Anti-flicker inline script in index.html reads localStorage before React mounts
- [Phase 03-experience]: Store only moveHistory in localStorage, reconstruct GameState via engine replay
- [Phase 03-experience]: ReplayScreen pre-computes all state snapshots on mount for instant scrubbing
- [Phase 03-experience]: Resume modal overlays SetupScreen; user can dismiss to start fresh
- [Phase 03-experience]: Async/await with delay() for sequential animation event processing (testable with fake timers)
- [Phase 03-experience]: GoatPiece uses cx/cy attributes (not transform) for reliable CSS transitions on SVG circles
- [Phase 03-experience]: Combined inputDisabled flag (isAIThinking || isAnimating) gates all user interaction
- [Phase 03-experience]: Game over overlay gated by !animationState.isAnimating for automatic glow-then-overlay timing
- [Phase 03-experience]: Tutorial states built via engine move replay (replayMoves) to avoid invariant violations
- [Phase 03-experience]: Tutorial accessible from three entry points: first-launch modal, setup screen button, settings dropdown
- [Phase 03-experience]: TutorialContext manages lesson/step/gameState; flexible guidance accepts any valid move

### Pending Todos

None.

### Blockers/Concerns

- AI difficulty tuning: evaluation function weights require self-play validation in Phase 2 — budget iteration time
- MCTS goat bias: purely random rollouts undervalue goat play; heuristic-guided rollouts required (see SUMMARY.md Pitfall 6)
- P2P WebRTC: STUN-only fails for ~20-30% of users on symmetric NAT; document as known limitation in Phase 4
- PeerServer reliability: peerjs.com hosted server is outside project control; manual SDP exchange is primary UX

## Session Continuity

Last session: 2026-03-06T19:57:00Z
Stopped at: Completed 03-03-PLAN.md
Resume file: .planning/phases/03-experience/03-03-SUMMARY.md
