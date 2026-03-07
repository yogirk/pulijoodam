---
phase: 04-multiplayer-pwa
plan: 03
subsystem: pwa, performance, ci
tags: [vite-plugin-pwa, service-worker, react-memo, lazy-loading, github-actions, workbox]

requires:
  - phase: 04-multiplayer-pwa (01, 02)
    provides: drag-to-move, accessibility, P2P multiplayer
provides:
  - PWA offline support via service worker (workbox)
  - Web app manifest with SVG icons for installability
  - Install prompt banner (second visit, dismissable)
  - React.memo on Board/piece components for render optimization
  - React.lazy for TutorialScreen, HistoryScreen, ReplayScreen
  - CI/CD pipeline with lint + test + build gates
  - ESLint config with complete browser globals
affects: []

tech-stack:
  added: [vite-plugin-pwa, rollup-plugin-visualizer, workbox]
  patterns: [React.memo for SVG components, React.lazy with Suspense, useMemo for derived sets]

key-files:
  created:
    - src/pwa/InstallPrompt.tsx
    - src/pwa/InstallPrompt.test.tsx
    - src/vite-env.d.ts
    - public/pwa-192x192.svg
    - public/pwa-512x512.svg
  modified:
    - vite.config.ts
    - src/main.tsx
    - src/App.tsx
    - src/components/Board/Board.tsx
    - src/components/Board/GoatPiece.tsx
    - src/components/Board/TigerPiece.tsx
    - src/components/Board/BoardNode.tsx
    - src/components/Board/BoardEdge.tsx
    - src/components/SetupScreen/SetupScreen.tsx
    - .github/workflows/deploy.yml
    - eslint.config.js

key-decisions:
  - "PWA autoUpdate strategy: silent SW updates, no user notification"
  - "SVG icons referenced directly in manifest (modern browser support)"
  - "localStorage-based visit counting for install prompt timing"
  - "React.memo on all Board sub-components to prevent unnecessary SVG re-renders"
  - "useMemo for highlightedNodes set computation in Board"
  - "no-explicit-any suppressed in test files for mock patterns"

patterns-established:
  - "React.memo wrapper pattern for SVG piece components"
  - "React.lazy with .then(m => default) for named exports"
  - "InstallPrompt rendered on every screen via App.tsx"

requirements-completed: [PROD-01, PROD-06, PROD-07, PROD-08, PROD-09, PROD-10]

duration: 9min
completed: 2026-03-07
---

# Phase 4 Plan 3: PWA + Performance + CI Summary

**PWA with workbox service worker for offline play, install prompt on second visit, React.memo/lazy optimization, and CI pipeline with lint+test gates**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-07T08:58:26Z
- **Completed:** 2026-03-07T09:07:45Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 17

## Accomplishments
- Full offline support via workbox service worker caching all static assets
- PWA manifest with icons enables install-to-homescreen on mobile and desktop
- Install prompt appears on second visit, can be permanently dismissed
- Board and piece components wrapped in React.memo to prevent unnecessary re-renders
- Tutorial, History, and Replay screens lazy-loaded (separate chunks)
- CI pipeline runs lint, tests, and build before deploying to GitHub Pages
- Bundle size: 348KB total (76KB gzipped main JS) -- well under 1MB target
- ESLint config updated with complete browser globals for clean CI runs

## Task Commits

Each task was committed atomically:

1. **Task 1: PWA setup, performance optimization, and install prompt** - `5061743` (feat)
2. **Task 2: CI/CD pipeline and bundle size audit** - `fcbcaf5` (chore)
3. **Task 3: Verify PWA offline, installability, and responsive layout** - auto-approved (checkpoint)

## Files Created/Modified
- `vite.config.ts` - VitePWA plugin with manifest, workbox, and optional visualizer
- `src/main.tsx` - Service worker registration via virtual:pwa-register
- `src/App.tsx` - Lazy imports for Tutorial/History/Replay, InstallPrompt on all screens
- `src/vite-env.d.ts` - Type references for Vite and PWA virtual modules
- `src/pwa/InstallPrompt.tsx` - Install banner with visit counting and dismiss
- `src/pwa/InstallPrompt.test.tsx` - 4 tests for install prompt behavior
- `public/pwa-192x192.svg` - PWA icon (tiger diamond on terracotta circle)
- `public/pwa-512x512.svg` - PWA icon large (maskable)
- `src/components/Board/Board.tsx` - React.memo wrapper, useMemo for highlightedNodes
- `src/components/Board/GoatPiece.tsx` - React.memo wrapper
- `src/components/Board/TigerPiece.tsx` - React.memo wrapper
- `src/components/Board/BoardNode.tsx` - React.memo wrapper
- `src/components/Board/BoardEdge.tsx` - React.memo wrapper
- `src/components/SetupScreen/SetupScreen.tsx` - flex-wrap on difficulty buttons
- `.github/workflows/deploy.yml` - Lint + test steps, v4 artifact action
- `eslint.config.js` - Complete browser globals, test file relaxation

## Decisions Made
- PWA uses autoUpdate (silent) -- no update notifications to user
- SVG icons referenced directly in manifest; modern browsers handle them natively
- Install prompt tracks visits via localStorage, shows on 2nd+ visit only
- React.memo applied to all Board sub-components (edges, nodes, pieces)
- useMemo for highlightedNodes set prevents recomputation on unrelated state changes
- Suppressed no-explicit-any in test files to allow globalThis mocking patterns
- Added comprehensive browser globals to ESLint config for clean CI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing TypeScript errors in multiplayer code**
- **Found during:** Task 1 (build step)
- **Issue:** Unused variables in JoinScreen.tsx, useP2PGame.ts, webrtc.ts blocking tsc build
- **Fix:** Prefixed unused vars with underscore or removed unused imports/variables
- **Files modified:** src/multiplayer/JoinScreen.tsx, src/multiplayer/useP2PGame.ts, src/multiplayer/webrtc.ts
- **Verification:** tsc -b passes, build succeeds
- **Committed in:** 5061743 (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed ESLint config missing browser globals**
- **Found during:** Task 2 (lint step)
- **Issue:** ESLint no-undef errors for AudioContext, localStorage, SVGSVGElement, RTCPeerConnection, etc.
- **Fix:** Added 20+ browser globals to eslint.config.js, suppressed no-explicit-any in test files
- **Files modified:** eslint.config.js
- **Verification:** npm run lint passes with 0 errors
- **Committed in:** fcbcaf5 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 3 - blocking)
**Impact on plan:** Both fixes required to make CI pipeline functional. No scope creep.

## Issues Encountered
- happy-dom localStorage.clear() not a function -- used localStorage mock pattern consistent with existing tests (useSettings.test.ts)
- macOS `du -sb` flag not available -- used `du -sh` for human-readable size verification

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 complete: all 3 plans executed
- App is a fully functional PWA with offline support, installability, P2P multiplayer
- CI pipeline validates lint + tests + build on every push to main
- Bundle well within size target at 348KB
- Ready for production deployment to GitHub Pages

## Self-Check: PASSED

All created files verified present. All commit hashes verified in git log.

---
*Phase: 04-multiplayer-pwa*
*Completed: 2026-03-07*
