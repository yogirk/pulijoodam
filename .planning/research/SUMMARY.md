# Project Research Summary

**Project:** Pulijoodam (Traditional South Indian Board Game)
**Domain:** Rust game engine + Flutter web app, asymmetric strategy board game
**Researched:** 2026-03-03
**Confidence:** MEDIUM-HIGH

## Executive Summary

Pulijoodam is an asymmetric two-player strategy game (Tigers vs. Goats) being digitized as a culturally-authentic Flutter web app backed by a custom Rust game engine connected via flutter_rust_bridge FFI and compiled to WASM. The recommended approach is a clean separation of concerns: Rust owns all game logic and AI (in a multi-crate workspace), Dart owns the UI and state presentation, and a thin FFI layer with a Command/Event pattern bridges the two. The AI should be implemented from scratch (MCTS for the placement phase, Minimax+alpha-beta for the movement phase) rather than using ill-maintained crates, as the asymmetric game topology makes custom implementation both practical and educational.

The biggest technical challenge is not the game itself but the deployment target: GitHub Pages cannot set HTTP headers, WASM threading requires cross-origin isolation headers, and the gap between "works on localhost" and "works in production" is wider for this stack than for most web apps. The research is unambiguous — deploy a minimal flutter_rust_bridge WASM hello-world to GitHub Pages in Phase 1 before writing any game logic. If the deployment pipeline works for a trivial case, it will work for the real app. If it breaks, you need to know in hours, not weeks.

In a market of low-polish Tigers-and-Goats apps, the opportunity for differentiation is high. No existing competitor offers regional rule variants, interactive tutorials, game replay, or meaningful accessibility. The feature set is well-scoped for a v1: the critical path (Rust rule engine → board rendering → AI → game loop) delivers a playable game, with cultural differentiators layered on top in subsequent phases. The project has dual value as both a cultural preservation artifact and a Rust/Flutter learning vehicle — both goals are served by the same architectural decisions.

## Key Findings

### Recommended Stack

The stack is constrained by three fixed requirements: Rust for the engine (learning goal), Flutter for the UI (cross-platform), and GitHub Pages for hosting ($0 cost). Within those constraints, the research confirms flutter_rust_bridge v2 as the correct FFI bridge, skwasm as the web renderer (2-3x faster than CanvasKit), and `audioplayers` (not flutter_soloud) for audio since flutter_soloud's dart:ffi dependency is incompatible with WASM compilation. CustomPainter is the right board rendering choice — Flame Engine is for action games with game loops, not static-topology turn-based games.

The toolchain has two critical-path requirements that are non-obvious: (1) Rust nightly is needed for `flutter_rust_bridge build-web` (to use `-Zbuild-std` for WASM std compilation), and (2) Rust 1.87+ requires explicit wasm-opt flags (`--enable-bulk-memory --enable-threads --enable-nontrapping-float-to-int`) due to LLVM 20 WASM feature changes. Pin all three flutter_rust_bridge components (Dart package, Rust crate, codegen CLI) to exact versions.

**Core technologies:**
- **Rust stable + nightly (pinned):** Game engine and AI — zero-cost abstractions, WASM compilation target, learning goal
- **flutter_rust_bridge v2.11.x:** Dart↔Rust FFI with auto-generated bindings and WASM support
- **Flutter 3.41.x stable / Dart 3.7.x:** UI framework — latest stable with WASM web build support
- **CustomPainter (built-in):** Board rendering — direct canvas control for 23-node fixed-topology board
- **audioplayers:** Sound effects — WASM-compatible via HTML5 Audio API (not dart:ffi)
- **Riverpod v3+:** State management — compile-time safety, less boilerplate than Bloc, no duplicate Event classes
- **skwasm renderer:** Web performance — auto-selected on WASM builds, 2-3x faster startup
- **coi-serviceworker:** Cross-origin isolation on GitHub Pages — injects COOP/COEP headers client-side
- **GitHub Actions + Pages:** CI/CD and hosting — free, integrated, supports custom deployment workflow

### Expected Features

The Tigers-and-Goats app space is sparse and low-quality. Every existing competitor is feature-thin, visually bland, and culturally generic. Table stakes for any digital board game are well-established; differentiators for this specific game are wide open.

**Must have (table stakes):**
- Complete rule enforcement — engine is the authority; invalid moves are impossible
- AI opponent at multiple difficulties — without AI, there is no solo game
- Play as either side (Tiger or Goat) — required for asymmetric games
- Responsive board rendering at 60fps — the board is the entire UI
- Tap-tap and drag-and-drop interaction — users expect both input modes
- Move validation feedback — immediate visual/audio cue on illegal moves
- Undo/redo — standard for single-player board games; must retract full turn (player + AI)
- Sound effects with mute toggle — place, slide, capture, win/lose sounds
- Game auto-save — persist to LocalStorage/IndexedDB on every move
- Visual move indicators — last move highlight, valid target highlights on selection
- Capture animation — goat disappears with visual flourish, not silent vanishing
- Game result screen — win/loss/draw with basic stats and play-again option

**Should have (differentiators):**
- Two regional rule presets (Andhra + Tamil) — no competitor offers this; genuine cultural authenticity
- Interactive tutorial (3 guided lessons) — niche game, most users need onboarding; competitors offer nothing
- Game history with replay and timeline scrubber — no Tigers-and-Goats app offers replay; enables learning
- Two visual themes (Traditional earthen + Modern geometric) — competitors are visually bland
- Cultural context / About section — brief history, regional names, cultural significance
- AI move animation with thinking delay (300-800ms) — feels like a real opponent, not instant robot

**Defer (v2+):**
- Multiplayer (v1.5) — different architecture concerns, small audience makes matchmaking hard
- Localization (Telugu, Tamil, Kannada UI) — cultural value but translation maintenance overhead
- Achievements, ELO, hints, post-game analysis, puzzles — not essential for launch
- Time controls — irrelevant for AI play

### Architecture Approach

The architecture is a clean three-tier system: a Rust workspace with three crates (`pulijoodam-core` for game logic, `pulijoodam-ai` for MCTS/Minimax, `pulijoodam-ffi` as a thin FFI translation layer), a Dart bridge service that dispatches Commands and receives Events, and a Flutter UI layer driven by Riverpod Notifiers. The central pattern is Command/Event separation at the FFI boundary — Dart sends typed Commands (PlacePiece, MovePiece, Undo, RequestAiMove), Rust returns typed Events (PiecePlaced, PieceMoved, PieceCaptured, GameOver). No mutable Rust state is exposed across the FFI boundary. This pattern provides undo/redo for free (history stack of Command+Events), natural game replay (re-execute command sequence), and a path to multiplayer (commands serialize identically over WebRTC as over FFI).

The single most important WASM constraint: AI computation must be offloaded from the browser main thread using a Dart Isolate/WebWorker, because `std::thread::spawn` is unavailable in WASM. The WASM module runs in both the main thread (fast synchronous game commands, <1ms) and a separate worker (slow AI computation, potentially seconds). Board rendering is layered: static board geometry in one `CustomPainter` behind a `RepaintBoundary`, pieces in a second layer, animations/highlights in a third — so 60fps animations only repaint the animation layer, not the full board.

**Major components:**
1. `pulijoodam-core` (Rust) — board topology, game state, move validation, rule variants, undo/redo history
2. `pulijoodam-ai` (Rust) — MCTS for placement phase, Minimax+alpha-beta for movement phase, difficulty presets
3. `pulijoodam-ffi` (Rust) — thin flutter_rust_bridge annotated API surface, no game logic
4. Bridge Service (Dart) — Command serialization, AI call orchestration, WebWorker dispatch
5. State Management / Riverpod (Dart) — GameNotifier, SettingsNotifier, AnimationNotifier
6. UI Layer (Dart) — CustomPainter board (3 paint layers), GestureDetector input, animation queue

### Critical Pitfalls

The most dangerous pitfalls cluster around the deployment boundary — the gap between localhost and GitHub Pages.

1. **Cross-origin isolation headers on GitHub Pages** — GitHub Pages cannot set COOP/COEP headers; SharedArrayBuffer (required for skwasm multi-threading and async WASM) is blocked. Prevention: add `coi-serviceworker` to `index.html` before any other scripts; validate GitHub Pages deployment in Phase 1.

2. **AI computation blocking the browser main thread** — MCTS/Minimax at depth runs for seconds; WASM has no native threading. A frozen browser tab is indistinguishable from a crashed app. Prevention: design AI as WebWorker message-passing from Phase 1; use iterative deepening with time budgets.

3. **flutter_rust_bridge codegen version drift and wasm-opt breakage** — the Dart package, Rust crate, and CLI codegen tool must all match exactly; Rust 1.87+ LLVM 20 breaks wasm-opt without explicit flags. Prevention: pin all three FRB versions explicitly (no `^` ranges); add `flutter_rust_bridge_codegen generate` CI check to fail on stale generated files.

4. **Rust panics in WASM crash the entire app** — `panic = "abort"` on WASM kills the WebAssembly instance with an opaque "unreachable" browser error, no recovery, no telemetry. Prevention: add `console_error_panic_hook` at WASM init; adopt zero-`unwrap()` policy in all FFI-facing code; return `Result<T, E>` everywhere at the FFI boundary.

5. **GitHub Pages base href misconfiguration** — without `--base-href=/pulijoodam/`, all asset URLs are wrong and the app is a blank screen in production while working perfectly on localhost. Prevention: encode `--base-href` in the GitHub Actions workflow from day one.

## Implications for Roadmap

Based on combined research, the build order is driven by two forces: (a) dependency direction (core before AI before FFI before Flutter UI), and (b) risk front-loading (validate the hardest technical problems — WASM, FFI, GitHub Pages deployment — before investing in game logic).

### Phase 1: WASM/FFI Scaffold and Deployment Validation

**Rationale:** The highest-risk items are not the game logic but the deployment pipeline. flutter_rust_bridge codegen, WASM compilation, cross-origin isolation, and GitHub Pages base href are all unknown-until-tested. A trivial "hello world" through the full stack validates the pipeline. Fail fast here, not after weeks of engine work.

**Delivers:** A deployed-to-GitHub-Pages Flutter web app that calls a Rust WASM function and renders the result. CI/CD pipeline fully operational. Version pinning established.

**Addresses:** None of the game features yet. This is infrastructure only.

**Avoids:** Pitfalls 1 (cross-origin headers), 3 (codegen version drift), 4 (panic handling), 5 (base href), 9 (base href), 13 (secret scanning). All four critical Phase 1 pitfalls resolved here.

**Research flag:** NEEDS RESEARCH during planning — flutter_rust_bridge WASM edge cases, coi-serviceworker integration, Rust nightly toolchain setup details.

### Phase 2: Core Game Engine (Rust)

**Rationale:** `pulijoodam-core` has no external dependencies beyond serde and rand. It is pure Rust, testable with `cargo test`, and the foundation everything else builds on. Building and testing it in isolation before touching the FFI boundary keeps complexity low.

**Delivers:** Complete rule engine for Andhra rules — board topology (23-node graph), game state machine, move validation, capture logic (including chain-hops), phase transitions (placement → movement), win/draw detection, undo/redo history stack, Command and Event enums.

**Addresses:** "Complete rule enforcement" table stake. Foundation for all AI work.

**Avoids:** Pitfall 4 (panics) — establish `Result`-everywhere policy and property-based tests here.

**Research flag:** STANDARD PATTERNS — Rust data structures and game state machines are well-documented. No research phase needed. Custom MCTS/Minimax implementation is a deliberate learning exercise.

### Phase 3: AI Engine (Rust)

**Rationale:** `pulijoodam-ai` depends on `pulijoodam-core` types. Build and tune AI against known board positions using `cargo test` before connecting to Flutter. AI quality is easier to evaluate in isolation.

**Delivers:** MCTS for placement phase, Minimax+alpha-beta for movement phase, evaluation function, four difficulty presets (Easy/Medium/Hard/Expert) with depth/iteration limits. Iterative deepening with time budgets for WASM compatibility.

**Addresses:** "AI opponent (multiple difficulties)" table stake, AI move animation timing (designed here, wired in later).

**Avoids:** Pitfall 2 (AI blocking main thread) — iterative deepening with time budgets designed here.

**Research flag:** STANDARD PATTERNS for MCTS and Minimax+alpha-beta — algorithms are well-documented. Game-specific evaluation function requires domain expertise in Pulijoodam strategy, which may need iteration.

### Phase 4: FFI Bridge + Flutter Shell

**Rationale:** Wire the Rust engine to Flutter through flutter_rust_bridge. This is the second-highest-risk integration point (after Phase 1). Once the FFI bindings generate cleanly and types marshal correctly, Flutter UI development can proceed with confidence.

**Delivers:** Dart bridge service, Riverpod state management (GameNotifier, SettingsNotifier), flutter_rust_bridge codegen integrated into build. AI computation dispatched to Dart Isolate/WebWorker. Basic app shell (screens, navigation).

**Addresses:** Architecture pattern — Command/Event separation at FFI boundary, dual WASM module instantiation for AI.

**Avoids:** Pitfall 2 (AI blocking main thread) — WebWorker dispatch implemented here. Anti-pattern: mutable Rust state exposed to Dart.

**Research flag:** NEEDS RESEARCH during planning — Dart Isolate/WebWorker patterns for WASM, flutter_rust_bridge sync vs. async annotation strategy.

### Phase 5: Playable Game (MVP)

**Rationale:** Get a working, playable game end-to-end. Board renders, user can tap to place/move pieces, AI responds, game ends with a result screen. This is the minimum playable product that can be playtested.

**Delivers:** CustomPainter board (3-layer rendering), tap-tap interaction, move validation feedback, visual move indicators (last move, valid targets), AI move animation with timing delay, game result screen. Andhra rules only, Traditional theme only, Easy+Hard difficulty.

**Addresses:** Most of the table stakes: board rendering, interaction, validation feedback, visual indicators, result screen.

**Avoids:** Pitfall 7 (CustomPainter full repaint) — 3-layer painter hierarchy with RepaintBoundary from the start.

**Research flag:** STANDARD PATTERNS — Flutter CustomPainter and GestureDetector are well-documented. Non-standard board topology (23 nodes, triangle-over-grid) requires careful coordinate mapping but no special research.

### Phase 6: Core Polish

**Rationale:** With a playable game, focus on the polish that prevents frustration: undo/redo, auto-save, drag interaction, capture animations, sound effects. Also add Tamil rule variant to validate the regional preset system.

**Delivers:** Undo/redo (full turn retraction), game auto-save (LocalStorage/IndexedDB), drag-and-drop interaction, capture animation (bounce + particle burst), sound effects with mute toggle, all 4 AI difficulties, Tamil rule preset.

**Addresses:** Remaining table stakes (undo, auto-save, drag, audio, animations). Differentiator: Tamil rules.

**Avoids:** Pitfall 6 (stale service worker cache) — configure cache-busting strategy. Pitfall 8 (audio mobile failures) — lazy AudioContext initialization on first user tap.

**Research flag:** STANDARD PATTERNS for undo/redo (Command/Event history already supports it). Audio initialization pattern on mobile needs attention — validate on real iOS Safari early.

### Phase 7: Differentiators

**Rationale:** With a polished, complete game loop, add the features that make Pulijoodam distinct from every existing competitor: tutorial, replay, second theme, cultural context, accessibility.

**Delivers:** Interactive tutorial (3 guided lessons), game history with replay + timeline scrubber, Modern theme, cultural context/About section, accessibility improvements (44pt touch targets, screen reader semantic labels, color-blind safe design).

**Addresses:** All planned differentiators. Accessibility semantic layer (Pitfall 12).

**Avoids:** Pitfall 12 (accessibility invisible to screen readers) — add Semantics widgets to all interactive board elements.

**Research flag:** NEEDS RESEARCH during planning — tutorial engine design (constrained board states with guided moves), replay timeline UI patterns (Board Game Arena, Lichess references exist), accessibility semantic layer for canvas-based Flutter.

### Phase 8: Deployment Hardening

**Rationale:** Optimize for the target audience (potentially rural India, slow connections), harden the service worker strategy, bundle size, and CI validation.

**Delivers:** Bundle size optimization (wasm-opt -Oz, LTO, deferred loading for non-critical features), service worker version-check strategy, Lighthouse performance baseline, loading screen (pure HTML before Flutter loads).

**Addresses:** Pitfall 5 (bundle size/load time), Pitfall 6 (stale cache).

**Research flag:** STANDARD PATTERNS — wasm-opt flags and Flutter deferred loading are documented.

### Phase Ordering Rationale

- Phases 1-4 build the foundational layers in strict dependency order: scaffold → core → AI → FFI+Flutter. No phase can start before its predecessor is proven.
- Phase 1 is the risk-mitigation phase. It exists entirely to validate deployment before investing in game logic.
- Phases 2-3 are pure Rust development, independent of Flutter toolchain after Phase 1 validates it.
- Phases 4-5 wire things together; parallel development of Flutter UI stubs and Rust engine is possible once the FFI shape is agreed in Phase 4.
- Phases 6-7 are additive polish layers on a working game foundation.
- Phase 8 is last because bundle optimization cannot be done until features are complete.

### Research Flags

Phases needing deeper research during planning:
- **Phase 1:** coi-serviceworker integration details, Rust nightly toolchain + wasm-opt flag configuration, flutter_rust_bridge WASM build pipeline edge cases
- **Phase 4:** Dart Isolate/WebWorker strategy for WASM AI dispatch, flutter_rust_bridge `#[frb(sync)]` annotation scope
- **Phase 7:** Tutorial engine patterns (constrained board states, guided move validation), timeline scrubber UI for game replay, Flutter semantics layer for canvas-based accessibility

Phases with established patterns (skip research-phase):
- **Phase 2:** Rust game state machine and move validation — standard patterns, `cargo test` feedback loop
- **Phase 3:** MCTS and Minimax+alpha-beta — classic algorithms, deliberately custom-built
- **Phase 5:** Flutter CustomPainter, GestureDetector — well-documented, 3-layer hierarchy is standard
- **Phase 6:** Undo/redo from Command/Event history — falls out naturally from architecture
- **Phase 8:** wasm-opt flags, Flutter deferred loading — documented optimization techniques

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies (Flutter 3.41, Rust stable, flutter_rust_bridge v2) verified against official docs. WASM limitations confirmed. Version-specific issues (LLVM 20/wasm-opt) tracked with known workarounds. |
| Features | MEDIUM-HIGH | Table stakes derived from established board game apps (Lichess, Chess.com). Differentiators confirmed by competitor gap analysis. Feature scoping is conservative and well-justified. |
| Architecture | MEDIUM-HIGH | Command/Event pattern is well-established in game programming. Rust workspace layout is standard. WASM threading constraints are confirmed. Riverpod/Notifier patterns are documented. flutter_rust_bridge WASM edge cases are evolving — verify sync/async annotation decisions against latest docs. |
| Pitfalls | HIGH | All critical pitfalls (cross-origin headers, WASM threading, codegen drift, panics, base href) are confirmed with tracked GitHub issues and official documentation. Not speculative. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **flutter_rust_bridge Dart Isolate/WebWorker integration:** The exact mechanism for running AI computation in a WebWorker on web while keeping the main thread responsive is documented in principle but needs a working prototype to validate. Test this in Phase 4.
- **AI difficulty calibration:** MCTS iteration counts and Minimax depth limits for the four difficulty presets are guesses until tested against real players. Plan to tune these after Phase 3.
- **flutter_rust_bridge v2 sync vs. async for game commands:** The `#[frb(sync)]` annotation should work for sub-millisecond game commands on WASM, but edge cases in type marshalling for complex enums (GameCommand, GameEvent) need validation.
- **audioplayers WASM compatibility with Flutter 3.41:** Confirmed in principle (HTML5 Audio API path), but test during Phase 6 setup on iOS Safari before investing in sound design.
- **Single-threaded vs. multi-threaded skwasm for a board game:** Performance of single-threaded skwasm (the practical choice for GitHub Pages without coi-serviceworker) needs validation to confirm 60fps target is achievable. Measure in Phase 5.

## Sources

### Primary (HIGH confidence)
- [Flutter Web Renderers](https://docs.flutter.dev/platform-integration/web/renderers) — skwasm vs. CanvasKit behavior
- [Flutter WASM Support](https://docs.flutter.dev/platform-integration/web/wasm) — build flags, browser requirements, single-threaded mode
- [flutter_rust_bridge WASM Limitations](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/wasm-limitations) — threading, type, and panic constraints
- [flutter_rust_bridge Cross-Origin docs](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/web-cross-origin) — COOP/COEP requirements
- [console_error_panic_hook](https://github.com/rustwasm/console_error_panic_hook) — WASM panic debugging
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/) — accessibility reference
- [Command Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/command.html) — command/undo architecture
- [Cargo Workspaces - Rust Book](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html) — workspace layout

### Secondary (MEDIUM confidence)
- [flutter_rust_bridge GitHub](https://github.com/fzyzcjy/flutter_rust_bridge) — v2.11.x, issue tracker
- [flutter_rust_bridge #2601](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2601) — wasm-opt + LLVM 20 breakage
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) — COOP/COEP service worker for GitHub Pages
- [Riverpod Official Docs](https://riverpod.dev/) — Notifier pattern, v3
- [wasm-bindgen Web Worker Example](https://rustwasm.github.io/docs/wasm-bindgen/examples/wasm-in-web-worker.html) — WASM in WebWorker
- [Lichess features](https://lichess.org/features) — board game app feature expectations
- [BaghChal/Tigers-and-Goats apps on Google Play](https://play.google.com/store/apps/details?id=com.sudarshanz) — competitor feature set
- [Flutter CustomPainter Performance](https://plugfox.dev/high-performance-canvas-rendering/) — repaint optimization
- [Rust WASM multithreading](https://rustwasm.github.io/2018/10/24/multithreading-rust-and-wasm.html) — Web Workers solution

### Tertiary (LOW confidence)
- `forceSingleThreadedSkwasm` configuration API — verify in Flutter 3.41 docs at build time
- flutter_rust_bridge exact latest version — pub.dev indexing lags; always run `dart pub upgrade` to verify
- audioplayers exact version compatibility with Flutter 3.41 WASM builds — test during Phase 6 setup
- flutter_rust_bridge Rust edition 2024 / resolver 3 compatibility — start with edition 2021 until confirmed

---
*Research completed: 2026-03-03*
*Ready for roadmap: yes*
