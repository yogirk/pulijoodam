# Pulijoodam (పులిజూదం)

A modern web implementation of the traditional South Indian strategy board game **Puli Joodam** (పులిజూదం) — Tigers vs Goats. Three tigers hunt fifteen goats on a 23-node triangular board while goats try to immobilize them through strategic placement and movement.

**[Play now](https://puli.yogirk.dev/)**

---

## About the Game

Pulijoodam (also known as Aadu Puli Aatam in Tamil) is an asymmetric strategy game with deep roots in South Indian culture — historically played on temple floors and carved stone boards. One player controls 3 tigers, the other controls 15 goats.

### Rules

**Placement phase** — Goats go first. Each turn, a goat is placed on any empty node. Tigers can move to adjacent nodes or capture goats by jumping over them.

**Movement phase** — Once all 15 goats are placed, both sides move pieces to adjacent empty nodes. Tigers can still capture by jumping.

**Captures** — Tigers capture goats by jumping over them along a straight line to an empty node beyond. Chain-hops (multiple captures in one turn) are allowed.

**Winning** — Tigers win by capturing 10 goats. Goats win by immobilizing all 3 tigers so none can move. Draws occur on threefold position repetition or 50 consecutive moves without a capture.

### Board Topology

23 nodes arranged as an apex with 4 diagonal lines radiating through 4 horizontal levels. Tigers start at the apex and two adjacent nodes.

---

## Features

### Gameplay
- Complete Andhra rules implementation with chain-hop captures
- Play as Tigers or Goats against AI, local 2-player, or online P2P
- Undo/redo with full state history
- Draw detection (threefold repetition, 50-move rule)

### AI Opponent
- **Hybrid engine:** MCTS for placement phase (high branching factor), Minimax with alpha-beta pruning for movement phase
- **4 difficulty levels:** Easy, Medium, Hard, Expert
- Runs in a Web Worker — never blocks the UI
- Transposition tables, iterative deepening, move ordering, heuristic-weighted rollouts

### Peer-to-Peer Multiplayer
- WebRTC data channels — zero server, fully peer-to-peer
- Shareable invite codes (gzip-compressed SDP)
- Graceful disconnect handling with "continue vs AI" fallback

### Audio
- Procedural sound synthesis via Web Audio API — no audio files
- Theme-aware sounds (different timbres for Traditional vs Modern)
- 6 distinct effects: place, slide, capture, win, loss, illegal move

### Tutorial
- 3 guided lessons covering board layout, movement, captures, and strategy
- First-launch prompt for new players
- Step-by-step with highlighted nodes and guided moves

### Game History & Replay
- Auto-saves every move (up to 50 games in localStorage)
- Resume interrupted games
- Full replay with timeline scrubber and auto-play

### Progressive Web App
- Install on Android/iOS home screen
- Full offline play with cached assets
- Automatic service worker updates

### Accessibility
- Screen reader announcements via ARIA live regions
- Full keyboard navigation
- WCAG AA contrast ratios
- Pieces distinguishable by shape, not just color

### Themes
- **Traditional** — Amber accents, heritage aesthetic
- **Modern** — Purple/cyan accents, clean geometric style
- Theme persists across sessions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript |
| Build | Vite 6 + Tailwind CSS 4 |
| Board | SVG with CSS slide animations |
| Engine | Pure TypeScript (zero UI deps, Web Worker-compatible) |
| AI | MCTS + Minimax with alpha-beta, Zobrist hashing |
| Multiplayer | WebRTC data channels |
| Audio | Web Audio API (procedural synthesis) |
| PWA | vite-plugin-pwa |
| Testing | Vitest + React Testing Library |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Architecture

```
src/
├── engine/              # Pure TS game engine (no UI dependencies)
│   ├── board.ts         # 23-node graph topology, adjacency, jump map
│   ├── state.ts         # Immutable game state, initialization
│   ├── moves.ts         # Move generation, validation, application
│   ├── rules.ts         # Win/draw detection
│   ├── history.ts       # Undo/redo via state stack
│   └── ai/
│       ├── minimax.ts   # Alpha-beta with iterative deepening
│       ├── mcts.ts      # Monte Carlo Tree Search with UCB1
│       ├── eval.ts      # Positional evaluation heuristics
│       ├── zobrist.ts   # Zobrist hashing for transposition table
│       └── worker.ts    # Web Worker entry point
├── components/
│   ├── Board/           # SVG board, nodes, edges, piece shapes
│   ├── GameScreen/      # Main gameplay UI, overlays, indicators
│   ├── SetupScreen/     # Game setup, role/difficulty selection
│   └── Settings/        # Theme and sound controls
├── hooks/               # useGame, useAIGame, useAnimationQueue, useDrag
├── multiplayer/         # WebRTC, P2P protocol, host/join screens
├── audio/               # Procedural sound synthesis engine
├── tutorial/            # Guided lessons, first-launch modal
├── history/             # Game save/load, replay screen
├── theme/               # Theme definitions, CSS custom properties
└── pwa/                 # Install prompt
```

The game engine is a pure TypeScript library with an immutable, functional API — no React, no DOM, no side effects. This clean boundary supports future ports (e.g., Rust/WASM) and makes the engine fully testable in isolation.

---

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/yogirk/pulijoodam.git
cd pulijoodam
npm install
```

### Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm test             # Run test suite
npm run lint         # ESLint check
```

### Deployment

Every push to `main` triggers GitHub Actions: lint → test → build → deploy to GitHub Pages. The workflow runs as a single atomic job to prevent partial deployments.

---

## License

MIT
