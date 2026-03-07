# Phase 4: Multiplayer + PWA - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

P2P online multiplayer via WebRTC (no server), plus production hardening: PWA installability, full offline support, drag-to-move interaction, accessibility (screen reader, color-blind safe, ARIA), performance optimization, responsive design audit, and GitHub Pages CI/CD. Covers MP-01 through MP-08 and PROD-01 through PROD-10. This is the final phase of v1.0.

</domain>

<decisions>
## Implementation Decisions

### P2P Connection UX
- Two-screen manual SDP exchange: host creates game and gets a Base64 invite code, guest pastes code and generates response code, host pastes response to connect
- Copy buttons on both code fields for easy sharing via any messaging app
- No PeerJS or signaling server dependency — pure WebRTC with STUN only
- Known limitation: STUN-only fails for ~20-30% of users on symmetric NAT — document in UI
- "Play Online" button on setup screen alongside existing "vs AI" and "Local 2P"
- Host picks their role (Tiger or Goat) when creating the game; guest gets the other role
- Undo disabled in P2P games (MP-08)

### Disconnect Handling
- Non-blocking toast/banner: "Opponent disconnected" with [Continue vs AI] and [End Game] buttons
- Game board stays visible so player can see the position
- If "Continue vs AI", AI takes over the disconnected player's role at current difficulty
- Connection status indicator visible during P2P games (connected/reconnecting/disconnected)

### Drag-to-Move
- Both drag and tap-tap always active simultaneously — no toggle, no device detection
- Drag works for movement phase only; goat placement stays tap-only (goats come from abstract pool, not a screen location)
- Drag works for tiger captures: drag tiger to landing node (beyond the goat), engine infers the capture. For chain-hops, after landing, legal destinations glow and user can drag again or tap
- Visual feedback: piece lifts (scale ~1.2x) with drop shadow while dragging, valid destination nodes glow/pulse, snap to nearest valid node on release, animate back to origin on invalid drop

### Offline / PWA
- Everything works offline except P2P multiplayer: AI games, local 2P, tutorial, history, replay, settings all cached
- Service worker caches all assets on first load (cache-first strategy)
- Silent update: new service worker installs in background, activates on next page load — no notification
- Install prompt: subtle dismissible banner on second visit ("Install Pulijoodam for quick access?"), shown once, remembered in localStorage
- PWA icon: tiger silhouette on warm sandstone/terracotta background (matches Traditional theme)
- Theme color matches the user's active visual theme

### Accessibility
- Claude's discretion on implementation approach for: screen reader move announcements (PROD-03), color-blind safe piece design (PROD-04), ARIA labels on interactive elements (PROD-05)

### Claude's Discretion
- Accessibility implementation specifics (screen reader patterns, color-blind design choices, ARIA structure)
- Performance optimization targets and memoization strategy (PROD-06)
- Responsive design audit approach (PROD-07)
- GitHub Actions CI/CD pipeline configuration (PROD-09)
- Bundle size optimization approach to stay under 1MB (PROD-10)
- WebRTC ICE configuration (STUN server selection)
- Service worker caching strategy details (precache manifest vs runtime caching)
- PWA manifest details beyond icon and theme color

</decisions>

<specifics>
## Specific Ideas

- Two-code exchange UI should feel clear and guided — users unfamiliar with WebRTC shouldn't feel lost. Brief instruction text like "Share this code with your friend" above the code field
- Drag-to-move should feel physical — the lift + shadow gives the sense of picking up a real game piece
- Install banner should be warm, not pushy — matches the cultural game's tone
- Connection status indicator should be small and unobtrusive (dot or icon, not a banner)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GameState` is JSON-serializable — designed for WebRTC relay from Phase 1
- `useGame.ts`, `useAIGame.ts` — game hooks to extend for P2P and drag interaction
- `useAnimationQueue.ts` — animation system works with any input method (tap or drag)
- `useSettings.tsx` — SettingsProvider for persisting install-prompt-dismissed state
- `AudioEngine.ts` — sound triggers work regardless of input method
- `SetupScreen.tsx` — already has game mode buttons, add "Play Online" alongside

### Established Patterns
- SVG rendering with React components and CSS transitions — drag will use SVG pointer events
- Tailwind v4 for shell UI, CSS custom properties for SVG theming
- localStorage for settings/history persistence — reuse for install prompt state
- App.tsx screen routing via state — add multiplayer screen states

### Integration Points
- `applyMove` returns `MoveResult` with events — P2P relays the Move, receiver applies locally
- Piece components (GoatPiece, TigerPiece) need pointer event handlers for drag
- App.tsx routing needs multiplayer game screen + host/join screens
- Service worker sits at project root, caches Vite build output
- GitHub Actions workflow in `.github/workflows/`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-multiplayer-pwa*
*Context gathered: 2026-03-07*
