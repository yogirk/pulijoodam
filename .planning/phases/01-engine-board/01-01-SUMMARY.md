---
phase: 01-engine-board
plan: 01
subsystem: infra
tags: [vite, react, typescript, tailwind, vitest, eslint, testing]

requires: []

provides:
  - Vite 6 + React 19 + TypeScript 5 project scaffold (builds to dist/)
  - Vitest 3 test runner with globals and node/jsdom environment support
  - Tailwind v4 via @tailwindcss/vite plugin (no PostCSS, no config file)
  - ESLint v9 flat config with engine-purity no-restricted-imports rule
  - Split tsconfig: app (excludes tests) + test (vitest/globals types)
  - 9 Wave 0 test stub files covering all engine + UI modules (82 pending tests)

affects:
  - 01-02 (board topology + move engine — all engine test stubs ready)
  - 01-03 (SVG board + interaction — Board/BoardNode/GameScreen stubs ready)
  - All subsequent plans (test infrastructure, build pipeline)

tech-stack:
  added:
    - vite@6
    - react@19 + react-dom@19
    - typescript@5
    - tailwindcss@4 + @tailwindcss/vite@4
    - vitest@3 + @vitest/coverage-v8@3
    - @testing-library/react@16 + @testing-library/jest-dom@6
    - jsdom@25
    - eslint@9 + @typescript-eslint/{parser,eslint-plugin}@8
  patterns:
    - ESLint v9 flat config (eslint.config.js) — .eslintrc.* is obsolete in ESLint 9
    - Split tsconfig pattern: tsconfig.app.json excludes tests; tsconfig.test.json adds vitest/globals types
    - Tailwind v4 zero-config: single @import "tailwindcss" in index.css, plugin in vite.config.ts
    - Vitest globals: configured via globals:true in vite.config.ts test block; test files use describe/it without imports
    - Wave 0 stubs: all test files use it.todo() so vitest reports pending (not failed) until implemented

key-files:
  created:
    - package.json
    - vite.config.ts
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.test.json
    - index.html
    - eslint.config.js
    - src/main.tsx
    - src/App.tsx
    - src/index.css
    - src/engine/board.test.ts
    - src/engine/state.test.ts
    - src/engine/moves.test.ts
    - src/engine/rules.test.ts
    - src/engine/history.test.ts
    - src/hooks/useGame.test.ts
    - src/components/Board/Board.test.tsx
    - src/components/Board/BoardNode.test.tsx
    - src/components/GameScreen/GameScreen.test.tsx
  modified:
    - .gitignore
    - .planning/config.json

key-decisions:
  - "ESLint v9 flat config (eslint.config.js) required — .eslintrc.cjs not supported in ESLint 9"
  - "Split tsconfig: app excludes *.test.ts so tsc -b build passes; test tsconfig adds vitest/globals types"
  - "Engine purity rule applied to src/engine/**/*.ts excluding *.test.ts (test files legitimately import testing utilities)"
  - "Tailwind v4 zero-config: no tailwind.config.js, no postcss.config.js — @tailwindcss/vite handles everything"

patterns-established:
  - "Wave 0 stub pattern: it.todo() in all test files so vitest exits 0 with pending tests, not failures"
  - "Engine purity enforced via ESLint no-restricted-imports on src/engine/**/*.ts (non-test)"
  - "Vitest environment annotation: // @vitest-environment jsdom at top of component/hook test files"

requirements-completed: [ENG-12, ENG-13]

duration: 6min
completed: 2026-03-04
---

# Phase 1 Plan 1: Vite+React+TS Scaffold with Vitest and ESLint Engine-Purity Summary

**Vite 6 + React 19 + TypeScript strict project scaffold with Tailwind v4, Vitest 3 globals, ESLint v9 flat config engine-purity rule, and 82 Wave 0 stub tests across 9 files**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-04T08:42:14Z
- **Completed:** 2026-03-04T08:48:02Z
- **Tasks:** 2
- **Files modified:** 19 created, 2 modified, ~170 deleted (Flutter/Rust tree)

## Accomplishments

- Replaced entire Flutter/Rust/Cargokit scaffold with Vite 6 + React 19 + TypeScript 5 web project; `npm run build` exits 0 producing 194 kB JS bundle
- Configured Vitest 3 with globals + split node/jsdom environments; `npx vitest run` exits 0 with 9 files, 82 pending (todo) tests, 0 failures
- Created ESLint v9 flat config with engine-purity override (`no-restricted-imports` banning react/UI imports from `src/engine/**/*.ts`)
- All Wave 0 test stub files in place: 5 engine modules (board, state, moves, rules, history) + 1 hook (useGame) + 3 UI components (Board, BoardNode, GameScreen)

## Task Commits

1. **Tasks 1+2: Scaffold + Wave 0 test stubs** - `6eb595b` (chore)

## Files Created/Modified

- `/Users/rk/Projects/building/pulijoodam/package.json` — React 19, Vite 6, Vitest 3, Tailwind v4, ESLint 9 dependencies
- `/Users/rk/Projects/building/pulijoodam/vite.config.ts` — Unified Vite + Vitest config with node environment, globals: true
- `/Users/rk/Projects/building/pulijoodam/tsconfig.app.json` — App tsconfig excluding test files (strict, ES2022, bundler)
- `/Users/rk/Projects/building/pulijoodam/tsconfig.test.json` — Test tsconfig with vitest/globals types
- `/Users/rk/Projects/building/pulijoodam/eslint.config.js` — ESLint v9 flat config; engine purity override for src/engine/**
- `/Users/rk/Projects/building/pulijoodam/src/index.css` — Single-line `@import "tailwindcss"` (Tailwind v4 syntax)
- `/Users/rk/Projects/building/pulijoodam/src/engine/board.test.ts` — 9 stub tests for 23-node topology (ENG-01)
- `/Users/rk/Projects/building/pulijoodam/src/engine/state.test.ts` — 10 stub tests for initial game state (ENG-02)
- `/Users/rk/Projects/building/pulijoodam/src/engine/moves.test.ts` — 22 stub tests for moves, validation, captures, phase (ENG-03–06)
- `/Users/rk/Projects/building/pulijoodam/src/engine/rules.test.ts` — 6 stub tests for win detection (ENG-07–08)
- `/Users/rk/Projects/building/pulijoodam/src/engine/history.test.ts` — 11 stub tests for repetition, 50-move, undo/redo (ENG-09–11)
- `/Users/rk/Projects/building/pulijoodam/src/hooks/useGame.test.ts` — 7 stub tests for tap-tap interaction hook
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/Board.test.tsx` — 6 stub tests for SVG board rendering
- `/Users/rk/Projects/building/pulijoodam/src/components/Board/BoardNode.test.tsx` — 5 stub tests for node touch targets
- `/Users/rk/Projects/building/pulijoodam/src/components/GameScreen/GameScreen.test.tsx` — 6 stub tests for HUD/overlay

## Decisions Made

- **ESLint v9 flat config required:** Plan specified `.eslintrc.cjs` but ESLint 9 only accepts `eslint.config.js`. Migrated to flat config format capturing identical intent (same rules, same engine override).
- **Split tsconfig pattern:** `tsc -b` includes test files under `tsconfig.app.json` causing TS2582 (`describe`/`it` unknown). Fix: `tsconfig.app.json` excludes `*.test.*`; `tsconfig.test.json` adds `"types": ["vitest/globals"]`. Both referenced from root `tsconfig.json` so `tsc -b` type-checks both.
- **Engine purity rule excludes test files:** The `no-restricted-imports` pattern applies to `src/engine/**/*.ts` but ignores `*.test.ts` — test files legitimately import testing utilities.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESLint v9 rejects .eslintrc.cjs — migrated to flat config**
- **Found during:** Task 1 verification (`npx eslint src/engine`)
- **Issue:** ESLint 9 removed legacy config format support; `.eslintrc.cjs` causes exit 2 with "couldn't find eslint.config.js"
- **Fix:** Created `eslint.config.js` using ESLint v9 flat config API; captured identical rules (typescript-eslint recommended + engine-purity override)
- **Files modified:** `eslint.config.js` (new), `.eslintrc.cjs` (deleted)
- **Verification:** `npx eslint src/engine` exits 0 with no output
- **Committed in:** `6eb595b`

**2. [Rule 1 - Bug] TypeScript TS2582 on test files — split tsconfig to add vitest/globals types**
- **Found during:** Task 1 verification (`npm run build`)
- **Issue:** `tsc -b` compiled test files under `tsconfig.app.json`, which has no Vitest type declarations — `describe`/`it` unknown
- **Fix:** Excluded `*.test.*` from `tsconfig.app.json`; created `tsconfig.test.json` with `"types": ["vitest/globals"]`; added test tsconfig reference to root `tsconfig.json`
- **Files modified:** `tsconfig.app.json`, `tsconfig.test.json` (new), `tsconfig.json`
- **Verification:** `npm run build` exits 0; `npx vitest run` exits 0
- **Committed in:** `6eb595b`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 — bugs from toolchain version mismatch)
**Impact on plan:** Both fixes required by ESLint 9 and Vitest 3 API changes vs plan's assumed versions. No scope creep — identical intent, updated implementation.

## Issues Encountered

- `@eslint/js` peer-dep conflict prevented `npm install --save-dev @eslint/js`. Resolved by using the copy already installed as a transitive dep of `eslint@9` (at `node_modules/@eslint/js`). Import in `eslint.config.js` resolves correctly via Node module resolution.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Build pipeline fully operational: `npm run dev`, `npm run build`, `npx vitest run` all exit 0
- All 9 Wave 0 test stub files in place — Plan 02 can immediately start implementing engine modules against failing-then-passing test cycle
- ESLint engine-purity guard active — any accidental React/UI import into `src/engine/` will fail CI
- `dist/` excluded from git (`.gitignore` updated)

---
*Phase: 01-engine-board*
*Completed: 2026-03-04*
