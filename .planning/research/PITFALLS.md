# Domain Pitfalls

**Domain:** Rust game engine + Flutter web app (traditional board game via flutter_rust_bridge FFI, WASM, GitHub Pages)
**Researched:** 2026-03-03

---

## Critical Pitfalls

Mistakes that cause rewrites, major rework, or blocked deployments.

### Pitfall 1: Cross-Origin Isolation Headers on GitHub Pages

**What goes wrong:** flutter_rust_bridge's async WASM mode requires `SharedArrayBuffer`, which requires cross-origin isolation (COOP/COEP headers). GitHub Pages does not allow custom HTTP headers. Without these headers, `SharedArrayBuffer` is unavailable, meaning multi-threaded WASM and async Rust-to-Dart communication may silently fail or degrade.

**Why it happens:** Developers build and test locally with `flutter run --web-header=Cross-Origin-Opener-Policy=same-origin --web-header=Cross-Origin-Embedder-Policy=require-corp`, everything works, then deploy to GitHub Pages where those headers cannot be set. The app either crashes or silently falls back to degraded single-threaded mode.

**Consequences:** AI computation blocks the main thread, UI freezes during AI turns, or the app fails to load entirely on production. This is discovered late because local dev works fine.

**Prevention:**
- Use `coi-serviceworker` (a service worker that injects COOP/COEP headers client-side) from day one. Include it in your `index.html` before any other scripts.
- Test deployment to GitHub Pages in the very first milestone, not after the engine is built.
- Configure flutter_rust_bridge with `default_dart_async: false` as a fallback, using `#[frb(sync)]` for functions that must work without cross-origin isolation.
- Validate that the service worker approach works on Safari (Safari has additional restrictions on nested Workers).

**Detection:** App works locally but shows blank screen or frozen UI on GitHub Pages. Console errors about `SharedArrayBuffer` or cross-origin isolation.

**Phase:** Must be addressed in Phase 1 (FFI/WASM scaffold). Validate deployment to GitHub Pages before writing any game logic.

**Confidence:** HIGH -- GitHub Pages header limitation is confirmed in [GitHub Community Discussion #13309](https://github.com/orgs/community/discussions/13309) and the `coi-serviceworker` workaround is documented in [flutter_rust_bridge cross-origin docs](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/web-cross-origin).

---

### Pitfall 2: AI Computation Blocking the Browser Main Thread

**What goes wrong:** Minimax with alpha-beta pruning at depth 6+ or MCTS with thousands of simulations takes hundreds of milliseconds to seconds. In WASM, this runs on the browser's main thread (unless explicitly moved to a Web Worker), freezing the UI completely. The user sees a hung app during AI turns.

**Why it happens:** Native Rust uses OS threads trivially. WASM has no native threading -- `std::thread::spawn` does not work. Developers write threaded Rust code that compiles to WASM but silently becomes single-threaded, or panics at runtime.

**Consequences:** UI freezes for 2-5 seconds on Expert difficulty. Users think the app crashed. On mobile browsers, the OS may kill the tab. The "AI move < 2s at Hard" performance constraint becomes impossible to meet without architectural changes.

**Prevention:**
- Design the AI computation as a message-passing architecture from the start: Dart spawns a Web Worker, sends game state, receives the move result.
- Use flutter_rust_bridge's Web Worker support or manually create a dedicated Worker that loads the WASM module independently.
- Implement iterative deepening with time budgets: the AI searches progressively deeper and returns the best move found when the budget expires (e.g., 1.5s for Hard, 4s for Expert).
- For MCTS, use iteration-count budgets rather than time-based budgets to avoid variance across devices.
- Profile WASM performance early: WASM runs at roughly 60-80% of native speed for compute-heavy Rust. A minimax that takes 1s natively may take 1.5-2s in WASM.

**Detection:** UI freezes during AI turns. DevTools shows long tasks (>50ms) on the main thread. `performance.now()` measurements show AI calls taking >100ms.

**Phase:** Must be architectured in Phase 1 (engine API design), implemented in Phase 2 (AI). The Command/Event pattern in PROJECT.md supports this -- commands go to the Worker, events come back.

**Confidence:** HIGH -- WASM single-threaded limitation is well-documented. The [Rust WASM multithreading guide](https://rustwasm.github.io/2018/10/24/multithreading-rust-and-wasm.html) confirms Web Workers are the solution.

---

### Pitfall 3: flutter_rust_bridge Codegen Version Drift and Build Breakage

**What goes wrong:** flutter_rust_bridge requires exact version alignment between the Dart package (`flutter_rust_bridge`), the Rust crate (`flutter_rust_bridge`), and the codegen tool (`flutter_rust_bridge_codegen`). A mismatch causes cryptic build failures. Additionally, Rust toolchain updates (especially LLVM version bumps) break wasm-opt compatibility.

**Why it happens:** `cargo update` or `flutter pub upgrade` independently bumps one side. Rust 1.87+ with LLVM 20 produces WASM binaries that older `wasm-opt` cannot process, causing "Bulk memory operations require bulk memory" errors. The codegen silently modifies `Cargo.toml` version constraints in some cases.

**Consequences:** Build fails with opaque error messages. CI pipeline breaks after a routine dependency update. Hours lost debugging toolchain interactions. In the worst case, you pin to an old Rust version and miss security patches.

**Prevention:**
- Pin all three flutter_rust_bridge versions explicitly in both `pubspec.yaml` and `Cargo.toml`. Never use `^` ranges for this dependency.
- Pin the Rust toolchain version in `rust-toolchain.toml` at the project root. Test Rust version upgrades in a separate branch.
- For Rust 1.87+/LLVM 20+ wasm-opt failures, pass `--enable-bulk-memory --enable-threads --enable-nontrapping-float-to-int` flags to wasm-opt in the build script.
- Run `flutter_rust_bridge_codegen generate` in CI and fail if the generated files differ from committed files (ensures codegen is never stale).
- Lock `wasm-pack` or the build tooling version in CI explicitly.

**Detection:** Build fails after `cargo update` or Rust toolchain update. Error messages mention `wasm-opt`, version mismatches, or "codegen version should be the same as runtime version."

**Phase:** Phase 1 (project scaffold). Set up version pinning and CI validation before writing any application code.

**Confidence:** HIGH -- The wasm-opt/LLVM 20 issue is tracked in [flutter_rust_bridge #2601](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2601) and [rust-lang #141080](https://github.com/rust-lang/rust/issues/141080). Version mismatch errors are documented in [flutter_rust_bridge troubleshooting](https://cjycode.com/flutter_rust_bridge/manual/troubleshooting).

---

### Pitfall 4: Rust Panics in WASM Crash the Entire App

**What goes wrong:** An unhandled Rust panic (array out of bounds, `.unwrap()` on `None`, integer overflow in debug) in WASM aborts the entire WebAssembly instance. The Flutter app sees an unresolved JavaScript promise or a hard crash with no recovery path. Unlike native where you might get a crash report, WASM panics produce opaque "unreachable" errors in the browser console.

**Why it happens:** The `wasm32-unknown-unknown` target defaults to `panic = "abort"`. `std::panic::catch_unwind` has no effect. Developers write Rust with `.unwrap()` and `.expect()` during prototyping, which works fine in tests but any edge case in production kills the web app silently.

**Consequences:** User sees a blank screen or frozen UI with no error message. No crash telemetry. Extremely difficult to debug in production. The game state is lost.

**Prevention:**
- Add `console_error_panic_hook` as the very first thing in WASM initialization. This converts panics to `console.error` with full stack traces.
- Adopt a zero-unwrap policy in any code that runs through WASM FFI. Use `Result<T, E>` everywhere and propagate errors to Dart as typed error enums.
- The engine API boundary (the FFI layer) must catch all errors and return them as `Result` types that flutter_rust_bridge marshals into Dart exceptions.
- Write property-based tests (using `proptest` or `quickcheck`) for the game engine to catch edge cases that cause panics.
- In CI, run the WASM build with `RUST_BACKTRACE=1` and test all FFI functions to verify no panics escape.

**Detection:** Browser console shows "RuntimeError: unreachable executed" or "Uncaught (in promise)" errors. App goes blank after certain game states.

**Phase:** Phase 1 (engine scaffold). Establish error handling patterns before writing game logic. Every function exposed through FFI must return `Result`.

**Confidence:** HIGH -- The [console_error_panic_hook](https://github.com/rustwasm/console_error_panic_hook) crate exists specifically for this. The panic=abort behavior is documented in the Rust WASM target specification.

---

## Moderate Pitfalls

### Pitfall 5: CanvasKit Bundle Size and Initial Load Time

**What goes wrong:** CanvasKit adds ~1.5MB to the initial download. Combined with the Rust WASM binary (potentially 500KB-2MB depending on AI complexity) and Flutter's main.dart.js, the total initial payload exceeds 4MB. On slow connections (common in rural India, the target audience for a South Indian traditional game), this means 10+ second load times.

**Why it happens:** CanvasKit is now the default and only renderer for Flutter web (HTML renderer removed in Flutter 3.29). There is no opt-out. The Rust WASM binary includes the full AI engine, board logic, and any static data.

**Prevention:**
- Use Flutter's deferred loading (`deferred as`) for non-critical features (tutorial, replay, settings).
- Compile the Rust WASM binary with `wasm-opt -Oz` for size optimization, and enable LTO (`lto = true` in `Cargo.toml` release profile).
- Use `wee_alloc` as the global allocator in the WASM build to save ~10KB of allocator code.
- Self-host CanvasKit from your GitHub Pages domain with proper cache headers instead of loading from Google's CDN (avoids CORS issues and enables service worker caching).
- Add a loading screen/progress indicator in `index.html` (pure HTML/CSS, before Flutter loads) so users see immediate feedback.
- Set up service worker caching so repeat visits are instant.

**Detection:** Lighthouse performance audit shows >3s Time to Interactive. Initial load on throttled network (3G simulation in DevTools) exceeds 8 seconds.

**Phase:** Phase 1 (scaffold) for the loading screen. Phase 3-4 (polish) for bundle optimization. Measure baseline early.

**Confidence:** MEDIUM -- The 1.5MB CanvasKit figure is from [Flutter issue #89616](https://github.com/flutter/flutter/issues/89616). Flutter's move toward WASM compilation (Flutter 3.35+) may reduce this, but the timeline is uncertain.

---

### Pitfall 6: Service Worker Caching Causes Stale Deployments

**What goes wrong:** After deploying a new version to GitHub Pages, users continue seeing the old version. The Flutter service worker aggressively caches `index.html`, `main.dart.js`, and CanvasKit. Even hard-refreshing may not clear the cache. Users must manually clear browser data.

**Why it happens:** Flutter generates a service worker (`flutter_service_worker.js`) that caches everything for offline support. The browser caches `index.html` itself, and even if the server has a new version, the service worker intercepts the request and serves the cached version.

**Consequences:** Bug fixes and new features don't reach users. "It works on my machine" but users report the old bug. Particularly problematic for a game where rule fixes need to propagate immediately.

**Prevention:**
- Configure the service worker for "network-first" strategy for `index.html` by customizing `flutter_service_worker.js` or using a `serviceWorkerVersion` parameter tied to build timestamps.
- Add cache-busting query parameters to critical asset references in `index.html`.
- Implement a version check: on app startup, fetch a `version.json` from the server (with cache-busting), compare with the cached version, and trigger a cache clear + reload if different.
- In `index.html`, set `serviceWorkerVersion` to a unique build hash or timestamp.
- Consider disabling the service worker entirely if offline support is not critical for v1 (it likely is not for a game with server-less AI).

**Detection:** Deploy a change, open the app in a browser that previously loaded the old version, and verify the new version appears. Automate this check in CI with version assertions.

**Phase:** Phase 1 (deployment scaffold). Configure service worker strategy when setting up GitHub Pages deployment.

**Confidence:** HIGH -- This is one of the most reported Flutter web issues. See [Flutter #106943](https://github.com/flutter/flutter/issues/106943) and [Flutter #164613](https://github.com/flutter/flutter/issues/164613).

---

### Pitfall 7: CustomPainter Repainting the Entire Board Every Frame

**What goes wrong:** `CustomPainter.paint()` redraws the entire board (23 nodes, all edges, all pieces, labels) on every frame during animations, causing GPU frame times to spike from ~12ms to 30-50ms, dropping below 60fps.

**Why it happens:** Developers put the entire board rendering in a single `CustomPainter` without using `RepaintBoundary` or `shouldRepaint` optimization. Any state change (a piece moving, a highlight appearing) triggers a full repaint of the entire canvas.

**Consequences:** Janky animations during piece movement and captures. Particularly bad on low-end mobile browsers. The "60fps" requirement becomes unreachable.

**Prevention:**
- Layer the rendering: static board (grid lines, node positions) in one `CustomPainter` wrapped in `RepaintBoundary`, pieces in a separate `CustomPainter`, animations/highlights in a third layer.
- The static board layer should almost never repaint (only on theme change or resize). Use `shouldRepaint` to return `false` when the board geometry hasn't changed.
- For piece movement animations, only repaint the pieces layer, not the board layer.
- Use `Canvas.saveLayer()` sparingly -- it forces GPU texture allocation per layer.
- Profile with Flutter DevTools in profile mode (not debug mode, which is 5-10x slower for rendering).
- For capture animations (particle bursts), consider using a `RawImage` or pre-rendered sprite sheet rather than real-time particle simulation in `CustomPainter`.

**Detection:** Flutter DevTools "Performance" tab shows frame render times >16ms. The "Raster" thread shows high GPU frame times.

**Phase:** Phase 2 (board rendering). Design the painter layer hierarchy before implementing animations.

**Confidence:** MEDIUM -- Based on known Flutter CustomPainter performance characteristics from [Flutter #72066](https://github.com/flutter/flutter/issues/72066) and [Flutter performance docs](https://docs.flutter.dev/perf/best-practices). The specific board complexity (23 nodes) is moderate and should be manageable with proper layering.

---

### Pitfall 8: Web Audio Playback Failures on Mobile Browsers

**What goes wrong:** Sound effects fail to play on iOS Safari and some Android browsers. AudioContext creation requires a user gesture. Sounds that work in desktop Chrome are silent on mobile.

**Why it happens:** Mobile browsers enforce a strict autoplay policy: an `AudioContext` can only be created (or resumed) in response to a user tap/click event. If the audio system is initialized on app startup rather than on first user interaction, all subsequent `play()` calls are silently ignored.

**Consequences:** Sound toggle exists but sounds never play on mobile. No error messages -- the API succeeds silently. Users on mobile (likely the primary audience for a casual board game) get a degraded experience.

**Prevention:**
- Initialize the AudioContext lazily on the first user tap, not on app startup. Store a "audio context initialized" flag and create it in the first `onTap` handler.
- Pre-decode all audio assets after AudioContext initialization (they are small: place, slide, capture, win/lose sounds).
- Use the Web Audio API directly through Dart's `package:web` (or JS interop) rather than relying on Flutter audio packages that may not handle the web platform well.
- Test on real iOS Safari and Android Chrome early. The iOS simulator does not accurately reproduce audio restrictions.
- Implement a graceful fallback: if AudioContext creation fails, disable sound silently and hide the sound toggle.

**Detection:** Open the app on iOS Safari, tap around, no sounds play. Console shows no errors (it fails silently).

**Phase:** Phase 3 (sound effects). But design the audio initialization pattern in Phase 2 when building the UI shell.

**Confidence:** MEDIUM -- Based on well-known Web Audio API restrictions. See [howler.js iOS issues](https://github.com/goldfire/howler.js/issues/1220) and general browser autoplay policies.

---

### Pitfall 9: GitHub Pages Base Href Misconfiguration

**What goes wrong:** The Flutter web app loads a blank white screen when deployed to GitHub Pages at `username.github.io/pulijoodam/`. All asset requests (main.dart.js, CanvasKit, WASM binary, fonts) return 404 because they request from the root path instead of the repository subpath.

**Why it happens:** Flutter's `index.html` defaults to `<base href="/">`. GitHub Pages project sites serve from a subpath (`/repository-name/`). Without `--base-href=/pulijoodam/` in the build command, every asset URL is wrong.

**Consequences:** Blank white screen in production. The app works perfectly on `localhost` but fails completely on GitHub Pages. This is the single most common Flutter web deployment failure.

**Prevention:**
- Always build with `flutter build web --base-href=/pulijoodam/ --release`.
- Encode the `--base-href` value in the GitHub Actions workflow file, not as a manual step.
- The WASM binary path must also respect the base href -- verify that flutter_rust_bridge's WASM loader resolves the `.wasm` file relative to the base, not the root.
- Test the built output by serving it locally with a subpath: `python3 -m http.server -d build/web` and access via `http://localhost:8000/pulijoodam/` (using a local reverse proxy or symlink to simulate the subpath).

**Detection:** Blank screen on GitHub Pages. Browser DevTools Network tab shows 404 errors for JS and WASM files.

**Phase:** Phase 1 (deployment scaffold). Get this right in the first CI pipeline.

**Confidence:** HIGH -- This is the #1 reported Flutter web deployment issue. See [Flutter #95503](https://github.com/flutter/flutter/issues/95503) and [Flutter #98189](https://github.com/flutter/flutter/issues/98189).

---

## Minor Pitfalls

### Pitfall 10: wasm-bindgen Ownership Transfers Dropping Rust Objects

**What goes wrong:** When Rust functions return objects through wasm-bindgen/flutter_rust_bridge, ownership transfers to JavaScript. If the Dart side doesn't hold a reference, the Rust object is dropped. Subsequent access from Dart causes "null pointer" or "use after free" style WASM traps.

**Prevention:**
- Design the FFI API to be stateless where possible: send game state as serialized data (Command pattern), receive results as serialized data (Event pattern). The PROJECT.md's Command/Event pattern naturally avoids this.
- When stateful handles are necessary (e.g., an AI search context), wrap them in Dart classes with explicit `dispose()` methods.
- Never pass Rust Vec references across FFI -- data is copied, not shared. Design APIs to accept and return owned data.

**Phase:** Phase 1 (FFI API design). The Command/Event architecture already mitigates this.

**Confidence:** HIGH -- Documented in [wasm-bindgen pitfalls](https://www.rossng.eu/posts/2025-01-20-wasm-bindgen-pitfalls/).

---

### Pitfall 11: Rust Edition 2024 / Resolver 3 Incompatibility

**What goes wrong:** flutter_rust_bridge codegen may not support the latest Rust edition (2024) or Cargo resolver version (3). Using them causes build failures or codegen errors.

**Prevention:**
- Start with Rust edition 2021 and resolver 2 in `Cargo.toml`. Only upgrade after confirming flutter_rust_bridge compatibility.
- Check the [flutter_rust_bridge #2576](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2576) issue for current status before upgrading.

**Phase:** Phase 1 (project scaffold).

**Confidence:** MEDIUM -- Issue reported but may be resolved in newer flutter_rust_bridge releases.

---

### Pitfall 12: Accessibility Semantics Invisible to Testing Tools

**What goes wrong:** Flutter web renders to a canvas, making the DOM invisible to standard web testing tools and screen readers unless the semantics tree is explicitly enabled. Testing tools (Cypress, Playwright) cannot find widgets by text or role.

**Prevention:**
- Enable semantics from app startup with `WidgetsBinding.instance.ensureSemantics()` or use `SemanticsBinding.instance.ensureSemantics()`.
- Add `Semantics` widgets to all interactive game elements: board nodes, pieces, buttons.
- For the board, provide semantic labels like "Node A1: Tiger" or "Node B3: empty, valid move target" for screen reader navigation.
- Test with VoiceOver (macOS/iOS) and ChromeVox during development, not as an afterthought.

**Phase:** Phase 2 (board rendering) for semantic labels. Phase 3 (polish) for screen reader testing.

**Confidence:** MEDIUM -- Flutter's 2025 semantics improvements (80% faster tree compilation, 30% frame time reduction with semantics enabled) help, but the fundamental canvas-based architecture still requires explicit semantic annotations. See [Flutter web accessibility docs](https://docs.flutter.dev/ui/accessibility/web-accessibility).

---

### Pitfall 13: GitHub Secret Scanning Flags CanvasKit Build Output

**What goes wrong:** When pushing Flutter web build output (which includes CanvasKit) to a GitHub branch for Pages deployment, GitHub's secret scanning may flag content in the CanvasKit directory as potential secrets, blocking the push or creating false alerts.

**Prevention:**
- Use GitHub Actions to build and deploy to the `gh-pages` branch, rather than pushing build artifacts from a local machine.
- Add the CanvasKit directory to `.gitignore` in the source branch. Only the deployment action should write to `gh-pages`.
- If using the `peaceiris/actions-gh-pages` or similar actions, the deployment happens in an automated context that may handle these flags differently.

**Phase:** Phase 1 (CI/CD setup).

**Confidence:** MEDIUM -- Reported in [Flutter #145796](https://github.com/flutter/flutter/issues/145796). May depend on repository settings.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Phase 1: FFI/WASM Scaffold | Cross-origin isolation on GitHub Pages (#1) | Add `coi-serviceworker`, test deployment immediately | Critical |
| Phase 1: FFI/WASM Scaffold | Base href misconfiguration (#9) | Encode `--base-href` in CI workflow | Critical |
| Phase 1: FFI/WASM Scaffold | Codegen version drift (#3) | Pin all FRB versions, validate in CI | Critical |
| Phase 1: FFI/WASM Scaffold | Rust panic handling (#4) | Add `console_error_panic_hook`, zero-unwrap policy | Critical |
| Phase 1: FFI/WASM Scaffold | Rust edition incompatibility (#11) | Start with edition 2021 | Minor |
| Phase 2: Game Engine + AI | AI blocking main thread (#2) | Web Worker architecture, iterative deepening | Critical |
| Phase 2: Board Rendering | CustomPainter full repaint (#7) | Layer static board / pieces / animations | Moderate |
| Phase 2: Board Rendering | Accessibility semantics (#12) | Add Semantics widgets from the start | Moderate |
| Phase 3: Sound & Polish | Web Audio mobile failures (#8) | Lazy AudioContext init on first tap | Moderate |
| Phase 3: Polish & Deploy | Stale cache after deployment (#6) | Version check + cache-busting strategy | Moderate |
| Phase 3: Polish & Deploy | Bundle size / load time (#5) | Deferred loading, wasm-opt -Oz, loading screen | Moderate |
| Phase 1: CI/CD | Secret scanning flags (#13) | Build in CI, deploy via Actions only | Minor |

---

## Key Takeaway

The most dangerous pitfalls for this project cluster around the **deployment boundary**: the gap between "works on localhost" and "works on GitHub Pages." Cross-origin isolation headers, base href routing, service worker caching, and CanvasKit loading all interact in ways that are invisible during local development. The single most important risk mitigation is to **deploy a minimal hello-world to GitHub Pages through the full flutter_rust_bridge WASM pipeline in Phase 1, before writing any game logic.** If the deployment pipeline works for a trivial app, it will work for the real app. If it doesn't, you'll find out in hours instead of weeks.

---

## Sources

- [flutter_rust_bridge WASM limitations](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/wasm-limitations)
- [flutter_rust_bridge cross-origin docs](https://cjycode.com/flutter_rust_bridge/manual/miscellaneous/web-cross-origin)
- [flutter_rust_bridge troubleshooting](https://cjycode.com/flutter_rust_bridge/manual/troubleshooting)
- [GitHub Community: COOP/COEP headers on GitHub Pages](https://github.com/orgs/community/discussions/13309)
- [Wasmer: Patching COOP/COEP for GitHub Pages](https://docs.wasmer.io/sdk/wasmer-js/how-to/coop-coep-headers)
- [coi-serviceworker for static hosting](https://blog.tomayac.com/2025/03/08/setting-coop-coep-headers-on-static-hosting-like-github-pages/)
- [wasm-opt LLVM 20 failure: flutter_rust_bridge #2601](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2601)
- [wasm-opt LLVM 20 failure: rust-lang #141080](https://github.com/rust-lang/rust/issues/141080)
- [wasm-bindgen ownership pitfalls](https://www.rossng.eu/posts/2025-01-20-wasm-bindgen-pitfalls/)
- [wasm-bindgen vec parameter pitfalls](https://www.rossng.eu/posts/2025-02-22-wasm-bindgen-vec-parameters/)
- [console_error_panic_hook](https://github.com/rustwasm/console_error_panic_hook)
- [Rust WASM multithreading](https://rustwasm.github.io/2018/10/24/multithreading-rust-and-wasm.html)
- [Flutter web base href issue #95503](https://github.com/flutter/flutter/issues/95503)
- [Flutter web 404 routing issue #98189](https://github.com/flutter/flutter/issues/98189)
- [Flutter service worker caching #106943](https://github.com/flutter/flutter/issues/106943)
- [Flutter cache busting #164613](https://github.com/flutter/flutter/issues/164613)
- [CanvasKit bundle size #89616](https://github.com/flutter/flutter/issues/89616)
- [Flutter CustomPainter performance #72066](https://github.com/flutter/flutter/issues/72066)
- [Flutter web accessibility docs](https://docs.flutter.dev/ui/accessibility/web-accessibility)
- [Flutter performance best practices](https://docs.flutter.dev/perf/best-practices)
- [CanvasKit secret scanning #145796](https://github.com/flutter/flutter/issues/145796)
- [flutter_rust_bridge Rust edition 2024 #2576](https://github.com/fzyzcjy/flutter_rust_bridge/issues/2576)
- [WASM native vs performance benchmarks](https://karnwong.me/posts/2024/12/native-implementation-vs-wasm-for-go-python-and-rust-benchmark/)
- [Flutter web loading speed optimization](https://medium.com/flutter/best-practices-for-optimizing-flutter-web-loading-speed-7cc0df14ce5c)
