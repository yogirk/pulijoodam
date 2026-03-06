# Phase 3: Experience - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the game with animations, sound effects, visual themes, an interactive tutorial, and game history/replay. Covers POL-01 through POL-09, TUT-01 through TUT-07, and HIST-01 through HIST-06. Multiplayer, PWA, drag-to-move, and accessibility are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Animation feel
- Smooth & weighted style — pieces move with physical board game feel
- Movement: ~350ms ease-in-out slide transitions on SVG transforms
- Capture: arc jump path — tiger lifts in a curved arc over the goat, lands with slight settle (~400ms). Captured goat fades out (~200ms)
- Chain-hop: deliberate sequential hops, each jump plays fully before the next begins, brief pause between hops
- Goat placement: Claude's discretion — pick whichever approach fits the physical board game vibe (drop-in or scale-in)
- Game over: celebratory finish — winning pieces pulse/glow (500ms), board dims, then overlay fades in with result. No confetti.
- Animation sequencing driven by existing GameEvent[] from applyMove (PIECE_MOVED, GOAT_CAPTURED, GOAT_PLACED, CHAIN_JUMP_AVAILABLE, CHAIN_JUMP_ENDED, GAME_OVER)

### Sound design
- Two sound packs, linked to visual themes:
  - Traditional theme = stone & traditional sounds (stone tap, grinding scrape, heavy impact, bell/gong, low rumble)
  - Modern theme = wooden & tactile sounds (wooden clack, soft scrape, sharp knock, warm chime, dull thud)
- Sound pack switches automatically with theme selection
- Sound toggle (on/off) is independent of theme choice, persisted in localStorage
- Web Audio API synthesis — zero audio files, zero bundle size impact, no licensing concerns
- Chain-hop escalation: each successive capture in a chain plays at slightly higher pitch/louder impact, building tension
- Required sound events: place, slide, capture, win/loss, illegal move

### Visual themes
- Two themes: Traditional (default) and Modern
- Traditional theme — Temple stone floor:
  - Board: gray stone texture (CSS gradients/patterns)
  - Lines: carved/etched look
  - Tigers: brass/gold tone
  - Goats: dark stone gray
  - Background: warm sandstone
  - Accents: terracotta, aged copper
- Modern theme — Minimal dark:
  - Board: dark charcoal (#1a1a2e)
  - Lines: subtle gray, thin
  - Tigers: amber/orange glow
  - Goats: cool blue/cyan
  - Background: near-black
  - Accents: soft neon highlights
- Default theme for new users: Traditional
- Theme implemented via CSS custom properties for easy switching
- Settings UI: gear icon in top-right corner, opens compact dropdown with theme toggle + sound toggle
- Theme and sound preferences persisted in localStorage

### Tutorial flow
- Guided with freedom: text explains concepts, highlights suggested moves, but user can tap anywhere valid. Gentle correction/encouragement if they deviate ("That works too! The key is...")
- Warm & cultural tone: references Pulijoodam's South Indian heritage. Brief cultural context woven into lesson intros.
- Three lessons using real engine with scripted starting states:
  - Lesson 1: Board & Placement — guided goat placement, turn-taking
  - Lesson 2: Movement & Captures — pre-set board, demonstrate jumps and chain-hops
  - Lesson 3: Winning & Losing — trap tigers, show both win conditions
- First-launch modal prompt: "New to Pulijoodam? Learn the game in 3 short lessons." with [Start Tutorial] and [Skip]. Shown once, remembered in localStorage.
- Tutorial always accessible from settings/menu after dismissing the first-launch prompt
- Skip option available at any point during tutorial
- Brief text overlays (2-3 sentences per step) positioned near the relevant board area

### Claude's Discretion
- Goat placement animation style (drop-in vs. scale-in)
- Exact CSS patterns/gradients for stone and wood textures
- Tutorial text copywriting (within the warm & cultural tone)
- Settings dropdown exact styling and positioning
- History list layout and replay control styling
- Game event queue implementation details
- How to handle tutorial when user deviates significantly from expected path

</decisions>

<specifics>
## Specific Ideas

- Temple courtyard vibe for Traditional theme — playing on a stone porch
- Chess.com dark mode vibe for Modern theme — premium digital feel
- Chain-hop animations should feel deliberate, not rushed — each hop is a moment
- Winning piece glow should feel like a subtle celebration, not flashy
- Tutorial intro: "Pulijoodam has been played in South Indian villages for centuries. Let's learn how."

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GameEvent` types (types.ts:55-62): PIECE_MOVED, GOAT_CAPTURED, GOAT_PLACED, PHASE_CHANGED, GAME_OVER, CHAIN_JUMP_AVAILABLE, CHAIN_JUMP_ENDED — directly drive animation sequencing
- `MoveResult` (types.ts:64-68): returns `events: GameEvent[]` from every move — animation queue source
- `GoatPiece.tsx`, `TigerPiece.tsx`: SVG piece components — add CSS transitions to their transforms
- `useGame.ts`, `useAIGame.ts`: game hooks — integrate animation state and sound triggers
- `GameOverOverlay.tsx`: existing overlay — add celebratory glow before showing

### Established Patterns
- SVG rendering with React components and `transform` positioning — animations via CSS transitions on transforms
- Tailwind v4 for shell UI, CSS custom properties for SVG — themes via CSS custom property swapping
- GameState is JSON-serializable (designed for localStorage and WebRTC) — ready for auto-save

### Integration Points
- `applyMove` returns `GameEvent[]` — animation system consumes these to queue visual + audio effects
- Piece components need `transition` CSS on their `transform` attributes
- Settings gear icon integrates into existing GameScreen header area
- Tutorial needs access to `createGame` with custom initial states
- History/auto-save writes to localStorage on every `applyMove` call

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-experience*
*Context gathered: 2026-03-07*
