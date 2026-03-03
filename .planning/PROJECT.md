# Pulijoodam

## What This Is

A digital implementation of the traditional South Indian asymmetric strategy game known as పులిజూదం (Telugu), ஆடு புலி ஆட்டம் (Tamil), and ಹುಲಿಘಟ್ಟ (Kannada). 3 Tigers vs 15 Goats on a distinctive triangle-over-grid board. A Rust game engine powers the logic, exposed to a Flutter web app via flutter_rust_bridge. Open source, completely free, no ads.

## Core Value

A faithful, polished digital version of Pulijoodam with strong AI opponents across 4 difficulty levels — the game should feel like sitting across from a real opponent.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Rust game engine with complete rule implementation (board topology, move validation, captures, chain-hops, phase transitions, win/draw detection)
- [ ] Two regional rule presets: Andhra (default, chain-hops allowed, 10-goat threshold) and Tamil (no chain-hops, 5-goat threshold)
- [ ] AI system: MCTS for placement phase, Minimax + alpha-beta for movement phase, 4 difficulty levels (Easy/Medium/Hard/Expert)
- [ ] Flutter web app with CustomPainter board rendering at 60fps
- [ ] Two visual themes: Traditional (stone/earthy) and Modern (clean geometric)
- [ ] Tap-tap and drag interaction for piece movement
- [ ] Capture animations (bounce/pop with particle burst)
- [ ] Sound effects (place, slide, capture, win/lose/draw, illegal move) with toggle
- [ ] Undo/redo in AI games (full turn: player move + AI response)
- [ ] 3-lesson interactive tutorial with guided board states
- [ ] Game auto-save and history with replay mode (timeline scrubber, step forward/back)
- [ ] flutter_rust_bridge FFI layer: Dart bindings, WASM build target for web
- [ ] Web deployment to GitHub Pages via GitHub Actions CI/CD
- [ ] Accessibility: 44x44pt touch targets, high contrast, screen reader support, color-blind safe

### Out of Scope

- P2P multiplayer via WebRTC — deferred to v1.5, architecture supports it
- Android Play Store build — deferred, web-first for v1
- iOS — deferred to v2+
- Localization (Telugu, Tamil, Kannada) — v2, architecture supports it
- Game notation format (PGN-like) — v2
- Spectator UI — v2
- Game variants (1T/3G, 4T/18G) — v2
- Player statistics/analytics — v2
- Hints/move suggestions — v2
- Post-game analysis (blunder detection) — v2
- Time controls — v2
- Adaptive AI difficulty — v2
- Achievements/badges — v2
- Online matchmaking server — v3
- ELO rating system — v3
- Puzzle/challenge mode — v3

## Context

- **Motivation:** Nostalgia for a village board game, cultural preservation of a traditional South Indian game that's fading from everyday life, and a learning vehicle for Rust, Flutter, and game AI.
- **Architecture:** Monorepo with `engine/` (Rust workspace: pulijoodam-core, pulijoodam-ffi, pulijoodam-cli) and `app/` (Flutter). Command/Event pattern for engine API — serializes naturally over FFI and future network layer.
- **Board geometry:** 23 nodes (4 triangle + 19 grid, with overlap). Jump paths auto-derived from coordinate geometry at engine init. Full graph defined in docs/board-graph.md.
- **AI approach:** Hybrid — MCTS for high-branching placement phase, Minimax + alpha-beta for tactical movement phase. AI runs on separate thread to keep UI at 60fps.
- **Learning project:** The journey matters. Rust, Flutter, and game AI are all being learned through building this.

## Constraints

- **Tech stack:** Rust engine + Flutter app + flutter_rust_bridge FFI — this is the stack, non-negotiable (learning goals)
- **Platform:** Web only for v1 (GitHub Pages, CanvasKit renderer, WASM engine)
- **Cost:** $0 — open source, GitHub Pages hosting, no server infrastructure
- **License:** MIT or Apache 2.0
- **Performance:** AI move < 2s at Hard, < 5s at Expert. Engine init < 10ms. App cold start < 2s.
- **Language:** English only for v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rust for engine | Learning goal + performance for AI computation + WASM target for web | — Pending |
| flutter_rust_bridge over hand-rolled FFI | Auto-generated bindings, WASM support, async Dart futures, rich type marshalling | — Pending |
| MCTS for placement, Minimax for movement | Placement has high branching (~20 options) favoring MCTS; movement is tactical favoring minimax | — Pending |
| Web-first, Android deferred | Fastest path to users (GitHub Pages, zero cost), Android can come later | — Pending |
| P2P multiplayer deferred to v1.5 | Solo AI experience is the core; P2P adds WebRTC complexity | — Pending |
| Command/Event engine API | Clean separation, serializes over FFI and future network, supports undo/replay naturally | — Pending |
| Jump paths auto-derived from geometry | Single source of truth (coordinates), avoids hand-coded lookup tables that drift from board definition | — Pending |

---
*Last updated: 2026-03-03 after initialization*
