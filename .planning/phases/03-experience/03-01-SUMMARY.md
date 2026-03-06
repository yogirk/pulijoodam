---
phase: 03-experience
plan: 01
subsystem: ui
tags: [css-custom-properties, web-audio-api, theming, settings, localstorage, react-context]

# Dependency graph
requires:
  - phase: 01-engine-board
    provides: SVG board components with piece rendering
  - phase: 02-ai-opponent
    provides: GameScreen, useGame, useAIGame hooks
provides:
  - CSS custom property theming system (Traditional + Modern)
  - Web Audio API sound synthesis engine with 6 event types
  - Settings persistence via localStorage
  - SettingsProvider context wrapping the app
  - SettingsDropdown UI component
affects: [03-02-animations, 03-03-tutorial, 03-04-history]

# Tech tracking
tech-stack:
  added: [happy-dom]
  patterns: [css-custom-properties-theming, web-audio-singleton, react-context-settings, anti-flicker-inline-script]

key-files:
  created:
    - src/theme/theme.ts
    - src/hooks/useSettings.tsx
    - src/audio/AudioEngine.ts
    - src/audio/sounds.ts
    - src/components/Settings/SettingsDropdown.tsx
    - src/theme/theme.test.ts
    - src/hooks/useSettings.test.ts
    - src/audio/AudioEngine.test.ts
  modified:
    - src/index.css
    - index.html
    - src/main.tsx
    - src/components/Board/GoatPiece.tsx
    - src/components/Board/TigerPiece.tsx
    - src/components/Board/BoardNode.tsx
    - src/components/Board/BoardEdge.tsx
    - src/components/Board/Board.tsx
    - src/components/GameScreen/GameScreen.tsx
    - src/components/GameScreen/GameOverOverlay.tsx
    - src/components/GameScreen/TurnIndicator.tsx
    - src/components/GameScreen/PoolCounter.tsx
    - src/App.tsx

key-decisions:
  - "useSettings.tsx uses .Provider pattern (not React 19 Context-as-JSX) for esbuild compatibility"
  - "happy-dom added for DOM-requiring hook tests since vitest default is node environment"
  - "Traditional theme uses warm earth tones (stone/brass/copper); Modern uses dark cool tones (charcoal/amber/cyan)"
  - "Anti-flicker inline script in index.html reads localStorage before React mounts"
  - "AudioEngine uses singleton pattern with lazy AudioContext creation on first sound call"

patterns-established:
  - "CSS custom properties on :root/[data-theme] for all color values -- no hardcoded hex in components"
  - "Settings context pattern: SettingsProvider at app root, useSettings() hook for consumers"
  - "Web Audio synthesis pattern: AudioEngine singleton, sound recipe functions in sounds.ts"
  - "happy-dom environment via // @vitest-environment happy-dom directive for DOM-requiring tests"

requirements-completed: [POL-05, POL-06, POL-07, POL-08, POL-09]

# Metrics
duration: 11min
completed: 2026-03-07
---

# Phase 3 Plan 01: Theming, Audio Engine, and Settings Summary

**Two-theme CSS custom property system (Traditional/Modern), Web Audio API sound engine with 6 event types and chain-hop escalation, and localStorage-persisted settings with gear dropdown UI**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-06T19:19:26Z
- **Completed:** 2026-03-06T19:30:49Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Two complete visual themes (Traditional: warm stone/earth tones; Modern: dark charcoal/cyan) switchable instantly via CSS custom properties
- Web Audio API sound synthesis engine producing distinct sounds for place, slide, capture, win, loss, and illegal move events with theme-specific tones
- Chain-hop capture sounds escalate in pitch and volume (1.15x frequency, 1.1x volume per chain index)
- Settings persistence in localStorage with anti-flicker inline script preventing wrong-theme flash on page load
- All 21 board/UI components converted from hardcoded hex colors to CSS custom property references
- 29 new tests (5 theme, 10 settings, 14 audio) all passing; 153 total tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: Theme system, settings hook, and settings persistence** - `78d87ba` (feat)
2. **Task 2: Audio engine, settings UI, and visual integration** - `eb71202` (feat)

_Note: Task 2 commit was bundled with pre-existing uncommitted history files from a prior exploration session. The 03-01 changes within that commit are correct and complete._

## Files Created/Modified
- `src/theme/theme.ts` - ThemeName type, Settings interface, DEFAULT_SETTINGS, SETTINGS_KEY constants
- `src/hooks/useSettings.tsx` - SettingsProvider context + useSettings hook with localStorage persistence
- `src/audio/AudioEngine.ts` - Singleton AudioEngine with lazy AudioContext and 6 sound methods
- `src/audio/sounds.ts` - Sound recipe functions using OscillatorNode + GainNode + noise buffers
- `src/components/Settings/SettingsDropdown.tsx` - Gear icon with dropdown for theme/sound toggles
- `src/index.css` - CSS custom properties for both Traditional and Modern themes
- `index.html` - Anti-flicker inline script setting data-theme before React mounts
- `src/main.tsx` - SettingsProvider wrapping the app
- `src/components/Board/*.tsx` - All board components converted to CSS custom properties
- `src/components/GameScreen/*.tsx` - All game screen components converted to CSS custom properties

## Decisions Made
- Used `.Provider` pattern instead of React 19 Context-as-JSX syntax because esbuild (used by Vite/Vitest) does not yet support the new `<Context value>` JSX syntax
- Added `happy-dom` as dev dependency for hook tests requiring DOM (jsdom had localStorage issues with opaque origins)
- Traditional theme preserves dark background (`#1c1917`) to match existing look while changing board/piece colors; Modern theme uses near-black (`#0f0f1a`) for contrast
- Sound recipes use OscillatorNode waveform types to distinguish themes: Traditional uses sine (stone taps, bell FM synthesis), Modern uses triangle/square (wood clacks, warm chimes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed JSX file extension for useSettings hook**
- **Found during:** Task 1
- **Issue:** useSettings.ts contained JSX (Provider) but had .ts extension; esbuild refused to transform
- **Fix:** Renamed to useSettings.tsx
- **Files modified:** src/hooks/useSettings.tsx
- **Verification:** Tests pass, build succeeds

**2. [Rule 3 - Blocking] Added happy-dom for DOM-requiring tests**
- **Found during:** Task 1
- **Issue:** renderHook from @testing-library/react requires DOM; default vitest env is node; jsdom's localStorage throws SecurityError on opaque origins
- **Fix:** Installed happy-dom, added `// @vitest-environment happy-dom` directive to test file
- **Files modified:** package.json, src/hooks/useSettings.test.ts
- **Verification:** All 10 useSettings tests pass

**3. [Rule 2 - Missing Critical] Updated TurnIndicator and PoolCounter to use theme variables**
- **Found during:** Task 2
- **Issue:** Plan listed specific files but TurnIndicator and PoolCounter also had hardcoded bg-stone-800/text-white/text-stone-400 colors that would break theme consistency
- **Fix:** Converted both components to use CSS custom properties
- **Files modified:** src/components/GameScreen/TurnIndicator.tsx, src/components/GameScreen/PoolCounter.tsx
- **Verification:** Build succeeds, no hardcoded hex colors in any component

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for correctness and test infrastructure. No scope creep.

## Issues Encountered
- Pre-existing uncommitted history files (from a prior exploration) were present in the working tree and got bundled into the Task 2 commit. These files are functional and part of a later plan (03-04), not caused by this plan's execution.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CSS custom property infrastructure ready for animation plan (03-02) to add transition properties
- AudioEngine singleton ready for animation queue to trigger sounds on game events
- Settings context available for all subsequent plans to check theme/sound preferences
- No blockers for next plan

---
*Phase: 03-experience*
*Completed: 2026-03-07*
