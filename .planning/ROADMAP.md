# Roadmap: Pulijoodam

## Overview

Pulijoodam goes from zero to deployed web app in 5 phases. Phase 1 validates the riskiest unknowns (WASM + flutter_rust_bridge + GitHub Pages pipeline) with a trivial hello-world before any game logic exists. Phase 2 builds the complete Rust game engine and AI in isolation, testable with `cargo test`. Phase 3 wires Rust to Flutter through the FFI bridge and delivers a playable game with core board interaction. Phase 4 adds the polish that makes the game feel complete: themes, audio, persistence, animations, and drag interaction. Phase 5 delivers the differentiators that separate Pulijoodam from every competitor: interactive tutorial, accessibility, and responsive layout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scaffold & Pipeline** - WASM/FFI hello-world deployed to GitHub Pages with CI/CD
- [ ] **Phase 2: Rust Engine & AI** - Complete game rules and AI opponents, tested in isolation
- [ ] **Phase 3: Playable Game** - FFI bridge + Flutter UI delivers a working game on screen
- [ ] **Phase 4: Game Polish** - Themes, audio, persistence, capture animations, drag interaction
- [ ] **Phase 5: Tutorial & Accessibility** - Interactive tutorial, accessibility, responsive layout

## Phase Details

### Phase 1: Scaffold & Pipeline
**Goal**: A trivial Rust function is callable from Flutter web via WASM and deployed to GitHub Pages with CI/CD -- proving the entire deployment pipeline works before any game logic investment
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria** (what must be TRUE):
  1. A Flutter web app at the GitHub Pages URL calls a Rust function compiled to WASM and displays its return value on screen
  2. Pushing to main triggers a GitHub Actions workflow that builds and deploys the app without manual intervention
  3. The deployed app loads successfully in Chrome and Firefox (cross-origin isolation via coi-serviceworker is working)
  4. A Rust panic in the WASM module logs a readable stack trace to the browser console instead of an opaque "unreachable" error
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Rust Engine & AI
**Goal**: The complete Pulijoodam rule engine and AI system exist as tested Rust crates -- every rule, capture mechanic, win condition, and AI difficulty level works, validated by cargo test suites
**Depends on**: Phase 1
**Requirements**: ENGINE-01, ENGINE-02, ENGINE-03, ENGINE-04, ENGINE-05, ENGINE-06, ENGINE-07, ENGINE-08, ENGINE-09, ENGINE-10, ENGINE-11, ENGINE-12, ENGINE-13, ENGINE-14, AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09
**Success Criteria** (what must be TRUE):
  1. A cargo test suite exercises full game scenarios (placement phase through movement phase through win/draw) for both Andhra and Tamil rule presets, with all tests passing
  2. The AI produces legal moves at all 4 difficulty levels for both placement and movement phases, verified by engine validation in tests
  3. Hard AI completes a move in under 2 seconds and Expert AI in under 5 seconds, measured by benchmark tests on the target architecture
  4. Undo/redo correctly reverses and replays arbitrary move sequences, verified by property-based tests
  5. The engine API accepts typed Commands and returns typed Events with no mutable state leaking across the API boundary
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: Playable Game
**Goal**: A human can play a complete game of Pulijoodam against the AI in a browser -- placing goats, moving pieces, seeing captures, and reaching a win/loss/draw result screen
**Depends on**: Phase 2
**Requirements**: FFI-01, FFI-02, FFI-03, FFI-04, BOARD-01, BOARD-02, BOARD-03, BOARD-05, BOARD-06, BOARD-07, BOARD-10, BOARD-11, BOARD-13, APP-01, APP-02, APP-03
**Success Criteria** (what must be TRUE):
  1. A user can start a new game from the home screen, choose role (Tiger/Goat/Random), difficulty, and rule preset, then see the board rendered with all 23 nodes and connecting lines
  2. A user can tap a piece and tap a destination to move it, with valid destinations highlighted and illegal moves rejected with visual feedback
  3. The AI responds to each player move with an animated move of its own, with a brief thinking delay that feels natural
  4. A completed game displays a result screen showing win/loss/draw with goats captured and moves played, with an option to play again
  5. AI computation runs in a WebWorker and never freezes the browser UI, even at Expert difficulty
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Game Polish
**Goal**: The game feels complete and satisfying -- pieces have weight through animations and sound, progress is never lost through auto-save, and visual themes give the game personality
**Depends on**: Phase 3
**Requirements**: BOARD-04, BOARD-08, BOARD-09, THEME-01, THEME-02, THEME-03, THEME-04, AUDIO-01, AUDIO-02, AUDIO-03, AUDIO-04, AUDIO-05, AUDIO-06, AUDIO-07, PERSIST-01, PERSIST-02, PERSIST-03, APP-04
**Success Criteria** (what must be TRUE):
  1. A user can drag a piece to its destination with the piece following their finger and snapping to valid nodes
  2. Capturing a goat plays a bounce/pop animation with particle burst, accompanied by a capture sound effect; chain-hops animate sequentially
  3. The user can switch between Traditional (stone/earthy) and Modern (clean geometric) themes in settings, with the choice persisting across sessions
  4. All game sounds play on piece placement, movement, capture, win/loss/draw, and illegal move; the user can mute/unmute all sounds from settings
  5. Closing the browser mid-game and reopening it resumes the exact game state, including rule preset, player role, and full move history
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Tutorial & Accessibility
**Goal**: A first-time player can learn Pulijoodam through guided lessons, and the game is usable by players with accessibility needs across all screen sizes
**Depends on**: Phase 4
**Requirements**: TUTOR-01, TUTOR-02, TUTOR-03, TUTOR-04, TUTOR-05, BOARD-12
**Success Criteria** (what must be TRUE):
  1. On first app launch, the user is prompted to start the tutorial; they can accept or skip it
  2. A user completing all 3 tutorial lessons understands board structure, piece placement, movement, captures, chain-hops, and win/loss/draw conditions through guided interaction with highlighted targets and brief text overlays
  3. The board renders correctly and remains playable across phone, tablet, and desktop screen sizes and aspect ratios
  4. All interactive elements meet 44x44pt minimum touch targets, and the game is navigable with a screen reader
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold & Pipeline | 0/? | Not started | - |
| 2. Rust Engine & AI | 0/? | Not started | - |
| 3. Playable Game | 0/? | Not started | - |
| 4. Game Polish | 0/? | Not started | - |
| 5. Tutorial & Accessibility | 0/? | Not started | - |
