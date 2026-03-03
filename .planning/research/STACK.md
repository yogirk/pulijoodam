# Technology Stack

**Project:** Pulijoodam (Traditional South Indian Board Game)
**Researched:** 2026-03-03
**Overall Confidence:** MEDIUM-HIGH

---

## Recommended Stack

### Rust Engine (Game Logic + AI)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Rust (stable) | 1.85.x (pin, see note) | Game engine language | Learning goal + WASM compilation target + zero-cost abstractions for AI perf | HIGH |
| serde | 1.x (latest) | Serialization for Command/Event pattern | De facto standard; needed for game state serialization across FFI boundary | HIGH |
| serde_json | 1.0.149+ | JSON serialization | Needed for debug tooling, game history export, future network layer | HIGH |
| getrandom | latest, with `wasm_js` feature | RNG entropy source for AI | Required for `rand` crate on `wasm32-unknown-unknown`; must enable `wasm_js` feature explicitly | HIGH |
| rand | 0.8.x | Random number generation for MCTS | Standard RNG crate; needed for MCTS random playouts. Requires getrandom `wasm_js` for web | HIGH |

**CRITICAL Rust Version Note:** Pin to Rust **<1.87.0** initially, or ensure wasm-opt flags are configured. Rust 1.87.0+ uses LLVM 20 which emits WASM features (`bulk-memory`, `threads`, `nontrapping-float-to-int`) that break `wasm-opt` in flutter_rust_bridge's build pipeline. The fix requires passing `--enable-bulk-memory --enable-threads --enable-nontrapping-float-to-int` flags to wasm-opt. Since Rust stable is now 1.93.1, you will need to apply these wasm-opt flags -- pinning to an old Rust is not practical long-term. Track [flutter_rust_bridge issue #2601](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2601) for upstream resolution.

**AI Libraries Decision: Build Custom, Don't Use Crates**

The Rust MCTS/Minimax crate ecosystem is fragmented -- `minimax-alpha-beta` (0.1.6), `minimax` crate, various GitHub projects. None are well-maintained or widely used. For a learning project with a specific game topology (23-node graph, asymmetric pieces), **write MCTS and Minimax+alpha-beta from scratch**. This is:
- A core learning goal of the project
- Straightforward to implement (~500-1000 lines each)
- Avoids fighting generic abstractions that don't fit the asymmetric Tiger/Goat game
- Allows game-specific optimizations (transposition tables tuned to 23-node state space)

### Flutter-Rust Bridge (FFI Layer)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| flutter_rust_bridge | ~2.11.x | Dart<->Rust binding generator | Auto-generated bindings, WASM web support, async Dart futures, rich type marshalling. Non-negotiable per project constraints | MEDIUM |
| flutter_rust_bridge_codegen | ~2.11.x | Code generation CLI | Generates Dart bindings from Rust API. Includes `build-web` command for WASM compilation | MEDIUM |
| wasm-bindgen | 0.2.114 (transitive) | JS<->WASM interop | Pulled in by flutter_rust_bridge; provides the JS glue layer for WASM modules | HIGH |
| wasm-pack | latest (transitive) | WASM build tooling | Used internally by `flutter_rust_bridge_codegen build-web` | MEDIUM |

**Version Confidence Note:** flutter_rust_bridge version is listed as MEDIUM because pub.dev indexing lags and the project releases frequently. The `2.11.x` series appears current as of early 2026. Always run `dart pub upgrade` to get the latest patch.

### Flutter App (Frontend)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Flutter SDK | 3.41.x (stable) | App framework | Latest stable as of Feb 2026. Required for WASM web build support | HIGH |
| Dart SDK | 3.7.x (bundled) | Programming language | Comes with Flutter 3.41; supports sealed classes, pattern matching, `package:web` for WASM compat | HIGH |
| CustomPainter | (built-in) | Board rendering | Direct canvas control for the 23-node game board. No framework overhead. Perfect for a fixed-topology board game | HIGH |
| audioplayers | latest | Sound effects | Simple audio playback for place/slide/capture/win sounds. Web-compatible via HTML5 Audio API. Works on web without dart:ffi | HIGH |
| provider or riverpod | latest | State management | Lightweight reactive state for game state -> UI binding. Provider for simplicity given single-screen app | MEDIUM |

**Why NOT Flame Engine:** Flame is a full game engine (game loop, sprites, ECS, collision detection) designed for action/arcade games. Pulijoodam is a turn-based board game with a static board and discrete piece positions. CustomPainter gives you exactly what you need -- draw nodes, edges, pieces, and highlights -- without Flame's overhead. Flame's component system would fight against the Rust engine owning all game logic.

**Why NOT flutter_soloud for Audio:** flutter_soloud uses dart:ffi which does NOT work when compiling Flutter to WASM. The open [WASM support issue (#46)](https://github.com/alnitak/flutter_soloud/issues/46) remains unresolved. Use `audioplayers` instead -- its web implementation (`audioplayers_web`) uses the HTML5 Audio API directly, which works on all web targets including WASM builds.

**Why Sealed Classes for Game State:** Dart 3's sealed classes + pattern matching are ideal for modeling game states (Placing, Moving, GameOver), moves (PlaceGoat, MoveTiger, CaptureGoat), and events. The compiler enforces exhaustive matching -- you can't forget to handle a state. Use them for the Dart-side game state representation.

### Web Renderer

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| skwasm (via `--wasm` build) | Primary web renderer | 2-3x faster than CanvasKit, smaller bundle (~1.1MB vs ~1.5MB), multi-threaded rendering. Flutter auto-selects skwasm for WASM builds | HIGH |
| CanvasKit | Fallback renderer | Auto-fallback when browser lacks WasmGC support. No configuration needed -- Flutter handles this | HIGH |

**Build command:** `flutter build web --wasm --release --base-href "/pulijoodam/"`

**Browser support for skwasm:** Chrome 119+, Edge 119+. Firefox has WasmGC since 120 but has known issues. Safari lacks WasmGC support entirely (falls back to CanvasKit automatically).

### Infrastructure & Deployment

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| GitHub Pages | Static hosting | Free, integrates with repo, supports custom domains. $0 cost constraint | HIGH |
| GitHub Actions | CI/CD | Build Flutter web + Rust WASM, deploy to gh-pages branch. Free for public repos | HIGH |
| coi-serviceworker | COOP/COEP header injection | GitHub Pages cannot set HTTP headers. This service worker injects Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers required for SharedArrayBuffer (needed by skwasm multi-threading) | HIGH |
| subosito/flutter-action | GH Actions Flutter setup | Standard action for installing Flutter SDK in CI. Pin to stable channel + specific version | HIGH |

### Dev Dependencies & Tooling

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| rust-src (rustup component) | WASM build requirement | Required for building std with WASM target features (atomics, bulk_memory, mutable_globals) | HIGH |
| wasm32-unknown-unknown (rustup target) | WASM compilation target | The Rust target for browser WASM. Add via `rustup target add wasm32-unknown-unknown` | HIGH |
| Rust nightly toolchain | WASM std build | flutter_rust_bridge build-web requires nightly for `-Zbuild-std` to build std with required target features | HIGH |
| cargo-expand (optional) | Macro debugging | Useful for inspecting serde derive output and understanding generated code | LOW |
| Flutter DevTools | Performance profiling | Built-in; use for identifying CustomPainter repaint issues and frame timing | HIGH |

---

## Rust Cargo.toml Configuration

```toml
# engine/pulijoodam-core/Cargo.toml
[package]
name = "pulijoodam-core"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rand = "0.8"
getrandom = { version = "0.2", features = ["wasm_js"] }  # CRITICAL for WASM

# engine/pulijoodam-ffi/Cargo.toml
[package]
name = "pulijoodam-ffi"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "staticlib"]  # cdylib for WASM, staticlib for native

[dependencies]
pulijoodam-core = { path = "../pulijoodam-core" }
flutter_rust_bridge = "2"

[profile.release]
panic = "abort"       # Required for WASM; also reduces binary size
codegen-units = 1     # Better optimization
lto = true            # Link-time optimization; smaller WASM binary
opt-level = "z"       # Optimize for size over speed (WASM download matters)
strip = true          # Strip debug symbols
```

## Flutter pubspec.yaml (Key Dependencies)

```yaml
# app/pubspec.yaml
name: pulijoodam
description: Traditional South Indian strategy board game

environment:
  sdk: ">=3.7.0 <4.0.0"
  flutter: ">=3.41.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_rust_bridge: ^2.11.0
  audioplayers: ^6.0.0
  provider: ^6.1.0     # Or riverpod ^2.6.0 if preferring code generation

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^5.0.0
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Game rendering | CustomPainter | Flame Engine | Flame is for action games with game loops, sprites, ECS. Board game with static topology needs direct canvas control. Flame would add unnecessary complexity and fight the Rust engine owning logic |
| Audio | audioplayers | flutter_soloud | flutter_soloud uses dart:ffi which breaks WASM compilation. audioplayers_web uses HTML5 Audio API natively |
| Audio | audioplayers | just_audio | just_audio is more powerful (playlists, streaming) but heavier. Short sound effects need simple fire-and-forget playback |
| State management | provider | riverpod | riverpod is more powerful but adds code-gen complexity. Single-screen game app with Rust engine owning state doesn't need riverpod's dependency injection |
| State management | provider | bloc | bloc adds event/state boilerplate. The Rust engine already implements Command/Event pattern -- duplicating in Dart adds no value |
| FFI bridge | flutter_rust_bridge | Hand-rolled dart:ffi + wasm-bindgen | Manual approach requires maintaining two separate interfaces (native FFI + WASM JS). flutter_rust_bridge abstracts this with single API surface |
| WASM tooling | flutter_rust_bridge build-web | Manual wasm-pack | build-web handles wasm-pack config, wasm-bindgen glue, and JS integration. Manual setup gives more control but more maintenance |
| Web hosting | GitHub Pages + coi-serviceworker | Cloudflare Pages | Cloudflare Pages can set headers natively (no service worker hack) but adds vendor dependency. GitHub Pages keeps everything in one place ($0, integrated) |
| Renderer | skwasm (WASM build) | CanvasKit (JS build) | skwasm is 2-3x faster startup and frame rendering. Only reason for CanvasKit is browser fallback (handled automatically) |

---

## WASM-Specific Configuration

### Required Rust Toolchain Setup

```bash
# Install nightly toolchain (required for -Zbuild-std)
rustup toolchain install nightly

# Add WASM target
rustup target add wasm32-unknown-unknown --toolchain nightly

# Add rust-src component (required for building std with custom features)
rustup component add rust-src --toolchain nightly

# Install wasm-pack (used by flutter_rust_bridge build-web)
cargo install wasm-pack
```

### flutter_rust_bridge WASM Build

```bash
# From the app/ directory
flutter_rust_bridge_codegen build-web \
  --rust-crate-dir ../engine/pulijoodam-ffi \
  --output web/pkg \
  --release
```

### Cross-Origin Isolation for GitHub Pages

Add `coi-serviceworker.js` to `web/` directory. In `web/index.html`:

```html
<head>
  <!-- Must be BEFORE any other scripts -->
  <script src="coi-serviceworker.js"></script>
  <!-- ... rest of head ... -->
</head>
```

This injects the headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

Without these, SharedArrayBuffer is blocked, skwasm falls back to single-threaded mode, and performance degrades.

### Alternative: Force Single-Threaded skwasm

If coi-serviceworker causes issues (first-visit reload, third-party embed breakage), you can force single-threaded skwasm in `web/index.html`:

```javascript
_flutter.loader.load({
  config: {
    canvasKitVariant: "chromium",
  },
  serviceWorkerSettings: {
    // flutter service worker settings
  },
});
```

Or pass `forceSingleThreadedSkwasm: true` in the engine configuration. This avoids needing COOP/COEP headers entirely but sacrifices multi-threaded rendering performance.

---

## GitHub Actions CI/CD Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust nightly
        uses: dtolnay/rust-action@v1
        with:
          toolchain: nightly
          targets: wasm32-unknown-unknown
          components: rust-src

      - name: Install wasm-pack
        run: cargo install wasm-pack

      - name: Install Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: "3.41.x"
          channel: stable

      - name: Install flutter_rust_bridge_codegen
        run: cargo install flutter_rust_bridge_codegen

      - name: Build Rust WASM
        working-directory: app
        run: flutter_rust_bridge_codegen build-web --rust-crate-dir ../engine/pulijoodam-ffi --release

      - name: Build Flutter Web
        working-directory: app
        run: flutter build web --wasm --release --base-href "/pulijoodam/"

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: app/build/web
```

---

## Key WASM Limitations to Design Around

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| No `std::thread::spawn` in WASM | AI cannot use OS threads | Use Rust async or run AI computation in main thread. For <2s moves on a 23-node graph, single-threaded is likely sufficient. Profile first |
| `panic!` aborts WASM module | Unrecoverable crash on unwrap failures | Use `.expect()` with messages or `Result<T, E>` everywhere in FFI-facing code. Never `.unwrap()` in code paths reachable from Dart |
| No `Int64List`/`Uint64List` on web | Cannot pass 64-bit integer arrays across FFI | Use `i32`/`u32` for board indices and move encoding. 23 nodes fit in u8 |
| `getrandom` requires explicit feature | `rand` crate fails to compile for WASM without it | Add `getrandom = { features = ["wasm_js"] }` to Cargo.toml |
| Cross-origin isolation required | skwasm multi-threading needs COOP/COEP headers | Use coi-serviceworker on GitHub Pages, or accept single-threaded fallback |
| Safari lacks WasmGC | Flutter app falls back to CanvasKit on Safari | Automatic fallback; no code changes needed. Test both renderers |
| wasm-opt breakage with Rust 1.87+ | Build fails without extra flags | Pass `--enable-bulk-memory --enable-threads --enable-nontrapping-float-to-int` to wasm-opt, or wait for upstream fix |

---

## Installation (Development Setup)

```bash
# 1. Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup toolchain install nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
rustup component add rust-src --toolchain nightly

# 2. WASM tooling
cargo install wasm-pack
cargo install flutter_rust_bridge_codegen

# 3. Flutter SDK (via official installer or fvm)
# Ensure Flutter 3.41.x stable is installed
flutter --version

# 4. Project dependencies
cd engine && cargo build           # Verify Rust compiles
cd app && flutter pub get          # Verify Flutter dependencies

# 5. Verify WASM build
cd app && flutter_rust_bridge_codegen build-web \
  --rust-crate-dir ../engine/pulijoodam-ffi
```

---

## Sources

### HIGH Confidence (Official Documentation)
- [Flutter Web Renderers](https://docs.flutter.dev/platform-integration/web/renderers) -- skwasm vs CanvasKit behavior
- [Flutter WASM Support](https://docs.flutter.dev/platform-integration/web/wasm) -- build flags, browser requirements
- [Flutter Build & Deploy Web](https://docs.flutter.dev/deployment/web) -- deployment configuration
- [flutter_rust_bridge WASM Limitations](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/wasm-limitations) -- threading, type, and panic constraints
- [flutter_rust_bridge Cross-Origin](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/web-cross-origin) -- COOP/COEP requirements
- [wasm-bindgen Releases](https://github.com/wasm-bindgen/wasm-bindgen/releases) -- v0.2.114 current
- [Rust Releases](https://blog.rust-lang.org/releases/) -- Rust 1.93.1 current stable
- [Flutter 3.41 Announcement](https://blog.flutter.dev/whats-new-in-flutter-3-41-302ec140e632) -- current stable

### MEDIUM Confidence (Verified with Multiple Sources)
- [flutter_rust_bridge GitHub](https://github.com/fzyzcjy/flutter_rust_bridge) -- v2.11.x series
- [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker) -- COOP/COEP service worker for GitHub Pages
- [Shrinking WASM Size](https://rustwasm.github.io/book/reference/code-size.html) -- Cargo.toml optimization settings
- [flutter_rust_bridge Issue #2601](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2601) -- wasm-opt + Rust 1.87+ breakage
- [Best Practices for Flutter Web Loading](https://blog.flutter.dev/best-practices-for-optimizing-flutter-web-loading-speed-7cc0df14ce5c) -- official Flutter blog

### LOW Confidence (Single Source / Needs Validation)
- flutter_rust_bridge exact latest version (pub.dev indexing lag; verify with `dart pub upgrade`)
- `forceSingleThreadedSkwasm` configuration API (verify in Flutter 3.41 docs at build time)
- Exact audioplayers version compatibility with Flutter 3.41 WASM builds (test during setup)
