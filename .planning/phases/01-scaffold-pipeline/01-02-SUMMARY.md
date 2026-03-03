---
phase: 01-scaffold-pipeline
plan: 02
subsystem: infra
tags: [github-actions, github-pages, ci-cd, coi-serviceworker, wasm, cross-origin-isolation]

# Dependency graph
requires:
  - phase: 01-scaffold-pipeline/01-01
    provides: "FRB scaffold with Rust API, Flutter web entry point, WASM build pipeline"
provides:
  - "Cross-origin isolation via coi-serviceworker for WASM SharedArrayBuffer"
  - "GitHub Actions CI/CD pipeline: build Rust WASM + Flutter web, deploy to GitHub Pages"
  - "Live deployed app at GitHub Pages URL with automated deployment on push to main"
affects: [02-rust-engine-ai, 03-playable-game]

# Tech tracking
tech-stack:
  added: [coi-serviceworker, github-actions, github-pages, actions/deploy-pages, wasm-pack]
  patterns: [ci-cd-pipeline, cross-origin-isolation-serviceworker]

key-files:
  created:
    - web/coi-serviceworker.js
    - .github/workflows/deploy.yml
  modified:
    - web/index.html

key-decisions:
  - "Used coi-serviceworker (gzuidhof) for COOP/COEP header injection on GitHub Pages static hosting"
  - "Single-job CI/CD pipeline with Rust cache and Flutter pub cache for build speed"
  - "Base-href /pulijoodam/ required for GitHub Pages project-site URL routing"
  - "coi-serviceworker.js must be copied to build/web/ post-Flutter-build (Flutter build does not copy it)"
  - "Added reload guard to coi-serviceworker to prevent infinite reload loop on first install"
  - "Added rustfmt component to CI toolchain and explicit WASM output path for build reliability"

patterns-established:
  - "CI/CD build order: generate FRB bindings -> build WASM -> flutter build web --wasm"
  - "coi-serviceworker.js placed in web/ alongside index.html, copied to build output in CI"
  - "GitHub Pages deployment via actions/deploy-pages with id-token write permission"

requirements-completed: [INFRA-02, INFRA-03]

# Metrics
duration: ~45min
completed: 2026-03-03
---

# Phase 1 Plan 2: CI/CD Pipeline & GitHub Pages Deployment Summary

**Cross-origin isolation via coi-serviceworker and GitHub Actions CI/CD pipeline deploying Flutter+WASM app to GitHub Pages**

## Performance

- **Duration:** ~45 min (across multiple sessions with checkpoint verification)
- **Started:** 2026-03-03
- **Completed:** 2026-03-03
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Cross-origin isolation enabled on GitHub Pages via coi-serviceworker (self.crossOriginIsolated === true)
- GitHub Actions CI/CD pipeline builds Rust WASM, generates FRB bindings, builds Flutter web, and deploys to GitHub Pages automatically on push to main
- Live deployed app at GitHub Pages URL loads WASM pipeline correctly (skwasm + main.dart.wasm)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add coi-serviceworker for cross-origin isolation** - `ab3e55e` (feat)
2. **Task 2: Create GitHub Actions CI/CD workflow** - `09199bf` (feat)
3. **Task 3: Verify deployed app on GitHub Pages** - checkpoint:human-verify (approved, no commit needed)

**Fix commits during verification:**
- `bdab12b` - fix(ci): add rustfmt component and explicit WASM output path
- `f783b3f` - fix(web): add reload guard to coi-serviceworker to prevent infinite loop

## Files Created/Modified
- `web/coi-serviceworker.js` - Service worker that injects COOP/COEP headers for WASM SharedArrayBuffer on GitHub Pages
- `web/index.html` - Added coi-serviceworker script tag before Flutter bootstrap scripts
- `.github/workflows/deploy.yml` - CI/CD pipeline: checkout, Rust nightly + WASM target, wasm-pack, FRB codegen, Flutter build web --wasm, deploy to GitHub Pages

## Decisions Made
- Used coi-serviceworker from gzuidhof fork for reliable COOP/COEP header injection on static hosting
- Single-job build-and-deploy pipeline with Rust and Flutter caching for faster CI
- Base-href set to `/pulijoodam/` matching the GitHub repo name for correct asset loading
- coi-serviceworker.js copied to build/web/ as a CI step since Flutter build does not include it
- Added reload guard to prevent coi-serviceworker infinite reload loop during initial installation
- Added rustfmt component to Rust toolchain and explicit WASM output path for CI reliability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added rustfmt component and explicit WASM output path**
- **Found during:** Task 2 verification (CI pipeline execution)
- **Issue:** CI build failed because rustfmt was not available in the nightly toolchain, and WASM output path needed to be explicit for the build step
- **Fix:** Added `rustfmt` to the Rust toolchain components and set explicit WASM output path in the build configuration
- **Files modified:** .github/workflows/deploy.yml
- **Verification:** CI pipeline completed successfully after fix
- **Committed in:** `bdab12b`

**2. [Rule 1 - Bug] Added reload guard to coi-serviceworker**
- **Found during:** Task 3 verification (deployed app testing)
- **Issue:** coi-serviceworker caused an infinite reload loop in certain browser contexts during initial service worker installation
- **Fix:** Added a reload guard to prevent the service worker from triggering repeated page reloads
- **Files modified:** web/coi-serviceworker.js
- **Verification:** Deployed site loads correctly in clean browser context without infinite reload
- **Committed in:** `f783b3f`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were essential for a working deployment. No scope creep.

## Issues Encountered
- CI pipeline required rustfmt component not included in default nightly toolchain setup -- resolved by adding it explicitly
- coi-serviceworker infinite reload loop on first visit -- resolved by adding a reload guard check

## User Setup Required
None - GitHub Pages was already configured for the repository. CI/CD runs automatically on push to main.

## Next Phase Readiness
- Full deployment pipeline validated end-to-end: push to main triggers build and deploy
- Cross-origin isolation confirmed working (self.crossOriginIsolated === true)
- Phase 1 complete -- ready to begin Phase 2 (Rust Engine & AI) with confidence that any Rust engine code will deploy correctly via the established pipeline

## Self-Check: PASSED

- FOUND: web/coi-serviceworker.js
- FOUND: web/index.html
- FOUND: .github/workflows/deploy.yml
- FOUND: 01-02-SUMMARY.md
- FOUND: commit ab3e55e
- FOUND: commit 09199bf
- FOUND: commit bdab12b
- FOUND: commit f783b3f

---
*Phase: 01-scaffold-pipeline*
*Completed: 2026-03-03*
