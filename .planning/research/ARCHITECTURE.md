# Architecture Patterns

**Domain:** Rust game engine + Flutter web app (traditional board game)
**Researched:** 2026-03-03

## Recommended Architecture

### High-Level Overview

```
+-----------------------------------------------------------+
|                    Flutter Web App (Dart)                  |
|                                                           |
|  +------------------+  +--------------------+             |
|  | UI Layer         |  | State Management   |             |
|  | - CustomPainter  |  | - Riverpod         |             |
|  | - Animations     |  | - GameNotifier     |             |
|  | - Touch/Drag     |  | - SettingsNotifier  |             |
|  +--------+---------+  +--------+-----------+             |
|           |                      |                        |
|           v                      v                        |
|  +------------------------------------------------+      |
|  |          Bridge Service Layer (Dart)            |      |
|  |  - Command serialization                       |      |
|  |  - Event deserialization                        |      |
|  |  - Async dispatch (Isolate/WebWorker for AI)    |      |
|  +------------------------+-----------------------+      |
+---------------------------|---------------------------+
                            | FFI / WASM boundary
+---------------------------|---------------------------+
|                           v                           |
|  +------------------------------------------------+  |
|  |       pulijoodam-ffi (Rust FFI crate)          |  |
|  |  - flutter_rust_bridge annotated API           |  |
|  |  - Command dispatch                            |  |
|  |  - Event emission                              |  |
|  |  - Serialization boundary                      |  |
|  +------------------------+-----------------------+  |
|                           |                          |
|           +---------------+---------------+          |
|           v                               v          |
|  +------------------+          +------------------+  |
|  | pulijoodam-core  |          | pulijoodam-ai    |  |
|  | - Board topology |          | - MCTS (place)   |  |
|  | - Game state     |          | - Minimax (move)  |  |
|  | - Move valid.    |          | - Evaluation fn   |  |
|  | - Rules/Variants |          | - Difficulty      |  |
|  | - Undo/Redo      |          |   tuning          |  |
|  +------------------+          +------------------+  |
|                                                      |
|                  Rust Engine Workspace                |
+------------------------------------------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With | Language |
|-----------|---------------|-------------------|----------|
| `pulijoodam-core` | Board topology, game state, move validation, rules, capture logic, win/draw detection, undo/redo history | `pulijoodam-ai`, `pulijoodam-ffi` | Rust |
| `pulijoodam-ai` | MCTS placement engine, Minimax+AB movement engine, evaluation function, difficulty presets | `pulijoodam-core` (depends on core types) | Rust |
| `pulijoodam-ffi` | flutter_rust_bridge annotated API surface, command dispatch, event emission, serialization | `pulijoodam-core`, `pulijoodam-ai` | Rust |
| `pulijoodam-cli` | Debug/test CLI for engine (optional dev tool) | `pulijoodam-core`, `pulijoodam-ai` | Rust |
| Bridge Service | Dart-side FFI wrapper, command serialization, AI call orchestration | `pulijoodam-ffi` (via FFI/WASM) | Dart |
| State Management | Riverpod providers/notifiers, game state, UI state, settings | Bridge Service, UI Layer | Dart |
| UI Layer | CustomPainter board, animations, input handling, theming | State Management | Dart |

### Data Flow

#### Player Makes a Move

```
1. UI Layer: User taps node B (after selecting piece on A)
   |
2. State Management: GameNotifier receives tap event
   |
3. Bridge Service: Constructs MoveCommand { from: A, to: B }
   |
4. FFI boundary: Serialized command crosses to Rust
   |
5. pulijoodam-ffi: Dispatches command to core
   |
6. pulijoodam-core: Validates move, applies to state, returns events:
   [PieceMoved { from: A, to: B },
    PieceCaptured { position: C, piece: Goat },
    PhaseChanged { to: Movement }]
   |
7. pulijoodam-ffi: Serializes events back across FFI
   |
8. Bridge Service: Deserializes events, forwards to state
   |
9. State Management: GameNotifier applies events, updates state
   |
10. UI Layer: Rebuilds board, triggers animations for each event
```

#### AI Computes a Move

```
1. State Management: After player move events applied, triggers AI turn
   |
2. Bridge Service: Calls computeAiMove(gameState, difficulty) — ASYNC
   |  (On native: Rust spawns thread internally)
   |  (On WASM: Dispatched to Dart Isolate/WebWorker wrapping WASM)
   |
3. pulijoodam-ffi -> pulijoodam-ai: Runs MCTS or Minimax
   |
4. Returns: AiMoveComputed { command: MoveCommand { from: X, to: Y } }
   |
5. Bridge Service: Receives result, dispatches as command (same as player)
   |
6. pulijoodam-core: Validates and applies, returns events
   |
7. (Same flow as player move from step 7 onward)
```

## Rust Workspace Layout

**Confidence: HIGH** (standard Rust workspace patterns, well-documented)

```
engine/
  Cargo.toml              # Workspace root
  crates/
    pulijoodam-core/
      Cargo.toml
      src/
        lib.rs
        board.rs           # Board topology, 23-node graph, coordinate system
        game.rs            # GameState, phase transitions, turn management
        rules.rs           # RuleSet trait, Andhra/Tamil variants
        moves.rs           # Move validation, capture detection, chain-hops
        command.rs         # Command enum (PlacePiece, MovePiece, Undo, Redo, NewGame)
        event.rs           # Event enum (PiecePlaced, PieceMoved, PieceCaptured, ...)
        history.rs         # Move history stack for undo/redo/replay
        types.rs           # Node, Position, Piece, Player, Phase enums
    pulijoodam-ai/
      Cargo.toml
      src/
        lib.rs
        mcts.rs            # Monte Carlo Tree Search for placement phase
        minimax.rs         # Minimax + alpha-beta pruning for movement phase
        eval.rs            # Board evaluation / heuristic function
        difficulty.rs      # Difficulty presets (depth limits, time limits, randomness)
    pulijoodam-ffi/
      Cargo.toml
      src/
        lib.rs
        api/
          game_api.rs      # flutter_rust_bridge annotated public API
          types_api.rs     # FFI-friendly type wrappers
    pulijoodam-cli/        # Optional: dev/debug tool
      Cargo.toml
      src/
        main.rs
```

**Workspace Cargo.toml:**

```toml
[workspace]
resolver = "2"
members = ["crates/*"]

[workspace.package]
version = "0.1.0"
edition = "2024"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
rand = "0.8"
```

**Rationale for core/ai/ffi split:**
- `core` is pure game logic with zero FFI dependencies -- testable in isolation, usable from CLI
- `ai` depends on `core` types but is a separate compilation unit -- AI algorithm changes do not recompile core
- `ffi` depends on both and is the only crate with `flutter_rust_bridge` dependency -- keeps the bridge boundary thin
- This split means `core` and `ai` can be tested with standard `cargo test` with no FFI toolchain needed

## Command/Event Pattern

**Confidence: HIGH** (well-established game programming pattern, documented extensively)

The Command/Event pattern is the central architectural decision. It provides:

1. **Clean FFI boundary**: Commands and Events are simple enums that serialize naturally
2. **Undo/Redo for free**: History is a stack of (Command, Vec<Event>) pairs; undo replays inverse events
3. **Replay support**: Stored command sequence recreates any game state
4. **Future network layer**: Commands serialize identically over WebRTC as over FFI

### Command Enum (Dart sends to Rust)

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum GameCommand {
    NewGame { rule_set: RuleVariant, player_side: PlayerSide },
    PlacePiece { node: NodeId },
    MovePiece { from: NodeId, to: NodeId },
    Undo,
    Redo,
    RequestAiMove { difficulty: Difficulty },
    Resign,
}
```

### Event Enum (Rust sends to Dart)

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum GameEvent {
    GameStarted { rule_set: RuleVariant, board: BoardState },
    PiecePlaced { node: NodeId, piece: Piece },
    PieceMoved { from: NodeId, to: NodeId, piece: Piece },
    PieceCaptured { node: NodeId, piece: Piece },
    ChainHopContinued { from: NodeId, to: NodeId },
    PhaseChanged { phase: GamePhase },
    TurnChanged { player: Player },
    AiMoveComputed { command: Box<GameCommand>, thinking_time_ms: u32 },
    GameOver { result: GameResult },
    IllegalMove { reason: String },
    StateRestored { board: BoardState, move_number: u32 },
    Error { message: String },
}
```

### Dispatch Pattern in FFI Layer

```rust
// In pulijoodam-ffi/src/api/game_api.rs
use flutter_rust_bridge::frb;

/// Process a game command and return resulting events.
/// On WASM: runs synchronously on main thread (fast commands).
#[frb(sync)]
pub fn execute_command(state: &mut GameState, command: GameCommand) -> Vec<GameEvent> {
    state.dispatch(command)
}

/// Compute AI move asynchronously.
/// On native: runs on Rust thread pool.
/// On WASM: caller (Dart) should invoke from Isolate/WebWorker.
pub fn compute_ai_move(
    state: &GameState,
    difficulty: Difficulty,
) -> GameCommand {
    let ai = AiEngine::new(difficulty);
    ai.compute_move(state)
}
```

## flutter_rust_bridge Integration

**Confidence: MEDIUM** (v2 API is stable but WASM edge cases evolving; verified with official docs and GitHub issues)

### FFI Crate Setup

The `pulijoodam-ffi` crate is the sole bridge surface. flutter_rust_bridge v2 codegen scans `src/api/*.rs` files for public functions and generates Dart bindings.

**Key Configuration (flutter_rust_bridge.yaml):**

```yaml
rust_input: crate::api
rust_root: engine/crates/pulijoodam-ffi
dart_output: lib/src/bridge
```

### Sync vs Async Strategy

For WASM compatibility, use a dual strategy:

| Function Type | Native Behavior | WASM Behavior | Annotation |
|---------------|----------------|---------------|------------|
| Game commands (fast) | Async (thread pool) | Sync (main thread) | `#[frb(sync)]` |
| AI computation (slow) | Async (Rust thread) | Dart-side WebWorker | Regular `pub fn` |
| State queries | Sync | Sync | `#[frb(sync)]` |

**Critical WASM insight:** On WASM, `std::thread::spawn` is unavailable. Game commands (move validation, state updates) are fast enough (<1ms) to run synchronously on the main thread. AI computation (potentially seconds) must be offloaded on the Dart side using Isolate/WebWorker patterns, not Rust-side threading.

### Type Marshalling

flutter_rust_bridge v2 handles enum translation well. Use simple enums and structs at the FFI boundary:

```rust
// FFI-friendly types (pulijoodam-ffi)
#[frb(dart_metadata=("freezed"))]
pub struct BoardState {
    pub nodes: Vec<NodeState>,
    pub phase: GamePhase,
    pub current_player: Player,
    pub goats_placed: u8,
    pub goats_captured: u8,
    pub move_number: u32,
}

#[derive(Clone)]
pub struct NodeState {
    pub id: u8,
    pub x: f64,
    pub y: f64,
    pub piece: Option<Piece>,
}
```

## WASM-Specific Architecture Concerns

**Confidence: MEDIUM** (Flutter WASM support maturing rapidly; GitHub Pages constraints verified)

### Threading Model on WASM

This is the single most important architectural constraint. On web:

1. **No Rust-side threading.** `std::thread::spawn` panics on `wasm32-unknown-unknown`. Libraries like `wasm-bindgen-spawn` exist but add complexity and require nightly Rust.

2. **AI computation must be offloaded on the Dart side.** Two approaches:
   - **Dart Isolate (preferred):** Use `isolate_manager` or `compute()` which maps to WebWorkers on web. The WebWorker instantiates its own WASM module and runs AI computation there.
   - **Direct WebWorker:** Manual WebWorker setup that loads the WASM module independently.

3. **Game commands run on main thread.** Move validation, state updates, and queries are sub-millisecond and safe to run synchronously.

### Recommended WASM Threading Architecture

```
Main Thread (Flutter UI)                Worker Thread (Dart Isolate/WebWorker)
+---------------------------+           +---------------------------+
| Flutter UI                |           | WASM module (copy)        |
| Riverpod State            |           | pulijoodam-ai             |
| WASM module (primary)     |           |                           |
| - execute_command (sync)  |           | compute_ai_move(state,    |
| - query functions (sync)  |  ------>  |   difficulty) -> command   |
|                           |  message  |                           |
|                           |  <------  |                           |
+---------------------------+  result   +---------------------------+
```

**Key detail:** The WASM module is instantiated in BOTH the main thread and the worker thread. The main thread instance handles fast synchronous operations. The worker instance handles slow AI computation. Game state is serialized and sent to the worker (message passing, not shared memory).

### GitHub Pages Deployment

GitHub Pages does not support custom HTTP headers natively. This affects:

- **SharedArrayBuffer:** Requires `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin`. Not available on GitHub Pages without a service worker shim.
- **Multi-threaded Flutter rendering (Skwasm):** Requires SharedArrayBuffer. Will fall back to single-threaded WASM rendering on GitHub Pages.
- **Single-threaded WASM mode:** Flutter 3.29+ supports WASM without cross-origin headers in single-threaded mode. This is the practical path for GitHub Pages.

**Recommendation:** Deploy in single-threaded WASM mode. Flutter's CanvasKit/Skwasm renderer in single-threaded mode is performant enough for a board game (not a 3D shooter). If performance is insufficient, add a service worker that injects COOP/COEP headers to enable multi-threaded rendering.

### Build Pipeline

```bash
# Rust WASM build (handled by flutter_rust_bridge)
# In CI (GitHub Actions):
flutter_rust_bridge_codegen generate
flutter build web --wasm
# Deploy to GitHub Pages
```

## Flutter App Architecture

**Confidence: HIGH** (standard Flutter patterns, well-documented)

### State Management: Riverpod

Use Riverpod (v3+) with Notifier pattern. Riverpod over Bloc because:
- Less boilerplate for a solo developer learning project
- Compile-time safety catches provider errors
- No separate Event classes needed (the Command/Event pattern lives in Rust, not Dart)
- `@riverpod` codegen reduces setup

### Provider Structure

```dart
// Game state provider -- the central source of truth on the Dart side
@riverpod
class GameNotifier extends _$GameNotifier {
  @override
  GameUiState build() => GameUiState.initial();

  Future<void> executeCommand(GameCommand command) async {
    // Call Rust engine
    final events = bridge.executeCommand(state.engineState, command);
    // Apply each event to UI state
    for (final event in events) {
      state = _applyEvent(state, event);
    }
    // If it's now AI's turn, trigger AI
    if (state.isAiTurn) {
      await _requestAiMove();
    }
  }

  Future<void> _requestAiMove() async {
    state = state.copyWith(isThinking: true);
    // Offload to isolate/worker for WASM safety
    final aiCommand = await compute(
      (params) => bridge.computeAiMove(params.state, params.difficulty),
      AiParams(state.engineState, state.difficulty),
    );
    // Execute the AI's command through the same pipeline
    await executeCommand(aiCommand);
    state = state.copyWith(isThinking: false);
  }
}

// Settings provider
@riverpod
class SettingsNotifier extends _$SettingsNotifier {
  @override
  Settings build() => Settings.defaults();

  void setDifficulty(Difficulty d) => state = state.copyWith(difficulty: d);
  void setRuleVariant(RuleVariant v) => state = state.copyWith(ruleVariant: v);
  void setTheme(AppTheme t) => state = state.copyWith(theme: t);
  void toggleSound() => state = state.copyWith(soundEnabled: !state.soundEnabled);
}

// Animation provider -- derived from game events
@riverpod
class AnimationNotifier extends _$AnimationNotifier {
  @override
  AnimationQueue build() => AnimationQueue.empty();

  void enqueue(GameEvent event) {
    // Convert game events to animation commands
    // PieceMoved -> slide animation
    // PieceCaptured -> bounce + particle burst
    // etc.
  }
}
```

### CustomPainter Board Rendering

```
Widget Tree:
  GameScreen
    +-- RepaintBoundary          // Isolate board repaints
    |     +-- CustomPaint
    |           painter: BoardPainter(boardState, theme)
    |           - Draws: grid lines, triangle lines, nodes
    |           - Draws: pieces at node positions
    |           - shouldRepaint: compare board state identity
    |
    +-- AnimationOverlay          // Separate layer for animations
    |     +-- CustomPaint
    |           painter: AnimationPainter(animationQueue)
    |           - Draws: sliding pieces, capture particles
    |           - Repaints every frame during animation
    |
    +-- InteractionOverlay        // Touch targets, highlights
          +-- GestureDetector
                - Tap detection on nodes
                - Drag detection for piece movement
                - Hit testing against node positions
```

**Key optimization:** Separate the static board (lines, empty nodes) from dynamic elements (pieces, animations) using RepaintBoundary. The board grid only repaints when the theme changes. Pieces repaint on state change. Animations repaint at 60fps only during active animations.

### Flutter Project Structure

```
app/
  lib/
    main.dart
    src/
      bridge/
        generated/           # flutter_rust_bridge codegen output
        bridge_service.dart  # Wrapper over generated bindings
      state/
        game_notifier.dart
        settings_notifier.dart
        animation_notifier.dart
        providers.dart       # All provider exports
      models/
        game_ui_state.dart   # Dart-side UI state (freezed)
        animation_queue.dart
      ui/
        screens/
          home_screen.dart
          game_screen.dart
          settings_screen.dart
          tutorial_screen.dart
          history_screen.dart
        widgets/
          board_painter.dart      # CustomPainter for board
          animation_painter.dart  # CustomPainter for animations
          piece_widget.dart
          game_controls.dart
          difficulty_selector.dart
        theme/
          traditional_theme.dart
          modern_theme.dart
          app_theme.dart
      audio/
        sound_manager.dart
  test/
  web/
    index.html
  pubspec.yaml
```

## Patterns to Follow

### Pattern 1: Command/Event Separation at FFI Boundary

**What:** All Dart-to-Rust communication is via Commands (input). All Rust-to-Dart communication is via Events (output). No direct state mutation across the boundary.

**When:** Every interaction between Flutter and Rust.

**Why:** This makes the FFI boundary a clean serialization point. Commands and Events are simple data -- enums of structs with primitive fields. They serialize identically whether going over FFI, WASM, or a future WebRTC network layer. This also means the Rust engine is entirely deterministic and testable without any Flutter/FFI dependency.

### Pattern 2: Thin FFI Crate

**What:** The `pulijoodam-ffi` crate contains only API surface definitions and type conversions. No game logic, no AI algorithms. It is a translation layer.

**When:** Designing the Rust workspace.

**Why:** Keeps `flutter_rust_bridge` dependency isolated. Core and AI crates remain pure Rust with no FFI concerns. This means `cargo test` on core and AI works without any Flutter toolchain. It also means switching away from flutter_rust_bridge (unlikely but possible) only affects one crate.

### Pattern 3: Dual WASM Module Instantiation for AI

**What:** On web, instantiate the WASM module in both the main thread (for fast sync operations) and a separate WebWorker (for slow AI computation).

**When:** Running AI computation on WASM target.

**Why:** WASM cannot spawn threads. The main thread must stay responsive for 60fps rendering. AI computation (MCTS/Minimax) can take seconds. By running AI in a separate WebWorker with its own WASM instance, the main thread remains unblocked.

### Pattern 4: Event-Driven Animation Queue

**What:** Game events from Rust drive an animation queue on the Dart side. Each event type maps to an animation type. Animations play sequentially from the queue.

**When:** Rendering move results, captures, game-over effects.

**Why:** Decouples game logic timing from animation timing. A capture event (instantaneous in the engine) becomes a multi-frame animation on screen. The animation queue ensures events play in order with appropriate timing. The game state is already updated; animations are purely visual.

### Pattern 5: Immutable State with Riverpod Notifier

**What:** Game UI state is an immutable (freezed) data class. State transitions produce new instances via `copyWith`. Riverpod Notifier is the sole mutation point.

**When:** All Flutter state management.

**Why:** Immutable state makes `shouldRepaint` comparisons trivial (identity check). It prevents accidental mutation bugs. Riverpod's rebuild system efficiently propagates only changed portions.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Exposing Mutable Rust State Directly to Dart

**What:** Letting Dart hold a mutable reference to Rust game state and call methods on it directly.

**Why bad:** Creates lifecycle management nightmares across FFI. Rust ownership semantics clash with Dart GC. On WASM, mutable shared state across threads is impossible.

**Instead:** Use Command/Event pattern. Dart sends commands, receives events. State lives entirely in Rust. Dart maintains a lightweight UI mirror of the state.

### Anti-Pattern 2: Rust-Side Threading on WASM

**What:** Using `std::thread::spawn`, `rayon`, or `tokio::spawn` in Rust code that targets WASM.

**Why bad:** These panic or fail to compile on `wasm32-unknown-unknown`. Even with nightly features, WASM threading requires SharedArrayBuffer and COOP/COEP headers that GitHub Pages does not provide.

**Instead:** Keep Rust code single-threaded. Offload concurrency to the Dart/JavaScript layer (Isolates/WebWorkers). Use `#[cfg(not(target_arch = "wasm32"))]` guards for any native-only threading code.

### Anti-Pattern 3: Fat FFI Layer

**What:** Putting game logic, AI, or complex state management in the FFI crate.

**Why bad:** The FFI crate depends on `flutter_rust_bridge` which has its own build requirements and codegen. Mixing game logic into it makes testing harder, increases codegen time, and couples game logic to FFI tooling.

**Instead:** FFI crate is a thin translation layer. Game logic in `core`, AI in `ai`. FFI just wires them together with bridge-annotated functions.

### Anti-Pattern 4: Synchronous AI on Main Thread (WASM)

**What:** Calling AI computation synchronously from the Flutter main thread when running on WASM.

**Why bad:** Browsers throw exceptions or show "page unresponsive" warnings when the main thread blocks for more than ~50ms. AI computation at Hard/Expert difficulty can take 2-5 seconds.

**Instead:** Always dispatch AI computation to a WebWorker/Isolate on web. On native, Rust's thread pool handles this, but on WASM, the Dart side must manage concurrency.

## Scalability Considerations

| Concern | At MVP (solo AI) | At v1.5 (P2P multiplayer) | At v2+ (online) |
|---------|-------------------|---------------------------|-------------------|
| State sync | Local only, Command/Event in memory | Commands sent over WebRTC, Events applied locally | Commands sent to server, authoritative state |
| AI compute | Single WebWorker | Same (AI only for solo games) | Server-side Rust (no WASM constraints) |
| Game storage | Local storage / IndexedDB | Same + shared game ID | Server database |
| Undo/Redo | Full history stack | Limited (only in solo) | Spectator replay from server events |

The Command/Event architecture scales naturally from solo play to multiplayer because commands are the same unit of communication regardless of transport (FFI, WebRTC, HTTP).

## Suggested Build Order (Dependencies)

Build order is driven by dependency direction. Lower layers must exist before higher layers.

```
Phase 1: pulijoodam-core (board, rules, state, commands, events)
    |     No dependencies on other project crates.
    |     Testable with cargo test immediately.
    |
Phase 2: pulijoodam-ai (depends on core)
    |     Requires core types (GameState, Board, Move).
    |     Testable with cargo test against known board states.
    |
Phase 3: pulijoodam-ffi + flutter_rust_bridge setup
    |     Depends on core + ai.
    |     Requires Flutter toolchain + codegen working.
    |     First time WASM build is validated.
    |
Phase 4: Flutter app shell + Riverpod state + Bridge Service
    |     Depends on FFI bindings being generated.
    |     Can stub Rust side initially for UI development.
    |
Phase 5: Board rendering (CustomPainter) + input handling
    |     Depends on state management and bridge working.
    |
Phase 6: AI integration + WebWorker offloading
    |     Depends on FFI working + AI crate complete.
    |     WASM threading strategy validated here.
    |
Phase 7: Polish (animations, sound, themes, tutorial)
    |     Depends on core game loop working end-to-end.
    |
Phase 8: Deployment (GitHub Pages CI/CD)
         Depends on WASM build + single-threaded mode validated.
```

**Critical path:** Phases 1-3 are the foundation. Phase 3 (FFI integration) is the highest-risk step -- if flutter_rust_bridge codegen or WASM compilation fails, everything above it is blocked. Validate the FFI + WASM pipeline with a minimal "hello world" before building the full engine.

**Parallel opportunity:** Core Rust engine development (Phases 1-2) and Flutter UI scaffolding (Phase 4 with stubs) can proceed in parallel once the FFI bridge shape is agreed upon.

## Sources

- [flutter_rust_bridge GitHub](https://github.com/fzyzcjy/flutter_rust_bridge) -- official repo, v2 architecture
- [flutter_rust_bridge WASM Limitations](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/wasm-limitations) -- threading constraints
- [flutter_rust_bridge Cross-Origin Docs](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/web-cross-origin) -- COOP/COEP guidance
- [flutter_rust_bridge Async Dart Guide](https://cjycode.com/flutter_rust_bridge/guides/concurrency/async-dart) -- sync/async patterns
- [Cargo Workspaces - Rust Book](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html) -- workspace layout
- [Large Rust Workspaces - matklad](https://matklad.github.io/2021/08/22/large-rust-workspaces.html) -- flat crate layout pattern
- [Command Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/command.html) -- command/undo architecture
- [Turn-Based Game in Rust](https://herluf-ba.github.io/making-a-turn-based-multiplayer-game-in-rust-01-whats-a-turn-based-game-anyway.html) -- reducer/event pattern
- [Flutter Web WASM Support](https://docs.flutter.dev/platform-integration/web/wasm) -- single-threaded mode, header requirements
- [Flutter Web Renderers](https://docs.flutter.dev/platform-integration/web/renderers) -- CanvasKit/Skwasm
- [Riverpod Official Docs](https://riverpod.dev/) -- Notifier pattern, v3
- [Riverpod Notifier/AsyncNotifier Guide](https://codewithandrea.com/articles/flutter-riverpod-async-notifier/) -- practical patterns
- [wasm-bindgen Web Worker Example](https://rustwasm.github.io/docs/wasm-bindgen/examples/wasm-in-web-worker.html) -- WASM in WebWorker
- [parcel-yavalath](https://github.com/N-McA/parcel-yavalath) -- Rust WASM MCTS board game reference
- [Flutter CustomPainter Performance](https://plugfox.dev/high-performance-canvas-rendering/) -- repaint optimization
- [Dart Isolates / Concurrency](https://docs.flutter.dev/perf/isolates) -- WebWorker on web
- [isolate_manager package](https://pub.dev/packages/isolate_manager) -- cross-platform isolate/WebWorker
- [Flutter Update - Single-threaded WASM mode](https://github.com/flutter/website/issues/11354) -- no headers required
