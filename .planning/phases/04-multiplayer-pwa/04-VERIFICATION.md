---
phase: 04-multiplayer-pwa
verified: 2026-03-07T09:33:42Z
status: human_needed
score: 21/21 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 20/21
  gaps_closed:
    - "All existing tests plus new tests pass"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open two browser tabs, create game as host, exchange codes, play moves"
    expected: "Moves appear on both boards, connection status shows green"
    why_human: "WebRTC requires real browser environment"
  - test: "Build, load page, go offline in DevTools, refresh"
    expected: "App loads fully offline, game plays without network"
    why_human: "Service worker registration requires real browser"
  - test: "Visit app twice (clear storage), check for install banner"
    expected: "Banner appears on second visit, Not now dismisses permanently"
    why_human: "beforeinstallprompt event only fires in real browser"
  - test: "Check layout at 320px, 375px, 768px, 1024px widths"
    expected: "No horizontal scroll, buttons stack correctly, board scales"
    why_human: "Visual layout verification requires rendering"
  - test: "In movement phase, drag a piece to a valid destination"
    expected: "Piece lifts with shadow, snaps to nearest valid node, quick tap still works"
    why_human: "Pointer event interaction requires real browser"
---

# Phase 4: Multiplayer + PWA Verification Report

**Phase Goal:** Players can challenge a friend online with no server, and the app is installable and works offline
**Verified:** 2026-03-07T09:33:42Z
**Status:** human_needed
**Re-verification:** Yes -- after gap closure

## Re-verification Summary

| Metric | Previous | Current |
|--------|----------|---------|
| Status | gaps_found | human_needed |
| Score | 20/21 | 21/21 |
| Gaps closed | -- | "All existing tests plus new tests pass" |
| Gaps remaining | -- | none |
| Regressions | -- | none |

**Gap closed:** SetupScreen.test.tsx assertions were updated from stale `bg-amber-600` to current `scale-105` / `scale-[1.02]` / `opacity-70` classes. All 7 SetupScreen tests now pass.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A player can drag a tiger or goat piece to a valid destination during movement phase | VERIFIED | useDrag.ts (224L) with DRAG_THRESHOLD=5, SNAP_RADIUS=30, findNearestValidNode; Board.tsx imports and calls useDrag hook at line 34; GoatPiece/TigerPiece have draggable props and pointer event handlers |
| 2 | A quick tap (< 5px movement) still triggers tap-to-select as before | VERIFIED | useDrag.ts exports DRAG_THRESHOLD=5; test file (64L) covers threshold behavior |
| 3 | Goat placement remains tap-only (no drag from abstract pool) | VERIFIED | useDrag.ts design: drag only activates for pieces on board during movement phase |
| 4 | Screen reader users hear move and capture announcements via ARIA live region | VERIFIED | ScreenReaderAnnouncer.tsx (76L) renders div with aria-live="polite", aria-atomic="true", className="sr-only"; imported in GameScreen.tsx line 6, rendered line 118 |
| 5 | Tigers and goats are distinguishable without relying on color alone | VERIFIED | GoatPiece.tsx has "Color-blind inner marker: small filled dot" (line 68); TigerPiece.tsx has "Color-blind inner marker: cross pattern" (line 63) |
| 6 | All interactive board nodes have descriptive ARIA labels | VERIFIED | BoardNode.tsx line 44: aria-label={buildAriaLabel(node.id, piece, isSelected, isLegalMove)} |
| 7 | Two players on different devices can start a game by exchanging two copy-paste codes | VERIFIED | webrtc.ts (163L) exports createOffer/joinWithOffer returning Base64 codes; HostScreen.tsx (218L) and JoinScreen.tsx (155L) provide copy/paste UX |
| 8 | Host picks role (tiger or goat); guest gets the other role | VERIFIED | HostScreen.tsx provides role picker; App.tsx passes hostRole to P2PGameScreen |
| 9 | Moves made by one player appear on the other player's screen | VERIFIED | useP2PGame.ts calls connection.send with MOVE messages (lines 125,142,167,205); receives via connection.onMessage (line 62); applies via applyMove (lines 71,78) |
| 10 | Connection status indicator shows connected/reconnecting/disconnected | VERIFIED | ConnectionStatus.tsx (30L) renders green/yellow/red dot with labels; imported in P2PGameScreen |
| 11 | Disconnection shows toast with Continue vs AI and End Game options | VERIFIED | DisconnectBanner.tsx (42L) with onContinueVsAI and onEndGame callbacks; buttons labeled "Continue vs AI" and "End Game" |
| 12 | Undo buttons are hidden in P2P games | VERIFIED | useP2PGame.ts: canUndo: false (line 250), canRedo: false (line 251) |
| 13 | STUN-only limitation is documented in the UI | VERIFIED | HostScreen.tsx line 208 and JoinScreen.tsx line 145: "Note: This may not work on some corporate/university networks (symmetric NAT)." |
| 14 | The app loads and plays fully offline after first visit (except P2P multiplayer) | VERIFIED | vite.config.ts uses VitePWA plugin (line 12); main.tsx registers SW via virtual:pwa-register (line 3,9); workbox caches all static assets |
| 15 | The app can be installed to home screen on mobile and desktop | VERIFIED | VitePWA manifest config in vite.config.ts; PWA icons at public/pwa-192x192.svg and public/pwa-512x512.svg |
| 16 | An install prompt appears on second visit and can be dismissed permanently | VERIFIED | InstallPrompt.tsx (83L) with localStorage visit counting and dismiss; rendered in App.tsx on every screen |
| 17 | Memoization prevents unnecessary re-renders of Board and piece components | VERIFIED | Board.tsx wrapped in memo (line 21); GoatPiece memo (line 15); TigerPiece memo (line 13); BoardNode memo (line 37); BoardEdge memo (line 9) |
| 18 | Tutorial, History, and Replay screens lazy-load (not in initial bundle) | VERIFIED | App.tsx: lazy(() => ...) for HistoryScreen (line 16), ReplayScreen (line 19), TutorialScreen (line 22) |
| 19 | GitHub Actions CI runs tests and lint before deploying to GitHub Pages | VERIFIED | deploy.yml: npm run lint (line 27), npx vitest run (line 28), upload-pages-artifact@v4 (line 30) |
| 20 | Total JS + assets bundle is under 1MB | VERIFIED | Summary reports 348KB total (76KB gzipped) -- well under 1MB |
| 21 | All tests pass (228+ expected) | VERIFIED | 231 tests pass, 0 failures. Full suite: 29 files passed, 4 skipped, 231 passed, 24 todo. SetupScreen.test.tsx: 7/7 pass with updated assertions. |

**Score:** 21/21 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/hooks/useDrag.ts` | SVG drag state management | VERIFIED | 224L, exports useDrag, findNearestValidNode, DRAG_THRESHOLD, SNAP_RADIUS |
| `src/hooks/useDrag.test.ts` | Drag tests | VERIFIED | 64L, 8 tests |
| `src/components/Board/ScreenReaderAnnouncer.tsx` | ARIA live region | VERIFIED | 76L, exports ScreenReaderAnnouncer |
| `src/components/Board/ScreenReaderAnnouncer.test.tsx` | Announcer tests | VERIFIED | 130L, 12 tests |
| `src/multiplayer/protocol.ts` | P2P message types | VERIFIED | 16L, exports P2PMessage, encodeMessage, decodeMessage |
| `src/multiplayer/webrtc.ts` | WebRTC lifecycle wrapper | VERIFIED | 163L, exports createOffer, joinWithOffer, P2PConnection |
| `src/multiplayer/useP2PGame.ts` | P2P game hook | VERIFIED | 260L, exports useP2PGame |
| `src/multiplayer/HostScreen.tsx` | Host game creation UI | VERIFIED | 218L, exports HostScreen |
| `src/multiplayer/JoinScreen.tsx` | Join game UI | VERIFIED | 155L, exports JoinScreen |
| `src/multiplayer/ConnectionStatus.tsx` | Connection indicator | VERIFIED | 30L, green/yellow/red states |
| `src/multiplayer/DisconnectBanner.tsx` | Disconnect toast | VERIFIED | 42L, Continue vs AI + End Game |
| `src/multiplayer/P2PGameScreen.tsx` | P2P game screen | VERIFIED | 148L, uses useP2PGame |
| `src/pwa/InstallPrompt.tsx` | Install banner | VERIFIED | 83L, localStorage visit counting |
| `vite.config.ts` | PWA plugin config | VERIFIED | VitePWA at line 12 |
| `.github/workflows/deploy.yml` | CI pipeline | VERIFIED | lint + test + build + deploy, v4 artifact action |
| `public/pwa-192x192.svg` | PWA icon small | VERIFIED | 7L SVG |
| `public/pwa-512x512.svg` | PWA icon large | VERIFIED | 7L SVG |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| useDrag.ts | Board.tsx | hook consumed | WIRED | Board.tsx imports useDrag (line 5), calls it (line 34) |
| Board.tsx | ScreenReaderAnnouncer.tsx | rendered inside Board's parent | WIRED | GameScreen.tsx imports (line 6) and renders (line 118) |
| useP2PGame.ts | webrtc.ts | P2PConnection for send/receive | WIRED | connection.send called at lines 125,142,167,205,232; connection.onMessage at line 62 |
| useP2PGame.ts | engine | applyMove for state updates | WIRED | applyMove imported (line 4), called at lines 71,78,120,137 |
| P2PGameScreen.tsx | useP2PGame.ts | hook consumption | WIRED | Imports line 1, calls line 27 |
| App.tsx | HostScreen.tsx | screen routing | WIRED | screen === 'host' check at line 198, renders HostScreen at line 201 |
| App.tsx | InstallPrompt.tsx | rendered at app root | WIRED | Imported line 6, rendered on every screen (lines 104,119,134,147,193,209,229,243,301) |
| vite.config.ts | dist/sw.js | VitePWA generates SW | WIRED | VitePWA plugin configured at line 12 |
| deploy.yml | npm run build | CI builds | WIRED | Line 29: npm run build |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MP-01 | 04-02 | WebRTC data channel for P2P | SATISFIED | webrtc.ts (163L) with RTCPeerConnection lifecycle |
| MP-02 | 04-02 | Invite code generation (Base64 SDP) | SATISFIED | createOffer returns Base64 offerCode |
| MP-03 | 04-02 | Join flow: paste offer, generate answer | SATISFIED | joinWithOffer in webrtc.ts; JoinScreen.tsx UI |
| MP-04 | 04-02 | Two-code exchange UX with copy/paste | SATISFIED | HostScreen.tsx + JoinScreen.tsx with copy buttons |
| MP-05 | 04-02 | Game sync via command relay | SATISFIED | useP2PGame.ts sends/receives MOVE messages |
| MP-06 | 04-02 | Connection status indicator | SATISFIED | ConnectionStatus.tsx with 3 states |
| MP-07 | 04-02 | Disconnect handling (Continue vs AI / End) | SATISFIED | DisconnectBanner.tsx with both options |
| MP-08 | 04-02 | Undo disabled in P2P | SATISFIED | canUndo: false, canRedo: false in useP2PGame |
| PROD-01 | 04-03 | Service worker for offline | SATISFIED | VitePWA + registerSW in main.tsx |
| PROD-02 | 04-01 | Drag-to-move interaction | SATISFIED | useDrag.ts (224L) wired into Board.tsx |
| PROD-03 | 04-01 | Screen reader move announcements | SATISFIED | ScreenReaderAnnouncer with aria-live="polite" |
| PROD-04 | 04-01 | Color-blind safe piece design | SATISFIED | Inner dot (goat) and cross (tiger) markers |
| PROD-05 | 04-01 | ARIA labels on interactive elements | SATISFIED | BoardNode aria-label with buildAriaLabel() |
| PROD-06 | 04-03 | Memoization and lazy loading | SATISFIED | React.memo on 5 components, React.lazy for 3 screens |
| PROD-07 | 04-03 | Responsive design audit | SATISFIED | SVG viewBox auto-scales; flex-wrap on difficulty buttons |
| PROD-08 | 04-03 | PWA manifest for installability | SATISFIED | VitePWA manifest config + SVG icons |
| PROD-09 | 04-03 | GitHub Pages deployment via CI | SATISFIED | deploy.yml with lint+test+build+deploy |
| PROD-10 | 04-03 | Bundle < 1MB | SATISFIED | 348KB total per build audit |

No orphaned requirements found. All 18 requirement IDs from plans are accounted for and mapped in REQUIREMENTS.md to Phase 4.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/multiplayer/HostScreen.tsx | 182 | HTML placeholder attribute (not a code placeholder) | Info | False positive -- standard HTML textarea placeholder text |
| src/multiplayer/JoinScreen.tsx | 82 | HTML placeholder attribute (not a code placeholder) | Info | False positive -- standard HTML textarea placeholder text |

No blocker or warning-level anti-patterns remain. The previous warning (stale test assertions in SetupScreen.test.tsx) has been resolved.

### Human Verification Required

### 1. P2P Multiplayer End-to-End

**Test:** Open two browser tabs, create game as host, exchange codes, play moves
**Expected:** Moves appear on both boards, connection status shows green
**Why human:** WebRTC requires real browser environment; cannot verify data channel in unit tests

### 2. PWA Offline Support

**Test:** Build with `npm run build && npx vite preview`, load page, go offline in DevTools, refresh
**Expected:** App loads fully offline, game plays without network
**Why human:** Service worker registration and caching require real browser

### 3. Install Prompt Behavior

**Test:** Visit the app twice (clear storage first), check for install banner on second visit
**Expected:** Banner appears on second visit, "Not now" dismisses permanently
**Why human:** beforeinstallprompt event only fires in real browser context

### 4. Responsive Layout

**Test:** Check layout at 320px, 375px, 768px, 1024px viewport widths
**Expected:** No horizontal scroll, buttons stack correctly, board scales
**Why human:** Visual layout verification requires rendering

### 5. Drag-to-Move Interaction

**Test:** In movement phase, drag a piece to a valid destination
**Expected:** Piece lifts with shadow, snaps to nearest valid node on release, quick tap still works
**Why human:** Pointer event interaction requires real browser

### Gaps Summary

No gaps remain. The single gap from the initial verification (3 failing SetupScreen tests due to stale `bg-amber-600` assertions) has been closed. The test file now asserts against the current styling approach (`scale-105`, `scale-[1.02]`, `opacity-70`), and all 7 tests pass.

All 18 phase requirements (MP-01 through MP-08, PROD-01 through PROD-10) are satisfied in the codebase. The full test suite passes: 231 tests across 29 files, 0 failures. Lint passes with 0 errors. All 15 key artifacts exist at expected line counts and all 9 key links are wired.

The phase goal -- "Players can challenge a friend online with no server, and the app is installable and works offline" -- is achieved at the code level, pending human verification of the 5 interactive/PWA behaviors listed above.

---

_Verified: 2026-03-07T09:33:42Z_
_Verifier: Claude (gsd-verifier)_
