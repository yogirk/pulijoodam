---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-ai-opponent-01-PLAN.md
last_updated: "2026-03-06T14:14:05Z"
last_activity: "2026-03-06 — 02-01 complete: AI types, heuristic eval (6 factors), worker shell, 12 new tests, 78 total passing"
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 7
  completed_plans: 5
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** A human can play a complete, rules-correct game of Pulijoodam against a strong AI opponent in a browser — no install, no server, no account.
**Current focus:** Phase 2 — AI Opponent

## Current Position

Phase: 2 of 4 (AI Opponent)
Plan: 1 of 3 in current phase (02-01 complete)
Status: In progress
Last activity: 2026-03-06 — 02-01 complete: AI types, heuristic eval (6 factors), worker shell, 12 new tests, 78 total passing

Progress: [███████░░░] 71%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 7 min
- Total execution time: 27 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-engine-board | 3/4 | 23 min | 8 min |
| 02-ai-opponent | 1/3 | 4 min | 4 min |

**Recent Trend:**
- Last 5 plans: 6 min, 13 min, 4 min, 4 min
- Trend: stable

*Updated after each plan completion*
| Phase 02-ai-opponent P01 | 4 | 2 tasks | 7 files |

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
- [Phase 02-ai-opponent]: chooseMove is random placeholder -- MCTS/minimax dispatch added in Plan 02
- [Phase 02-ai-opponent]: Worker tests validate chooseMove directly (Vitest runs in Node, not browser)
- [Phase 02-ai-opponent]: ESLint worker globals pattern: *worker*.ts files get self, MessageEvent, postMessage

### Pending Todos

None.

### Blockers/Concerns

- AI difficulty tuning: evaluation function weights require self-play validation in Phase 2 — budget iteration time
- MCTS goat bias: purely random rollouts undervalue goat play; heuristic-guided rollouts required (see SUMMARY.md Pitfall 6)
- P2P WebRTC: STUN-only fails for ~20-30% of users on symmetric NAT; document as known limitation in Phase 4
- PeerServer reliability: peerjs.com hosted server is outside project control; manual SDP exchange is primary UX

## Session Continuity

Last session: 2026-03-06T14:14:05Z
Stopped at: Completed 02-ai-opponent-01-PLAN.md
Resume file: None
