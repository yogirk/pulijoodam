# Requirements: Pulijoodam

**Defined:** 2026-03-03
**Core Value:** A faithful, polished digital version of Pulijoodam with strong AI opponents — the game should feel like sitting across from a real opponent.

## v1 Requirements

Requirements for initial web release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: WASM/FFI scaffold — flutter_rust_bridge codegen generates Dart bindings from Rust, compiles to WASM, and runs in Flutter web
- [x] **INFRA-02**: GitHub Pages deployment — CI/CD pipeline builds and deploys Flutter web app with WASM engine to GitHub Pages on push to main
- [x] **INFRA-03**: Cross-origin isolation — coi-serviceworker injects COOP/COEP headers for WASM support on GitHub Pages
- [x] **INFRA-04**: Rust panic safety — console_error_panic_hook installed, zero-unwrap policy at FFI boundary, all FFI functions return Result

### Game Engine

- [ ] **ENGINE-01**: Board topology — 23-node graph with coordinate geometry, adjacency map, and auto-derived jump paths computed at init in <10ms
- [ ] **ENGINE-02**: Game state — tracks board positions, phase (placement/movement), current turn, goat pool/captured/on-board counts, chain-jump state
- [ ] **ENGINE-03**: Move validation — engine is sole authority on legality; validates turn order, piece ownership, destination reachability, phase constraints, chain-jump state
- [ ] **ENGINE-04**: Goat placement — goat player places one goat per turn onto any empty node during placement phase
- [ ] **ENGINE-05**: Piece movement — tigers and goats slide to adjacent empty nodes along board lines during movement phase
- [ ] **ENGINE-06**: Capture mechanics — tiger jumps over adjacent goat to empty landing node along collinear line; captured goat removed permanently
- [ ] **ENGINE-07**: Chain-hop support — after a capture, tiger may optionally continue jumping if another capture is available from the landing position (Andhra rules); player can end chain voluntarily
- [ ] **ENGINE-08**: Phase transition — placement phase ends when all 15 goats are placed; movement phase begins immediately
- [ ] **ENGINE-09**: Win detection — goats win when all 3 tigers have zero legal moves; tigers win when captured goat count reaches preset threshold
- [ ] **ENGINE-10**: Draw detection — threefold repetition of board state (tracked via state hashes) or 50 consecutive moves with zero captures
- [ ] **ENGINE-11**: Rule presets — Andhra (default: chain-hops allowed, 10-goat threshold) and Tamil (no chain-hops, 5-goat threshold) selectable at game creation
- [ ] **ENGINE-12**: Undo/redo — undo reverses last full turn (player + AI); unlimited depth; redo replays until new move discards redo stack
- [ ] **ENGINE-13**: Command/Event API — engine accepts typed Commands and returns typed Events; clean serialization boundary for FFI
- [ ] **ENGINE-14**: Illegal move feedback — engine returns IllegalMove event with human-readable reason string on rejected commands

### AI

- [ ] **AI-01**: MCTS for placement phase — Monte Carlo Tree Search handles high-branching goat placement decisions
- [ ] **AI-02**: Minimax for movement phase — Minimax with alpha-beta pruning for tactical movement/capture decisions
- [ ] **AI-03**: Heuristic evaluation function — scores positions from tiger perspective (captured goats, mobility, central control, immobilized tigers, goat formations, vulnerable goats)
- [ ] **AI-04**: Easy difficulty — MCTS 500 sims, Minimax depth 2, random selection among top-3 moves
- [ ] **AI-05**: Medium difficulty — MCTS 5,000 sims, Minimax depth 4, best move
- [ ] **AI-06**: Hard difficulty — MCTS 25,000 sims, Minimax depth 6 with iterative deepening, completes in <2s
- [ ] **AI-07**: Expert difficulty — MCTS 100,000 sims, Minimax depth 8+ with iterative deepening and transposition table, completes in <5s
- [ ] **AI-08**: AI thread isolation — AI computation runs in Dart Isolate/WebWorker on web, never blocks UI thread
- [ ] **AI-09**: AI always produces legal moves — verified by engine validation; illegal AI move is a bug

### FFI Bridge

- [ ] **FFI-01**: flutter_rust_bridge integration — Rust API surface annotated for FRB codegen; Dart receives typed async results
- [ ] **FFI-02**: WASM build target — engine compiles to wasm32-unknown-unknown; FRB handles WASM↔Dart interop
- [ ] **FFI-03**: Type marshalling — Rust structs/enums (GameState, Command, Event, LegalMove) map to idiomatic Dart types
- [ ] **FFI-04**: AI WebWorker dispatch — AI computation dispatched to separate WebWorker with its own WASM module instance

### Board & Interaction

- [ ] **BOARD-01**: Board rendering — CustomPainter draws 23-node triangle-over-grid board with lines and nodes; 3-layer architecture (static board, pieces, animations) with RepaintBoundary
- [ ] **BOARD-02**: Piece rendering — tigers and goats rendered as themed widgets overlaid on node positions
- [ ] **BOARD-03**: Tap-tap interaction — tap piece to select, tap destination to move; clear selection state indicator
- [ ] **BOARD-04**: Drag interaction — drag piece to destination, snap to valid nodes; visual feedback (piece follows finger, valid targets highlighted)
- [ ] **BOARD-05**: Valid move highlighting — when piece is selected, valid destination nodes glow/highlight
- [ ] **BOARD-06**: Last move indicator — source and destination of most recent move visually marked
- [ ] **BOARD-07**: Move validation feedback — illegal move attempt triggers visual shake and error sound
- [ ] **BOARD-08**: Capture animation — tiger arcs along jump path, goat bounces up with scale-up, particle burst at goat position, goat fades to captured counter; ~400ms total
- [ ] **BOARD-09**: Chain-hop animation — sequential jump animations with brief pause between each hop
- [ ] **BOARD-10**: AI move animation — AI moves animate with 300-800ms thinking delay before piece moves; slight delay randomization for natural feel
- [ ] **BOARD-11**: Game result screen — clear win/loss/draw display with goats captured, moves played, option to play again
- [ ] **BOARD-12**: Responsive layout — board scales correctly across screen sizes and aspect ratios
- [ ] **BOARD-13**: 60fps rendering — animations maintain 60fps; only animation layer repaints during movement

### Themes

- [ ] **THEME-01**: Traditional theme — stone/laterite board texture, carved circle nodes, bronze/gold tiger tokens, earth-tone goat stones, warm sandstone background, soft stone-on-stone sounds
- [ ] **THEME-02**: Modern theme — clean geometric lines, minimal dot nodes, flat amber tiger icon, flat green goat icon, light/dark neutral background, clean digital click sounds
- [ ] **THEME-03**: Theme switching — user toggles between themes in settings; choice persisted in local storage
- [ ] **THEME-04**: System theme adaptation — modern theme adapts to system light/dark preference

### Audio

- [ ] **AUDIO-01**: Place goat sound — soft tap/click on goat placement
- [ ] **AUDIO-02**: Slide piece sound — short slide/scrape on piece movement
- [ ] **AUDIO-03**: Capture sound — pop/bounce impact on goat capture
- [ ] **AUDIO-04**: Win sounds — gentle victory chime (goats win), dramatic low tone (tigers win)
- [ ] **AUDIO-05**: Draw sound — neutral tone on draw
- [ ] **AUDIO-06**: Illegal move sound — subtle error buzz
- [ ] **AUDIO-07**: Sound toggle — mute/unmute all sounds via settings; persisted in local storage

### Persistence

- [ ] **PERSIST-01**: Auto-save — game state saved to LocalStorage/IndexedDB on every move; crash-safe
- [ ] **PERSIST-02**: Resume game — interrupted AI games resume seamlessly on next app visit
- [ ] **PERSIST-03**: Save data — stores rule preset, player role, complete move history, timestamp

### Tutorial

- [ ] **TUTOR-01**: Lesson 1 — Board & Placement: empty board with labels, explain board structure, guide 3 goat placements, teach turn alternation
- [ ] **TUTOR-02**: Lesson 2 — Movement & Captures: pre-set mid-game board, guide goat move, show capture threat, demonstrate capture, demonstrate evasion, show chain-hop (Andhra)
- [ ] **TUTOR-03**: Lesson 3 — Winning & Losing: near-endgame positions, guide player to trap tiger, show victory, show tiger win scenario, explain both win conditions and draw rules
- [ ] **TUTOR-04**: Tutorial UX — forced move sequences with highlighted targets, brief text overlays (2-3 sentences), next/back navigation, skippable at any point
- [ ] **TUTOR-05**: First-launch prompt — on first app open, prompt "New to Pulijoodam? Start the tutorial?"

### App Screens

- [ ] **APP-01**: Home screen — app logo, Play vs AI button, Tutorial button, Settings button
- [ ] **APP-02**: Game setup screen — choose role (Tigers/Goats/Random), choose difficulty, choose rule preset (Andhra/Tamil)
- [ ] **APP-03**: Game board screen — board, status bar, captured goat counter, undo button (AI games only)
- [ ] **APP-04**: Settings screen — theme toggle, sound toggle, about/credits section with cultural context

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Persistence & Replay

- **REPLAY-01**: Game history screen — chronological list of completed games with date, role, opponent, result, duration, move count
- **REPLAY-02**: Replay mode — full board display with timeline scrubber, step forward/back, play/pause auto-advance
- **REPLAY-03**: Resume interrupted P2P games — only if opponent reconnects

### Multiplayer (v1.5)

- **P2P-01**: WebRTC data channel — peer-to-peer connection for game synchronization
- **P2P-02**: Invite code generation — Base64-encoded SDP offer/answer via copy-paste
- **P2P-03**: Game sync — commands relayed over data channel, both clients validate locally
- **P2P-04**: Disconnect handling — "Opponent disconnected" with Continue vs AI or End game options
- **P2P-05**: P2P lobby screen — generate/paste invite codes, connection status

### Accessibility

- **A11Y-01**: 44x44pt minimum touch targets for all interactive elements
- **A11Y-02**: High contrast mode support
- **A11Y-03**: Screen reader announcements for moves
- **A11Y-04**: Color-blind safe piece differentiation (shape/size, not just color)

### Other

- **LOC-01**: Localization — Telugu, Tamil, Kannada UI translations
- **VARIANT-01**: Game variants — 1-tiger/3-goat, 4-tiger/18-goat
- **STAT-01**: Player statistics/analytics
- **HINT-01**: Hints/move suggestions
- **ANALYSIS-01**: Post-game blunder detection
- **NOTATION-01**: Game notation format (PGN-like)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Android Play Store build | Web-first for v1; architecture supports it later |
| iOS app | Deferred v2+; Apple Developer Program cost ($99/year) |
| Online matchmaking server | v3; small niche audience makes matchmaking impractical |
| ELO rating system | v3; only meaningful with multiplayer |
| Time controls | Irrelevant for AI play; only matters for multiplayer |
| Adaptive AI difficulty | Fixed levels are honest and predictable; defer v2 |
| Achievements/badges | Distracts from meditative strategy nature; defer v2 |
| Puzzle/challenge mode | Requires curated content; defer v3 |
| In-app purchases/ads | $0, open source, cultural preservation project |
| Spectator UI | v2; Command/Event architecture supports it |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| ENGINE-01 | Phase 2 | Pending |
| ENGINE-02 | Phase 2 | Pending |
| ENGINE-03 | Phase 2 | Pending |
| ENGINE-04 | Phase 2 | Pending |
| ENGINE-05 | Phase 2 | Pending |
| ENGINE-06 | Phase 2 | Pending |
| ENGINE-07 | Phase 2 | Pending |
| ENGINE-08 | Phase 2 | Pending |
| ENGINE-09 | Phase 2 | Pending |
| ENGINE-10 | Phase 2 | Pending |
| ENGINE-11 | Phase 2 | Pending |
| ENGINE-12 | Phase 2 | Pending |
| ENGINE-13 | Phase 2 | Pending |
| ENGINE-14 | Phase 2 | Pending |
| AI-01 | Phase 2 | Pending |
| AI-02 | Phase 2 | Pending |
| AI-03 | Phase 2 | Pending |
| AI-04 | Phase 2 | Pending |
| AI-05 | Phase 2 | Pending |
| AI-06 | Phase 2 | Pending |
| AI-07 | Phase 2 | Pending |
| AI-08 | Phase 2 | Pending |
| AI-09 | Phase 2 | Pending |
| FFI-01 | Phase 3 | Pending |
| FFI-02 | Phase 3 | Pending |
| FFI-03 | Phase 3 | Pending |
| FFI-04 | Phase 3 | Pending |
| BOARD-01 | Phase 3 | Pending |
| BOARD-02 | Phase 3 | Pending |
| BOARD-03 | Phase 3 | Pending |
| BOARD-05 | Phase 3 | Pending |
| BOARD-06 | Phase 3 | Pending |
| BOARD-07 | Phase 3 | Pending |
| BOARD-10 | Phase 3 | Pending |
| BOARD-11 | Phase 3 | Pending |
| BOARD-13 | Phase 3 | Pending |
| APP-01 | Phase 3 | Pending |
| APP-02 | Phase 3 | Pending |
| APP-03 | Phase 3 | Pending |
| BOARD-04 | Phase 4 | Pending |
| BOARD-08 | Phase 4 | Pending |
| BOARD-09 | Phase 4 | Pending |
| THEME-01 | Phase 4 | Pending |
| THEME-02 | Phase 4 | Pending |
| THEME-03 | Phase 4 | Pending |
| THEME-04 | Phase 4 | Pending |
| AUDIO-01 | Phase 4 | Pending |
| AUDIO-02 | Phase 4 | Pending |
| AUDIO-03 | Phase 4 | Pending |
| AUDIO-04 | Phase 4 | Pending |
| AUDIO-05 | Phase 4 | Pending |
| AUDIO-06 | Phase 4 | Pending |
| AUDIO-07 | Phase 4 | Pending |
| PERSIST-01 | Phase 4 | Pending |
| PERSIST-02 | Phase 4 | Pending |
| PERSIST-03 | Phase 4 | Pending |
| APP-04 | Phase 4 | Pending |
| TUTOR-01 | Phase 5 | Pending |
| TUTOR-02 | Phase 5 | Pending |
| TUTOR-03 | Phase 5 | Pending |
| TUTOR-04 | Phase 5 | Pending |
| TUTOR-05 | Phase 5 | Pending |
| BOARD-12 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation*
