# Phase 1: Scaffold & Pipeline - Research

**Researched:** 2026-03-03
**Domain:** Flutter + Rust WASM integration, CI/CD, GitHub Pages deployment
**Confidence:** MEDIUM

## Summary

Phase 1 proves the entire deployment pipeline with a trivial Rust function callable from Flutter web via WASM, deployed to GitHub Pages. The core technology is **flutter_rust_bridge (FRB) v2** (latest: 2.11.1), which generates Dart bindings from annotated Rust code and handles WASM compilation via wasm-pack + wasm-bindgen. The web platform requires **cross-origin isolation** (COOP/COEP headers) for SharedArrayBuffer support, which GitHub Pages cannot set natively -- **coi-serviceworker** provides the workaround. Panic diagnostics come from **console_error_panic_hook**, but note that `panic::catch_unwind` does NOT work in WASM -- the requirement for "zero unwrap at FFI boundary, all FFI functions return Result" is the correct strategy and is more critical than initially apparent.

Key risks: (1) wasm-pack was archived in July 2025 as part of the rustwasm org sunset, though wasm-bindgen continues under new maintainers and FRB 2.11.x still uses wasm-pack internally; (2) Rust 1.87.0+ with LLVM 20 introduced WASM compatibility issues requiring wasm-opt flag workarounds; (3) the SPEC.md's proposed monorepo structure (`engine/` + `app/`) diverges from FRB's default layout (`rust/` inside Flutter project) and needs careful adaptation via `--rust-crate-dir` configuration.

**Primary recommendation:** Use `flutter_rust_bridge_codegen create` to scaffold the project with FRB's default layout, then adapt the directory structure. Start with the simplest possible hello-world (a Rust function returning a string), get it running on GitHub Pages with CI/CD, then layer in panic hooks and cross-origin isolation. Do NOT attempt the SPEC.md's full monorepo structure in Phase 1 -- defer that to Phase 2 when the engine crate is created.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | WASM/FFI scaffold -- flutter_rust_bridge codegen generates Dart bindings from Rust, compiles to WASM, and runs in Flutter web | FRB v2.11.1 supports web via wasm-pack + wasm-bindgen. Use `flutter_rust_bridge_codegen create` to scaffold, `build-web` to compile WASM. Nightly Rust + wasm32-unknown-unknown target required. |
| INFRA-02 | GitHub Pages deployment -- CI/CD pipeline builds and deploys Flutter web app with WASM engine to GitHub Pages on push to main | GitHub Actions with `subosito/flutter-action`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`. Build with `flutter build web --wasm --base-href /pulijoodam/`. FRB `build-web` must run before `flutter build`. |
| INFRA-03 | Cross-origin isolation -- coi-serviceworker injects COOP/COEP headers for WASM support on GitHub Pages | coi-serviceworker v0.1.7 placed alongside index.html in web/ directory. Script tag in index.html. First page load triggers reload to install service worker. Must be same-origin, cannot use CDN. |
| INFRA-04 | Rust panic safety -- console_error_panic_hook installed, zero-unwrap policy at FFI boundary, all FFI functions return Result | console_error_panic_hook v0.1.7 with `set_once()` in init. CRITICAL: `panic::catch_unwind` does NOT work in WASM (panic=abort). All FFI functions MUST return `Result<T, E>` -- panics in WASM are fatal JS RuntimeErrors. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| flutter_rust_bridge | 2.11.1 | Rust-Dart binding generator with WASM support | Purpose-built for Flutter+Rust. Handles codegen, type marshalling, async, WASM. The only mature option. |
| flutter_rust_bridge_codegen | 2.11.1 | CLI for project scaffolding, code generation, web building | Companion tool. `create` scaffolds project, `generate` produces bindings, `build-web` compiles WASM. |
| console_error_panic_hook | 0.1.7 | WASM panic diagnostics to browser console | Standard for any Rust WASM project. Forwards panic messages to console.error with stack traces. |
| coi-serviceworker | 0.1.7 | Cross-origin isolation without server control | Standard solution for GitHub Pages WASM. Used by Godot, JupyterLite, Wasmer, and others. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| wasm-pack | 0.14.0 | Builds Rust to WASM with wasm-bindgen glue | Used internally by FRB's `build-web` command. Installed as prerequisite. Archived but functional. |
| wasm-bindgen | latest | Rust-JS interop layer for WASM | Dependency of FRB. Actively maintained under new org. Not installed directly. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| flutter_rust_bridge | Hand-rolled extern "C" FFI | 10x more boilerplate, no WASM support, no type safety. Never do this. |
| coi-serviceworker | Custom Cloudflare worker proxy | Over-engineered for GitHub Pages. Only needed if coi-serviceworker has issues. |
| wasm-pack | Manual cargo build + wasm-bindgen-cli | More control but FRB's build-web wraps this already. Only if wasm-pack causes issues. |

**Installation (developer machine):**
```bash
# Rust nightly toolchain with WASM target
rustup toolchain install nightly
rustup +nightly component add rust-src
rustup +nightly target add wasm32-unknown-unknown

# wasm-pack (still needed by FRB despite archival)
cargo install wasm-pack

# FRB codegen CLI
cargo install flutter_rust_bridge_codegen

# Flutter (stable channel, 3.24+ for WASM support)
# Already installed per project prerequisites
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 Only)

Phase 1 uses FRB's default layout. The SPEC.md monorepo structure (`engine/` + `app/` at root) will be adapted in Phase 2 when the actual engine crate is created.

```
pulijoodam/
├── lib/                        # Flutter/Dart code
│   ├── main.dart               # App entry point
│   └── src/
│       └── rust/               # FRB-generated Dart bindings (auto-generated, do not edit)
│           └── frb_generated.dart
├── rust/                       # Rust crate (FRB default location)
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs
│       └── api/
│           └── simple.rs       # Trivial hello-world function
├── rust_builder/               # FRB glue for building Rust with Flutter (auto-generated)
├── web/
│   ├── index.html              # Flutter web entry + coi-serviceworker script tag
│   └── coi-serviceworker.js    # Cross-origin isolation service worker
├── pubspec.yaml                # Flutter dependencies including flutter_rust_bridge
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build + deploy to GitHub Pages
├── .gitignore
├── SPEC.md
├── game-description.md
├── game-rules.md
├── board-graph.md
└── .planning/                  # Planning docs
```

### Pattern 1: FRB Trivial API Surface
**What:** A minimal Rust function exposed via FRB to prove the pipeline works.
**When to use:** Phase 1 only. Will be replaced by real engine API in later phases.
**Example:**
```rust
// rust/src/api/simple.rs
// Source: FRB quickstart pattern

pub fn greet(name: String) -> String {
    format!("Hello from Rust, {}! WASM is working.", name)
}
```

The FRB codegen reads this file and generates corresponding async Dart methods.

### Pattern 2: Panic Hook Initialization
**What:** Install console_error_panic_hook at module initialization.
**When to use:** Always, in every Rust WASM module.
**Example:**
```rust
// rust/src/api/simple.rs
use console_error_panic_hook;

pub fn init_app() {
    console_error_panic_hook::set_once();
}

// All FFI functions return Result, never unwrap
pub fn greet(name: String) -> Result<String, String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    Ok(format!("Hello from Rust, {}! WASM is working.", name))
}
```

### Pattern 3: coi-serviceworker Integration
**What:** Add cross-origin isolation headers via service worker for GitHub Pages.
**When to use:** Always for GitHub Pages WASM deployment.
**Example:**
```html
<!-- web/index.html - add BEFORE other scripts -->
<script src="coi-serviceworker.js"></script>
```

The `coi-serviceworker.js` file must be placed in the `web/` directory alongside `index.html`. On first load, it will reload the page to activate the service worker that injects COOP/COEP headers.

### Pattern 4: FRB Build Sequence for Web
**What:** The correct order of build commands for producing a deployable web app.
**When to use:** In CI/CD and local development.
**Example:**
```bash
# Step 1: Generate Dart bindings from Rust
flutter_rust_bridge_codegen generate

# Step 2: Build WASM binary from Rust
# (FRB wraps wasm-pack + wasm-bindgen internally)
dart run flutter_rust_bridge build-web

# Step 3: Build Flutter web app with WASM
flutter build web --wasm --release --base-href "/pulijoodam/"

# For local development instead of steps 2-3:
dart run flutter_rust_bridge:serve
# Or manually with headers:
# flutter run -d chrome --web-header=Cross-Origin-Opener-Policy=same-origin --web-header=Cross-Origin-Embedder-Policy=require-corp
```

### Anti-Patterns to Avoid
- **Starting with the SPEC.md monorepo structure:** FRB expects `rust/` inside the Flutter project root. Fighting this in Phase 1 adds unnecessary complexity. Adapt to the real monorepo layout when the engine crate exists (Phase 2+).
- **Using `panic::catch_unwind` in WASM:** It does not work. WASM target defaults to `panic=abort`. Use `Result` types exclusively.
- **Using `.unwrap()` or `.expect()` in FFI functions:** These cause unrecoverable WASM traps. Always return `Result`.
- **Bundling coi-serviceworker.js with app JS:** It MUST be a separate file served from your origin. Cannot be inlined or loaded from CDN.
- **Forgetting `--base-href`:** GitHub Pages serves at `username.github.io/repo-name/`. Without `--base-href "/pulijoodam/"`, all asset paths break.
- **Running `flutter build web --wasm` without `build-web` first:** The Rust WASM binary must be compiled by FRB's `build-web` command before Flutter builds the web app.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rust-Dart FFI bindings | Manual extern "C" wrappers | flutter_rust_bridge codegen | Type safety, async support, WASM support, 100+ edge cases handled |
| WASM compilation pipeline | Manual cargo + wasm-bindgen-cli + wasm-opt | FRB `build-web` command | Correct flags, toolchain management, JS glue generation |
| Cross-origin isolation | Custom proxy server or header injection | coi-serviceworker.js | Battle-tested, works on GitHub Pages, handles first-load reload |
| Panic stack traces in browser | Manual wasm-bindgen error formatting | console_error_panic_hook | Standard crate, auto-formats stack traces to console.error |
| GitHub Pages deployment | Manual file copying to gh-pages branch | actions/deploy-pages@v4 | Official GitHub action, handles artifacts, caching, OIDC tokens |

**Key insight:** Phase 1 is entirely glue and pipeline -- zero custom logic. Every component has a standard solution. The value is in getting them all working together correctly, not in building anything novel.

## Common Pitfalls

### Pitfall 1: Rust Nightly + LLVM 20 WASM Breakage
**What goes wrong:** Rust 1.87.0+ uses LLVM 20 which emits WASM binaries with new features that wasm-opt cannot process, causing build failures.
**Why it happens:** wasm-opt (bundled in wasm-pack 0.14.0) predates the new WASM features.
**How to avoid:** Pin nightly Rust to a version before 1.87.0 OR pass extra wasm-opt flags: `--enable-bulk-memory --enable-threads --enable-nontrapping-float-to-int`. Use FRB's `--wasm-pack-rustflags` if needed.
**Warning signs:** Build errors mentioning "unknown wasm features" or wasm-opt validation failures.

### Pitfall 2: Missing Cross-Origin Headers Cause Silent WASM Failure
**What goes wrong:** WASM loads but SharedArrayBuffer is unavailable. FRB async operations fail silently or throw cryptic errors.
**Why it happens:** GitHub Pages does not send COOP/COEP headers. Without coi-serviceworker, the page is not cross-origin isolated.
**How to avoid:** Always include coi-serviceworker.js. Test by checking `self.crossOriginIsolated` in browser console -- must be `true`.
**Warning signs:** `SharedArrayBuffer is not defined` errors, WASM module loads but async calls hang.

### Pitfall 3: Base Href Mismatch on GitHub Pages
**What goes wrong:** Deployed app shows blank white page. All JS/WASM asset requests return 404.
**Why it happens:** GitHub Pages serves at `/repo-name/` path. Without matching `--base-href`, assets are requested from root `/`.
**How to avoid:** Always build with `--base-href "/pulijoodam/"` (must start and end with `/`).
**Warning signs:** Network tab shows 404s for `main.dart.js`, `.wasm` files, fonts.

### Pitfall 4: coi-serviceworker First-Load Reload
**What goes wrong:** Users see a brief flash/reload on first visit. Some developers think the app is broken.
**Why it happens:** coi-serviceworker must install itself as a service worker on first visit, which requires a page reload.
**How to avoid:** This is expected behavior -- document it. Subsequent visits will not reload. Consider showing a brief loading indicator.
**Warning signs:** None -- this is working correctly if you see the reload.

### Pitfall 5: FRB Build Order Matters
**What goes wrong:** `flutter build web --wasm` succeeds but the app crashes at runtime with missing WASM module.
**Why it happens:** The FRB `build-web` step (which compiles Rust to WASM) must run BEFORE `flutter build web`. Without it, the Flutter build includes no WASM binary.
**How to avoid:** In CI, always: (1) `flutter_rust_bridge_codegen generate`, (2) `dart run flutter_rust_bridge build-web --release`, (3) `flutter build web --wasm --release`.
**Warning signs:** Build succeeds but runtime error about missing `.wasm` file or JS module.

### Pitfall 6: Panics in WASM Are Fatal
**What goes wrong:** A Rust `.unwrap()` on `None` kills the entire WASM module with an opaque "unreachable" error.
**Why it happens:** WASM target uses `panic=abort`. There is no unwinding. `catch_unwind` is a no-op.
**How to avoid:** Zero unwrap policy at FFI boundary. All public Rust functions return `Result<T, E>`. Use `console_error_panic_hook::set_once()` at init to at least get readable error messages in the console.
**Warning signs:** Browser console shows `RuntimeError: unreachable` with no context.

### Pitfall 7: wasm-pack Archived -- May Not Install Cleanly
**What goes wrong:** `cargo install wasm-pack` fails due to archived/unmaintained dependencies.
**Why it happens:** The rustwasm org was sunset in July 2025. wasm-pack 0.14.0 is the final version.
**How to avoid:** Install from the latest release binary directly (`curl -L https://github.com/rustwasm/wasm-pack/releases/download/v0.14.0/wasm-pack-v0.14.0-...`) rather than compiling from source. Alternatively, use npm: `npm i -g wasm-pack`.
**Warning signs:** Compilation errors during `cargo install wasm-pack`.

## Code Examples

### Complete Rust API (Phase 1 minimal)
```rust
// rust/src/api/simple.rs
// Source: FRB quickstart + console_error_panic_hook docs

/// Initialize the WASM module. Call once at app startup.
pub fn init_app() {
    console_error_panic_hook::set_once();
}

/// Trivial function to prove the Rust-WASM-Dart pipeline works.
pub fn greet(name: String) -> Result<String, String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    Ok(format!("Hello from Rust WASM, {}!", name))
}

/// Deliberately trigger a panic to verify console_error_panic_hook works.
/// For testing only -- demonstrates readable error messages.
pub fn test_panic() {
    panic!("This is a test panic to verify console_error_panic_hook is working");
}
```

### Rust Cargo.toml (Phase 1 minimal)
```toml
# rust/Cargo.toml
[package]
name = "pulijoodam"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "staticlib"]

[dependencies]
flutter_rust_bridge = "2.11"
console_error_panic_hook = "0.1"
```

### Flutter Dart Usage (Phase 1 minimal)
```dart
// lib/main.dart (simplified)
import 'package:flutter/material.dart';
import 'src/rust/api/simple.dart';
import 'src/rust/frb_generated.dart';

Future<void> main() async {
  await RustLib.init();
  initApp(); // Install panic hook
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Pulijoodam',
      home: Scaffold(
        appBar: AppBar(title: const Text('Pulijoodam')),
        body: Center(
          child: FutureBuilder<String>(
            future: greet(name: "World"),
            builder: (context, snapshot) {
              if (snapshot.hasData) {
                return Text(snapshot.data!, style: const TextStyle(fontSize: 24));
              } else if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              }
              return const CircularProgressIndicator();
            },
          ),
        ),
      ),
    );
  }
}
```

### coi-serviceworker Integration in index.html
```html
<!-- web/index.html - key additions marked with comments -->
<!DOCTYPE html>
<html>
<head>
  <base href="$FLUTTER_BASE_HREF">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pulijoodam</title>
  <!-- REQUIRED: coi-serviceworker for WASM on GitHub Pages -->
  <script src="coi-serviceworker.js"></script>
</head>
<body>
  <script src="flutter_bootstrap.js" async></script>
</body>
</html>
```

### GitHub Actions Workflow
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

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      # Setup Rust nightly with WASM target
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@nightly
        with:
          targets: wasm32-unknown-unknown
          components: rust-src

      # Install wasm-pack
      - name: Install wasm-pack
        run: cargo install wasm-pack

      # Install FRB codegen
      - name: Install flutter_rust_bridge_codegen
        run: cargo install flutter_rust_bridge_codegen

      # Setup Flutter
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          channel: stable

      # Install Flutter dependencies
      - name: Flutter pub get
        run: flutter pub get

      # Generate FRB bindings
      - name: Generate Dart bindings
        run: flutter_rust_bridge_codegen generate

      # Build WASM
      - name: Build WASM
        run: dart run flutter_rust_bridge build-web --release

      # Build Flutter web
      - name: Build Flutter web
        run: flutter build web --wasm --release --base-href "/pulijoodam/"

      # Copy coi-serviceworker to build output
      - name: Add coi-serviceworker
        run: cp web/coi-serviceworker.js build/web/

      # Upload to GitHub Pages
      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: build/web/

      # Deploy
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| wasm-pack as primary WASM tool | wasm-pack archived; wasm-bindgen-cli + manual build | July 2025 | FRB still wraps wasm-pack internally. Monitor for FRB migration to wasm-bindgen-cli direct. |
| `flutter build web` (JS only) | `flutter build web --wasm` (WASM native) | Flutter 3.24 (2024) | WASM is now stable for Flutter web. 40% faster load, 30% less memory. |
| `--web-renderer canvaskit` flag | Deprecated in Flutter 3.29+ | Feb 2025 | CanvasKit is now the default/only renderer for WASM builds. No flag needed. |
| FRB v1 (separate API) | FRB v2 (integrated, supports web natively) | 2024 | v2 has completely different API, project structure, and codegen. All docs must be v2. |
| dart:html / package:js | dart:js_interop | Dart 3.x | Required for WASM compilation. Old packages cannot compile to WASM. FRB v2 handles this. |

**Deprecated/outdated:**
- `--web-renderer` flag: Ignored in Flutter 3.29+
- FRB v1 API and project structure: Completely replaced by v2
- Manual `extern "C"` FFI for WASM: Use FRB instead
- wasm-pack as an actively maintained tool: Archived, but functional for now

## Open Questions

1. **wasm-pack Long-Term Viability**
   - What we know: wasm-pack 0.14.0 works with FRB 2.11.x. It was archived July 2025.
   - What's unclear: Will FRB migrate to direct wasm-bindgen-cli usage? When?
   - Recommendation: Use wasm-pack for now (it works). If installation fails in CI, install from pre-built binary. Monitor FRB releases for migration.

2. **Rust Nightly Version Pinning**
   - What we know: Rust 1.87.0+ with LLVM 20 breaks wasm-opt. FRB `build-web` requires nightly.
   - What's unclear: Exact nightly version that works reliably with FRB 2.11.1.
   - Recommendation: In CI, pin a specific nightly date (e.g., `nightly-2025-05-15`) that predates LLVM 20 issues, or use the wasm-opt workaround flags. Test locally first.

3. **FRB `build-web` vs Manual WASM Build**
   - What we know: FRB's `build-web` wraps wasm-pack internally. Manual build is also documented.
   - What's unclear: Whether `build-web` handles all the wasm-opt flag workarounds automatically.
   - Recommendation: Start with `build-web`. If it fails, fall back to manual build with explicit wasm-opt flags.

4. **SPEC.md Monorepo Structure Adaptation**
   - What we know: SPEC.md proposes `engine/` (Rust workspace) + `app/` (Flutter). FRB expects `rust/` inside Flutter project.
   - What's unclear: How cleanly FRB's `--rust-crate-dir` / `--rust-root` maps to a separate `engine/` directory.
   - Recommendation: Phase 1 uses FRB default layout (`rust/` in project root). Phase 2 restructures when adding the real engine crate, using `--rust-crate-dir` to point FRB at the correct location.

5. **Firefox WASM Compatibility**
   - What we know: Success criteria require Chrome AND Firefox. Flutter WASM uses WasmGC (supported in Firefox 120+). However, there's a known Flutter limitation with Firefox.
   - What's unclear: Whether current Flutter stable fully works on Firefox with WASM.
   - Recommendation: Test on Firefox early. If WASM fails on Firefox, fall back to JS build for Firefox (Flutter does this automatically when `--wasm` is used -- it includes a JS fallback).

## Sources

### Primary (HIGH confidence)
- [flutter_rust_bridge GitHub](https://github.com/fzyzcjy/flutter_rust_bridge) - Project structure, features, version 2.11.1
- [FRB Web Setup docs](https://cjycode.com/flutter_rust_bridge/manual/integrate/template/setup/web) - Nightly Rust, wasm-pack, build-web requirements
- [FRB Cross-Origin docs](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/web-cross-origin) - COOP/COEP headers, SharedArrayBuffer
- [FRB WASM Limitations](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/wasm-limitations) - Threading, panic, type restrictions
- [FRB Cargo Workspaces](https://cjycode.com/flutter_rust_bridge/guides/how-to/cargo-workspaces) - --rust-crate-dir configuration
- [console_error_panic_hook docs](https://docs.rs/console_error_panic_hook/latest/console_error_panic_hook/) - set_once() usage
- [coi-serviceworker GitHub](https://github.com/gzuidhof/coi-serviceworker) - Installation, placement rules, limitations
- [Flutter WASM docs](https://docs.flutter.dev/platform-integration/web/wasm) - flutter build web --wasm, browser support
- [actions/deploy-pages](https://github.com/actions/deploy-pages) - GitHub Pages deployment action
- [actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) - Artifact packaging for Pages

### Secondary (MEDIUM confidence)
- [FRB Issue #2601](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2601) - wasm-opt + LLVM 20 breakage and workaround flags
- [rustwasm sunset blog post](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/) - wasm-pack archival, wasm-bindgen continuation
- [Flutter deployment docs](https://docs.flutter.dev/deployment/web) - base-href, build commands
- [bluefireteam/flutter-gh-pages](https://github.com/bluefireteam/flutter-gh-pages) - Alternative deployment action with WASM support

### Tertiary (LOW confidence)
- Flutter 3.41.2 as current stable version -- from web search, not verified against flutter.dev release page
- Exact behavior of FRB `build-web` in CI with latest nightly -- needs validation during implementation

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - FRB is the clear choice but wasm-pack archival and LLVM 20 issues introduce version-pinning risk
- Architecture: HIGH - FRB default layout is well-documented; Phase 1 scope is minimal
- Pitfalls: HIGH - Multiple sources confirm WASM-specific gotchas (panics, cross-origin, build order)
- CI/CD: MEDIUM - Standard GitHub Actions patterns well-documented but FRB+WASM specific workflow needs testing

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days -- FRB releases frequently, check for updates)
