---
phase: 04-multiplayer-pwa
plan: 01
subsystem: ui
tags: [drag-drop, accessibility, aria, pointer-events, svg, color-blind]

# Dependency graph
requires:
  - phase: 03-experience
    provides: "Board component, piece components, animation system, GameScreen"
provides:
  - "useDrag hook for SVG drag-to-move with pointer events"
  - "ScreenReaderAnnouncer component with ARIA live region"
  - "Enhanced BoardNode ARIA labels with piece occupancy"
  - "Color-blind inner markers on GoatPiece (dot) and TigerPiece (cross)"
affects: [04-multiplayer-pwa]

# Tech tracking
tech-stack:
  added: []
  patterns: [pointer-event-capture-drag, screen-to-svg-coordinate-transform, aria-live-announcements]

key-files:
  created:
    - src/hooks/useDrag.ts
    - src/hooks/useDrag.test.ts
    - src/components/Board/ScreenReaderAnnouncer.tsx
    - src/components/Board/ScreenReaderAnnouncer.test.tsx
  modified:
    - src/components/Board/Board.tsx
    - src/components/Board/BoardNode.tsx
    - src/components/Board/GoatPiece.tsx
    - src/components/Board/TigerPiece.tsx
    - src/components/GameScreen/GameScreen.tsx

key-decisions:
  - "useDrag reuses tap-tap flow via onNodeTap(from) then onNodeTap(to) for move execution"
  - "Piece components wrapped in <g> for pointer event handling while keeping inner elements pointer-events:none"
  - "Color-blind markers: inner dot for goats, inner cross for tigers -- shape differentiation without relying on color"

patterns-established:
  - "SVG drag pattern: setPointerCapture on pointerDown, screen-to-SVG via getScreenCTM().inverse(), threshold-based tap/drag differentiation"
  - "Accessibility announcements: ScreenReaderAnnouncer renders aria-live=polite div with sr-only class, maps GameEvent[] to human-readable strings"

requirements-completed: [PROD-02, PROD-03, PROD-04, PROD-05]

# Metrics
duration: 7min
completed: 2026-03-07
---

# Phase 4 Plan 1: Drag & Accessibility Summary

**SVG drag-to-move with pointer events, ARIA live announcements for all game events, and color-blind piece markers**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-07T08:45:51Z
- **Completed:** 2026-03-07T08:52:41Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Drag-to-move interaction via useDrag hook with 5px threshold tap/drag differentiation and 30px snap radius
- ScreenReaderAnnouncer with ARIA live region announcing all 7 game event types plus turn changes
- Color-blind inner markers: filled dot inside goat circles, cross pattern inside tiger diamonds
- Enhanced BoardNode ARIA labels with piece type, selection state, and legal move indicators
- 20 new tests (8 drag, 12 announcer), 224 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Drag-to-move hook and Board integration** - `d04041f` (feat)
2. **Task 2: Screen reader announcer and color-blind piece markers** - `1449ab8` (feat)

## Files Created/Modified
- `src/hooks/useDrag.ts` - SVG drag state management with pointer events, findNearestValidNode helper
- `src/hooks/useDrag.test.ts` - 8 tests for drag threshold, snap radius, nearest valid node
- `src/components/Board/ScreenReaderAnnouncer.tsx` - ARIA live region mapping GameEvents to announcements
- `src/components/Board/ScreenReaderAnnouncer.test.tsx` - 12 tests for all event types, attributes, turn announcements
- `src/components/Board/Board.tsx` - SVG ref, useDrag integration, pointer event handlers on SVG element
- `src/components/Board/BoardNode.tsx` - Enhanced aria-label with piece type, selected, legal move states
- `src/components/Board/GoatPiece.tsx` - Draggable props, lift/shadow while dragging, inner dot marker
- `src/components/Board/TigerPiece.tsx` - Draggable props, lift/shadow while dragging, inner cross marker
- `src/components/GameScreen/GameScreen.tsx` - ScreenReaderAnnouncer integration

## Decisions Made
- useDrag reuses existing tap-tap move flow (onNodeTap twice) rather than creating a separate move path -- keeps single source of move logic
- Piece components wrapped in `<g>` element for pointer event handling while inner SVG shapes remain pointer-events:none -- prevents event target confusion
- Color-blind markers use shape differentiation (dot vs cross) matching the outer piece shape vocabulary (circle vs diamond)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Drag-to-move and accessibility features complete, ready for multiplayer and PWA plans
- All 224 tests passing, TypeScript compiles cleanly for project files

## Self-Check: PASSED

All 9 created/modified files verified present. Both task commits (`d04041f`, `1449ab8`) verified in git log. 224 tests passing.

---
*Phase: 04-multiplayer-pwa*
*Completed: 2026-03-07*
