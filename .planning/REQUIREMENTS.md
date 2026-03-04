# Requirements: Pulijoodam

**Defined:** 2026-03-04
**Core Value:** A human can play a complete, rules-correct game of Pulijoodam against a strong AI opponent in a browser — no install, no server, no account.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Engine

- [ ] **ENG-01**: Board topology represents 23 nodes with coordinates, adjacency lists, and derived jump paths
- [ ] **ENG-02**: Game state tracks board positions, phase, turn, goat pool, captures, and chain-hop progress
- [ ] **ENG-03**: Move generation produces all legal moves for current player (placement and movement)
- [ ] **ENG-04**: Move validation rejects illegal moves with clear error reason
- [ ] **ENG-05**: Capture mechanics support single jump and chain-hop (Andhra preset)
- [ ] **ENG-06**: Phase transitions from placement to movement when all 15 goats are placed
- [ ] **ENG-07**: Tiger win detection when 10+ goats captured (< 6 remaining)
- [ ] **ENG-08**: Goat win detection when all tigers are immobilized
- [ ] **ENG-09**: Draw detection via threefold repetition (same board state + turn 3 times)
- [ ] **ENG-10**: Draw detection via 50 consecutive captureless moves
- [ ] **ENG-11**: Undo/redo support via move history stack
- [ ] **ENG-12**: Engine has zero UI dependencies — pure TypeScript, functional API, immutable state
- [ ] **ENG-13**: Engine unit tests cover topology, moves, captures, chain-hops, win/draw, and phase transitions

### Board

- [ ] **BRD-01**: SVG board renders 23 nodes at correct positions with connecting edges
- [ ] **BRD-02**: Tiger and goat pieces render distinctly on the board
- [ ] **BRD-03**: Tap-tap interaction: tap piece/node to select, tap destination to move/place
- [ ] **BRD-04**: Legal move highlighting shows valid destinations on piece/node selection
- [ ] **BRD-05**: Turn indicator clearly shows whose turn it is
- [ ] **BRD-06**: Goat pool counter shows remaining goats to place
- [ ] **BRD-07**: Captured goat counter shows number of goats captured
- [ ] **BRD-08**: Game over screen displays result (Tiger wins / Goat wins / Draw) with replay option
- [ ] **BRD-09**: Responsive layout scales correctly on mobile, tablet, and desktop
- [ ] **BRD-10**: Touch targets meet minimum 44x44px on mobile devices

### AI

- [ ] **AI-01**: AI runs in a Web Worker to keep UI responsive
- [ ] **AI-02**: Heuristic evaluation function scores positions from tiger perspective
- [ ] **AI-03**: MCTS algorithm for placement phase (high branching factor)
- [ ] **AI-04**: Minimax with alpha-beta pruning for movement phase
- [ ] **AI-05**: 4 difficulty levels: Easy, Medium, Hard, Expert
- [ ] **AI-06**: Hard difficulty completes moves in < 2 seconds
- [ ] **AI-07**: Expert difficulty completes moves in < 5 seconds
- [ ] **AI-08**: Game setup screen lets user choose role (Tiger/Goat) and difficulty
- [ ] **AI-09**: AI move has brief delay for natural feel (not instant)
- [ ] **AI-10**: Undo/redo available in AI games
- [ ] **AI-11**: AI self-play validation confirms difficulty levels are correctly ranked

### Polish

- [ ] **POL-01**: Piece slide animations via CSS transitions on SVG transforms
- [ ] **POL-02**: Capture animation (tiger jump arc, goat removal effect)
- [ ] **POL-03**: Chain-hop sequential animation plays captures in order
- [ ] **POL-04**: Placement drop-in animation for goats
- [ ] **POL-05**: Sound effects for place, slide, capture, win/loss, and illegal move
- [ ] **POL-06**: Sound toggle in settings (on/off)
- [ ] **POL-07**: Two visual themes: Traditional (stone/earth tones) and Modern (clean/geometric)
- [ ] **POL-08**: Theme toggle in settings
- [ ] **POL-09**: Settings persistence via localStorage

### Tutorial

- [ ] **TUT-01**: Lesson 1 — Board & Placement: guided goat placement explaining turns
- [ ] **TUT-02**: Lesson 2 — Movement & Captures: pre-set board demonstrating jumps
- [ ] **TUT-03**: Lesson 3 — Winning & Losing: trap tigers, show both win conditions
- [ ] **TUT-04**: Forced move sequences with highlighted targets
- [ ] **TUT-05**: Brief text overlays (2-3 sentences per step)
- [ ] **TUT-06**: Skip option for experienced players
- [ ] **TUT-07**: First-launch prompt ("New to Pulijoodam?")

### History

- [ ] **HIST-01**: Auto-save game to localStorage on every move (crash-safe)
- [ ] **HIST-02**: Resume interrupted games on app reopen
- [ ] **HIST-03**: Game history screen showing date, role, opponent, result, duration
- [ ] **HIST-04**: Replay mode with step forward/backward controls
- [ ] **HIST-05**: Timeline scrubber for replay navigation
- [ ] **HIST-06**: Auto-play replay at 1 move/second with pause

### Multiplayer

- [ ] **MP-01**: WebRTC data channel integration for P2P connection
- [ ] **MP-02**: Invite code generation (Base64-encoded SDP offer)
- [ ] **MP-03**: Join flow: paste offer, generate answer, copy back
- [ ] **MP-04**: Two-code exchange UX with copy buttons and paste fields
- [ ] **MP-05**: Game synchronization via command relay over data channel
- [ ] **MP-06**: Connection status indicator
- [ ] **MP-07**: Disconnect handling (offer "Continue vs AI" or "End game")
- [ ] **MP-08**: Undo disabled in P2P games

### Production

- [ ] **PROD-01**: Service worker for full offline support
- [ ] **PROD-02**: Drag-to-move interaction in addition to tap-tap
- [ ] **PROD-03**: Accessibility: screen reader move announcements
- [ ] **PROD-04**: Accessibility: color-blind safe piece design
- [ ] **PROD-05**: Accessibility: ARIA labels on interactive elements
- [ ] **PROD-06**: Performance: memoization and lazy loading where beneficial
- [ ] **PROD-07**: Responsive design audit across device sizes
- [ ] **PROD-08**: PWA manifest for mobile installability
- [ ] **PROD-09**: GitHub Pages deployment via GitHub Actions CI
- [ ] **PROD-10**: Total bundle size < 1MB (JS + assets)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Rule Variants

- **VAR-01**: Tamil rule preset (no chain-hops, 5-capture win threshold)
- **VAR-02**: Game variants (1T/3G, 4T/18G board sizes)

### Advanced Features

- **ADV-01**: Hints / move suggestions (highlight AI-recommended move)
- **ADV-02**: Post-game analysis with blunder detection
- **ADV-03**: Spectator mode for P2P games (read-only WebRTC connections)
- **ADV-04**: Share result card (emoji grid + outcome text, copyable)

### Platform

- **PLAT-01**: Rust engine port (WASM for web, NDK for Android)
- **PLAT-02**: Android app consuming Rust engine
- **PLAT-03**: Localization (Telugu, Tamil, Kannada)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts / login | Zero-server constraint; localStorage sufficient |
| Global leaderboard / ELO ratings | Requires backend + database + anti-cheat |
| Server-based matchmaking | Incompatible with GitHub Pages static hosting |
| Time controls / chess clocks | Casual cultural game, not competitive esport |
| In-game chat during P2P | Content moderation liability; players use own messaging |
| Endgame tablebases | Extreme complexity for marginal benefit |
| Animated tutorial videos | Violates < 1MB bundle target |
| Online multiplayer with server | Zero infrastructure constraint |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-01 | Phase 1 | Pending |
| ENG-02 | Phase 1 | Pending |
| ENG-03 | Phase 1 | Pending |
| ENG-04 | Phase 1 | Pending |
| ENG-05 | Phase 1 | Pending |
| ENG-06 | Phase 1 | Pending |
| ENG-07 | Phase 1 | Pending |
| ENG-08 | Phase 1 | Pending |
| ENG-09 | Phase 1 | Pending |
| ENG-10 | Phase 1 | Pending |
| ENG-11 | Phase 1 | Pending |
| ENG-12 | Phase 1 | Pending |
| ENG-13 | Phase 1 | Pending |
| BRD-01 | Phase 1 | Pending |
| BRD-02 | Phase 1 | Pending |
| BRD-03 | Phase 1 | Pending |
| BRD-04 | Phase 1 | Pending |
| BRD-05 | Phase 1 | Pending |
| BRD-06 | Phase 1 | Pending |
| BRD-07 | Phase 1 | Pending |
| BRD-08 | Phase 1 | Pending |
| BRD-09 | Phase 1 | Pending |
| BRD-10 | Phase 1 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| AI-04 | Phase 2 | Pending |
| AI-05 | Phase 2 | Pending |
| AI-06 | Phase 2 | Pending |
| AI-07 | Phase 2 | Pending |
| AI-08 | Phase 2 | Pending |
| AI-09 | Phase 2 | Pending |
| AI-10 | Phase 2 | Pending |
| AI-11 | Phase 2 | Pending |
| POL-01 | Phase 3 | Pending |
| POL-02 | Phase 3 | Pending |
| POL-03 | Phase 3 | Pending |
| POL-04 | Phase 3 | Pending |
| POL-05 | Phase 3 | Pending |
| POL-06 | Phase 3 | Pending |
| POL-07 | Phase 3 | Pending |
| POL-08 | Phase 3 | Pending |
| POL-09 | Phase 3 | Pending |
| TUT-01 | Phase 3 | Pending |
| TUT-02 | Phase 3 | Pending |
| TUT-03 | Phase 3 | Pending |
| TUT-04 | Phase 3 | Pending |
| TUT-05 | Phase 3 | Pending |
| TUT-06 | Phase 3 | Pending |
| TUT-07 | Phase 3 | Pending |
| HIST-01 | Phase 3 | Pending |
| HIST-02 | Phase 3 | Pending |
| HIST-03 | Phase 3 | Pending |
| HIST-04 | Phase 3 | Pending |
| HIST-05 | Phase 3 | Pending |
| HIST-06 | Phase 3 | Pending |
| MP-01 | Phase 4 | Pending |
| MP-02 | Phase 4 | Pending |
| MP-03 | Phase 4 | Pending |
| MP-04 | Phase 4 | Pending |
| MP-05 | Phase 4 | Pending |
| MP-06 | Phase 4 | Pending |
| MP-07 | Phase 4 | Pending |
| MP-08 | Phase 4 | Pending |
| PROD-01 | Phase 4 | Pending |
| PROD-02 | Phase 4 | Pending |
| PROD-03 | Phase 4 | Pending |
| PROD-04 | Phase 4 | Pending |
| PROD-05 | Phase 4 | Pending |
| PROD-06 | Phase 4 | Pending |
| PROD-07 | Phase 4 | Pending |
| PROD-08 | Phase 4 | Pending |
| PROD-09 | Phase 4 | Pending |
| PROD-10 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 74 total
- Mapped to phases: 74
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 — traceability populated after roadmap creation*
