# Pulijoodam

## What This Is

A web-based implementation of Pulijoodam (పులిజూదం), the traditional South Indian asymmetric strategy game where 3 Tigers face 15 Goats on a 23-node triangle-over-grid board. Ships as a static SPA on GitHub Pages with single-player AI, local multiplayer, P2P online play, tutorials, and game history.

## Core Value

A human can play a complete, rules-correct game of Pulijoodam against a strong AI opponent in a browser — no install, no server, no account.

## Requirements

### Validated

- ✓ Core game engine with board topology, move generation, capture mechanics, win/draw detection — Phase 1
- ✓ SVG board rendering with piece interaction (tap-tap) — Phase 1
- ✓ Local 2-player hot-seat mode — Phase 1
- ✓ AI opponent with 4 difficulty levels (MCTS placement + Minimax movement) — Phase 2
- ✓ Animations, sound effects, and visual themes — Phase 3
- ✓ Interactive tutorial for new players — Phase 3
- ✓ Game history, auto-save, and replay — Phase 3

### Active

- [ ] P2P multiplayer via WebRTC (zero server)
- [ ] Offline support (service worker / PWA)
- [ ] Accessibility (screen reader, color-blind safe, touch targets)
- [ ] Responsive design (mobile, tablet, desktop)

### Out of Scope

- Android/iOS native apps — web-first for v1, future Rust engine port enables mobile
- Tamil rule preset — deferred to later release
- Localization — English only for v1
- Game variants (1T/3G, 4T/18G) — Andhra preset only
- Online matchmaking / server — P2P only, no infrastructure
- ELO ratings — requires server + accounts
- Hints / move suggestions — future release
- Post-game analysis / blunder detection — future release
- Endgame tablebases — future release
- Time controls — casual play only
- Spectator mode — future release

## Context

- Pulijoodam is played across South India under various names (Puli Meka, Aadu Puli Aattam)
- Board is a 5-column × 5-row grid with a triangle above the top row, creating 23 intersection nodes
- Canonical rules are defined in `specs/game-rules.md` and board topology in `specs/board-graph.md`
- v1 uses Andhra preset: chain-hops allowed, tiger wins by capturing 10+ goats
- Engine is designed as pure TypeScript with zero UI deps — functional API with immutable state — to enable future Rust port
- AI uses hybrid search: MCTS for placement phase (high branching), Minimax+alpha-beta for movement phase
- AI runs in Web Worker to keep UI responsive
- Game state auto-saves to localStorage on every move

## Constraints

- **Tech stack**: TypeScript + React 19 + Vite — decided, not negotiable
- **Rendering**: SVG with React components — decided over Canvas for accessibility and simplicity
- **Hosting**: GitHub Pages (static files only) — no backend, no database
- **Bundle size**: < 1MB total (JS + assets) for fast load
- **AI performance**: Hard < 2s, Expert < 5s per move
- **Touch targets**: Minimum 44x44px for mobile play
- **Engine purity**: Zero UI dependencies in `src/engine/` — must be portable to Web Worker and future Rust port

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| TypeScript over Rust+Flutter | Ship faster as web SPA, Rust port later | — Pending |
| SVG over Canvas for board | Better accessibility, simpler React integration, auto-scaling via viewBox | — Pending |
| MCTS for placement, Minimax for movement | Matches branching factor characteristics of each phase | — Pending |
| Andhra preset only for v1 | Reduce scope, Tamil preset adds complexity | — Pending |
| WebRTC P2P over server multiplayer | Zero infrastructure cost, fits GitHub Pages constraint | — Pending |
| Functional engine API (immutable state) | Clean interface for Rust port, trivial undo/redo, no shared mutation bugs | — Pending |
| CSS custom properties for theming | Two themes (Traditional/Modern) via :root/[data-theme], anti-flicker inline script | ✓ Phase 3 |
| Web Audio API synthesis (no audio files) | Zero asset downloads, theme-specific tones, lazy AudioContext | ✓ Phase 3 |
| Engine replay for state reconstruction | Store only moveHistory in localStorage, reconstruct via replay — smaller, crash-safe | ✓ Phase 3 |

---
*Last updated: 2026-03-07 after Phase 3*
