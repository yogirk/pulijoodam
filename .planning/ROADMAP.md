# Roadmap: Pulijoodam

## Overview

Four phases deliver a complete, production-quality Pulijoodam game. The foundation phase establishes a rules-correct engine and playable board — everything else builds on it. AI is the primary use case and comes second. The experience layer (animations, tutorial, persistence) is phase three, once mechanics are stable. The final phase ships P2P multiplayer and full PWA installability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Engine + Board** - Rules-correct engine and playable local hot-seat game (completed 2026-03-04)
- [x] **Phase 2: AI Opponent** - Solo play against 4-difficulty AI in a Web Worker (completed 2026-03-06)
- [x] **Phase 3: Experience** - Animations, sound, tutorial, and game history/replay (completed 2026-03-06)
- [ ] **Phase 4: Multiplayer + PWA** - P2P online play and production hardening

## Phase Details

### Phase 1: Engine + Board
**Goal**: A human can play a complete, rules-correct game of Pulijoodam against another human on the same device
**Depends on**: Nothing (first phase)
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05, ENG-06, ENG-07, ENG-08, ENG-09, ENG-10, ENG-11, ENG-12, ENG-13, BRD-01, BRD-02, BRD-03, BRD-04, BRD-05, BRD-06, BRD-07, BRD-08, BRD-09, BRD-10
**Success Criteria** (what must be TRUE):
  1. Two players can play a full game from start to win/draw on any device without illegal moves being accepted
  2. All 23 board nodes render at correct positions with connecting edges, pieces are visually distinct, and legal destinations highlight on selection
  3. Chain-hop captures execute correctly — a tiger landing on a jump-capable square continues the chain until no further captures are available
  4. The game detects and announces all three outcomes: Tiger wins (10+ goats captured), Goat wins (all tigers immobilized), Draw (threefold repetition or 50 captureless moves)
  5. Undo is available and correctly restores the previous board state including chain-hop progress
**Plans**: 4 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, Tailwind v4, Vitest config, Wave 0 test stubs
- [ ] 01-02-PLAN.md — Engine core: types, board topology, state, moves, captures, chain-hop, win/draw, undo/redo
- [ ] 01-03-PLAN.md — Board UI: SVG board, useGame hook, HUD, game-over overlay, App wiring
- [ ] 01-04-PLAN.md — Engine tests: comprehensive unit tests for all ENG-* requirements

### Phase 2: AI Opponent
**Goal**: A human can play Pulijoodam against a computer opponent with meaningful difficulty progression
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10, AI-11
**Success Criteria** (what must be TRUE):
  1. The UI remains fully responsive while the AI is computing — no jank, scroll lockup, or input freeze
  2. Easy AI loses to a beginner player; Expert AI requires strategic effort to beat, confirming all four difficulty levels are correctly ranked
  3. Hard AI completes its move in under 2 seconds and Expert in under 5 seconds on a mid-range mobile device
  4. The game setup screen lets the user choose to play as Tiger or Goat and select a difficulty level before starting
  5. Undo is available in AI games and correctly steps back through AI moves as well as player moves
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — AI foundation: types, heuristic eval function, Web Worker shell, chooseMove placeholder
- [x] 02-02-PLAN.md — AI algorithms: MCTS for placement, Minimax+alpha-beta for movement, Zobrist hashing, time-budgeted iterative deepening
- [x] 02-03-PLAN.md — UI integration: useAIGame hook, SetupScreen, App routing, undo pairing, self-play difficulty validation

### Phase 3: Experience
**Goal**: The game feels polished and discoverable — new players can learn through a tutorial and returning players can replay their games
**Depends on**: Phase 2
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06, POL-07, POL-08, POL-09, TUT-01, TUT-02, TUT-03, TUT-04, TUT-05, TUT-06, TUT-07, HIST-01, HIST-02, HIST-03, HIST-04, HIST-05, HIST-06
**Success Criteria** (what must be TRUE):
  1. A player who has never heard of Pulijoodam can complete the three-lesson tutorial and understand placement, movement, chain-hop captures, and both win conditions
  2. Piece movements, captures, and chain-hop sequences play smooth animations; goat placement and capture have distinct visual effects
  3. Sound effects accompany every significant game event (place, slide, capture, win/loss, illegal move) and the sound toggle persists across sessions
  4. A player can navigate to game history, see past games listed with date/opponent/result, and replay any game step-by-step including auto-play
  5. An interrupted game automatically resumes when the app is reopened
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Themes, sound engine, and settings: CSS custom properties for two visual themes, Web Audio API sound synthesis, settings dropdown with persistence
- [ ] 03-02-PLAN.md — Animations: useAnimationQueue hook, piece slide/capture/placement transitions, chain-hop sequencing, game-over glow
- [ ] 03-03-PLAN.md — Tutorial: three-lesson guided gameplay, tutorial overlay, first-launch modal, settings menu entry
- [ ] 03-04-PLAN.md — History and replay: auto-save on every move, resume on reopen, history list, step/scrubber/auto-play replay viewer

### Phase 4: Multiplayer + PWA
**Goal**: Players can challenge a friend online with no server, and the app is installable and works offline
**Depends on**: Phase 3
**Requirements**: MP-01, MP-02, MP-03, MP-04, MP-05, MP-06, MP-07, MP-08, PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07, PROD-08, PROD-09, PROD-10
**Success Criteria** (what must be TRUE):
  1. Two players on different devices can start a game by exchanging two copy-paste codes with no account or server
  2. Disconnection during a P2P game offers the remaining player a clear choice to continue against AI or end the game
  3. The app loads and plays fully offline after the first visit, and can be installed to the home screen on iOS, Android, and desktop
  4. Screen reader users can follow and play the game through move announcements and ARIA labels; color-blind users can distinguish tigers from goats
  5. The total JS + assets bundle is under 1MB and the app passes a responsive layout audit across mobile, tablet, and desktop
**Plans**: TBD

Plans:
- [ ] 04-01: P2P multiplayer — WebRTC/PeerJS data channel, offer/answer exchange UX, move relay, disconnect handling
- [ ] 04-02: PWA and accessibility — service worker precaching, web app manifest, drag-to-move, screen reader announcements, color-blind safe design, ARIA labels
- [ ] 04-03: Production hardening — memoization, lazy loading, bundle size audit, responsive design audit, GitHub Pages CI deployment

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Engine + Board | 4/4 | Complete    | 2026-03-04 |
| 2. AI Opponent | 3/3 | Complete | 2026-03-06 |
| 3. Experience | 4/4 | Complete   | 2026-03-06 |
| 4. Multiplayer + PWA | 0/3 | Not started | - |
