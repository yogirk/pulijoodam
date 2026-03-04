# Phase 1: Engine + Board - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the core game engine (pure TypeScript, zero UI deps) and a playable SVG board so two humans can play a complete game of Pulijoodam on the same device. Includes project scaffolding, board topology, move generation, capture mechanics (including chain-hops), win/draw detection, undo/redo, SVG rendering, tap-tap interaction, and comprehensive engine unit tests. AI, animations, sound, and multiplayer are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Board Topology
- 23 nodes defined in `specs/board-graph.md` — use as canonical source
- Each node has: `id` (0-22), label, adjacency list
- Node coordinates must be computed for SVG rendering: triangle (nodes 0-3) above a 5×4 grid (nodes 4-22)
- Jump paths derived at init time: for adjacent pair (A,B), compute direction vector, find candidate C at B+direction, validate C exists AND is adjacent to B
- Store jump triples as `Map<string, number>` keyed by `"tigerPos,goatPos" → landingPos`
- Adjacency validation is the guard — NOT coordinate distance checks (pitfall: false collinearity on hybrid topology)

### Initial Piece Positions
- Tigers start on nodes 0 (Apex), 6 (G_R1_C3), 7 (G_R1_C4)
- 15 goats start in off-board pool
- Goat player moves first

### Game Phases & Rules (Andhra Preset)
- Placement phase: goats place on empty nodes, tigers move OR capture, goats cannot move
- Movement phase begins when all 15 goats placed: both sides move to adjacent empty nodes, tigers can also capture
- Chain-hops allowed: after a capture, tiger may continue jumping if another capture is available from landing position (optional, same turn)
- Chain-hop state (`chainJumpInProgress`) lives in the engine, NOT in UI state
- Tiger wins when 10+ goats captured (< 6 remaining on board + pool)
- Goat wins when all 3 tigers are immobilized (no legal moves)
- Draw: threefold repetition (same board + turn 3×) OR 50 consecutive captureless moves

### Engine API Design
- Functional with immutable state — every operation returns a new GameState
- Core surface: `createGame`, `applyMove`, `getLegalMoves`, `getGameStatus`, `undo`, `redo`
- `applyMove` returns `MoveResult` with new `GameState` + `GameEvent[]` array
- GameEvents describe what happened (piece moved, capture, phase change, game over) — UI consumes these for rendering
- Engine must be importable into Web Worker without pulling in React (critical for Phase 2)
- Undo/redo via history stack of states

### State Representation
- `board`: array of 23 slots (null, 'tiger', or 'goat')
- `phase`: 'placement' | 'movement'
- `currentTurn`: 'tiger' | 'goat'
- `goatsInPool`: 0-15
- `goatsCaptured`: 0-15
- `moveHistory`: Move[]
- `stateHashes`: Map for threefold repetition detection
- `capturelessMoves`: counter for 50-move rule
- `chainJumpInProgress`: tiger node ID if mid-chain-hop, else null

### SVG Board Rendering
- SVG with React components, NOT Canvas
- `<line>` elements for board edges
- `<circle>` elements for nodes
- Pieces as React components positioned via SVG `transform`
- Legal move highlights as glowing/pulsing circles on valid destinations
- `viewBox` provides automatic responsive scaling
- No animations in Phase 1 — just instant state updates (animations are Phase 3)

### Board Interaction
- Tap-tap model: tap piece/empty-node to select, tap destination to place/move
- During placement: tap empty node places a goat
- During movement: tap own piece to select, tap adjacent empty node to move
- During tiger capture: tap tiger, tap landing node (engine infers the jump)
- During chain-hop: after a capture, if more captures available, legal destinations shown — tap to continue or tap a "done" control to end turn
- No drag-to-move in Phase 1 (added in Phase 4)
- Invalid tap: show brief visual feedback (red flash or shake), no move applied

### UI Layout
- Board is the central element, fills available space
- Turn indicator above or beside the board (whose turn + piece type icon)
- Goat pool counter: shows remaining goats to place (visible during placement phase)
- Captured goat counter: shows number of goats captured by tigers
- Game over overlay: displays result (Tiger Wins / Goat Wins / Draw), reason, and "New Game" button
- Minimal chrome — the board is the star

### Project Scaffolding
- Vite + React + TypeScript (strict mode)
- Tailwind CSS v4 for shell UI styling (NOT for SVG elements — SVG uses CSS custom properties)
- Vitest for engine unit tests
- GitHub Pages deployment via GitHub Actions

### Testing Strategy
- Exhaustive engine unit tests are a PRIMARY deliverable, not an afterthought
- Test topology: verify all 23 nodes, adjacency lists match board-graph.md, jump path derivation
- Test moves: legal move generation for placement and movement phases
- Test captures: single jump, chain-hop continuation, chain-hop termination
- Test phase transitions: placement → movement at 15th goat
- Test win conditions: tiger wins (10 captures), goat wins (all tigers trapped)
- Test draw conditions: threefold repetition, 50 captureless moves
- Test undo/redo: including mid-chain-hop undo
- Test edge cases: last goat placement triggers phase change, tiger with no legal moves during placement

### Claude's Discretion
- Exact SVG coordinate values for node positions (as long as the board looks correct)
- CSS styling details for the board shell (colors, fonts, spacing)
- Internal data structure optimizations
- Test framework configuration details
- Exact error message wording for invalid moves

</decisions>

<specifics>
## Specific Ideas

- Board layout reference: triangle-over-grid — the apex (node 0) is at the top, row 1 (nodes 1-3) forms the triangle base, and the 5×4 grid (nodes 4-22) hangs below
- Tigers should be visually dominant (larger, bolder) — goats smaller and more numerous
- The board should feel like a physical game board — clean lines, clear intersections
- Game reference docs are canonical: `specs/game-rules.md` for rules, `specs/board-graph.md` for topology

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes all patterns
- Research recommends: Tailwind v4 with `@tailwindcss/vite` plugin, Vitest for testing

### Integration Points
- Engine must be importable into Web Worker (Phase 2 dependency)
- `GameEvent[]` from `applyMove` will drive animation sequencing in Phase 3
- `GameState` serialization to JSON for localStorage auto-save (Phase 3) and WebRTC relay (Phase 4)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-engine-board*
*Context gathered: 2026-03-04*
