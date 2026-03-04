# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** A human can play a complete, rules-correct game of Pulijoodam against a strong AI opponent in a browser — no install, no server, no account.
**Current focus:** Phase 1 — Engine + Board

## Current Position

Phase: 1 of 4 (Engine + Board)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-03-04 — Roadmap created, ready to begin Phase 1 planning

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- AI difficulty tuning: evaluation function weights require self-play validation in Phase 2 — budget iteration time
- MCTS goat bias: purely random rollouts undervalue goat play; heuristic-guided rollouts required (see SUMMARY.md Pitfall 6)
- P2P WebRTC: STUN-only fails for ~20-30% of users on symmetric NAT; document as known limitation in Phase 4
- PeerServer reliability: peerjs.com hosted server is outside project control; manual SDP exchange is primary UX

## Session Continuity

Last session: 2026-03-04
Stopped at: Roadmap created — Phase 1 ready to plan
Resume file: None
