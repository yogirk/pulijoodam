# Project Research Summary

**Project:** Pulijoodam — Web-based asymmetric strategy board game
**Domain:** Browser SPA, abstract strategy game with AI and P2P multiplayer
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

Pulijoodam is an asymmetric Tigers-and-Goats strategy game targeting a web-first SPA on GitHub Pages. Research confirms the recommended approach is a layered architecture: a pure TypeScript game engine with zero UI dependencies at the core, React/Vite for rendering, a Web Worker for AI computation, and WebRTC for serverless P2P multiplayer. The competitive landscape (Baghchal.net, onlinesologames.com) sets a very low quality bar — existing implementations lack tutorials, PWA support, and modern P2P — making it achievable to ship the definitively best web implementation of this game class simply by executing the planned feature set.

The most important architectural decision — and the one with the highest failure risk — is building the engine as a pure functional module before anything else. Every other component (AI, P2P synchronization, undo/redo, replay, tutorial) depends directly on the engine being correct and deterministic. AI implementation carries its own specific risk: the asymmetric nature of Tiger-Goat games causes MCTS rollouts to systematically undervalue goat play, requiring heuristic-guided rollouts rather than pure random simulation. This is a well-documented pattern in this game class and must be addressed intentionally.

The stack is fully verified (React 19.2, Vite 7, TypeScript 5.9, Vitest 4, Tailwind v4) with no breaking compatibility issues. The only MEDIUM-confidence dependencies are peripheral: Comlink (stable, infrequent releases), PeerJS (last release June 2025), and Howler (stable, unmaintained). All three are replaceable with raw APIs if needed. The recommended build order is bottom-up: engine → board rendering → local play → AI → polish → tutorial → persistence → P2P → PWA.

---

## Key Findings

### Recommended Stack

The stack is TypeScript-first with Vite 7 as the build system. All versions are current-stable as of March 2026. Tailwind CSS v4 with `@tailwindcss/vite` provides zero-config styling for the shell UI; SVG board elements use presentation attributes and CSS custom properties instead. State management starts with `useReducer` + Context and upgrades to Zustand v5 only if profiling shows context re-render issues. Testing is Vitest 4 for unit/integration and Playwright 1.58 for E2E game flows.

**Core technologies:**
- TypeScript 5.9 + React 19.2 + Vite 7: base stack, non-negotiable; `noUncheckedIndexedAccess` is critical for safe board array access
- Motion (framer-motion 12): SVG piece animation with timeline sequencing for chain-hop multi-event turns
- Comlink 4.4.2: typed async proxy over Web Worker `postMessage` — enforces TypeScript contract on AI communication
- PeerJS 1.5.5: WebRTC wrapper for P2P invite-link multiplayer; relies on hosted PeerServer for signaling only
- Howler 2.2.4: audio sprites for piece sounds; stable but unmaintained — monitor for browser API breakage
- vite-plugin-pwa 1.2: zero-config Workbox precaching + web manifest for offline/installable PWA

Full install commands and `vite.config.ts` are in `.planning/research/STACK.md`.

### Expected Features

The quality bar from existing Tiger-Goat web apps is extremely low. None has a real interactive tutorial. None is installable. None uses modern P2P. The features already planned represent a significant leap over every existing implementation.

**Must have (table stakes):**
- Rules-correct game engine (move gen, capture, win/draw detection) — everything is meaningless without this
- SVG board with tap-tap interaction and legal move highlighting — mobile-first, 44px min touch targets
- AI opponent at all difficulty levels — solo play is the primary use case for niche games without an active playerbase
- Win/loss detection with clear result screen and rematch button
- Undo last move — absence feels punishing; expose via engine's history stack
- Game auto-save to localStorage — survive tab close/refresh without data loss
- Turn indicator and phase status — always visible, no ambiguity
- Responsive layout (mobile + desktop) — 60%+ of casual web traffic is mobile

**Should have (competitive differentiators):**
- Interactive tutorial with guided first game — no existing implementation has this; chain-hop rules are non-obvious
- Move-by-move replay of completed games — pairs naturally with auto-save
- PWA manifest + service worker — installable, offline-capable; low effort, high perceived quality
- Sound effects with on/off toggle — satisfying micro-interactions build habit
- Cultural "About Pulijoodam" context — emotional investment for users discovering the game
- Multiple AI difficulty levels (4: Easy/Medium/Hard/Expert) — existing apps offer 1-3 levels

**Defer (v2+):**
- P2P multiplayer via WebRTC invite link — high complexity; add after core is validated and players ask for it
- Local hot-seat 2-player mode — lower priority than AI
- Visual theme selector — post-launch aesthetic feedback
- Tamil rule variant — effectively a second engine; doubles test surface; defer until v1 has players
- Post-game analysis / blunder detection — requires oracle-quality engine evaluation

Full prioritization matrix is in `.planning/research/FEATURES.md`.

### Architecture Approach

The architecture is a clean 4-layer system: pure engine at the bottom, hooks as the application coordination layer, React components as the purely presentational layer, and boundary processes (AI Web Worker, WebRTC data channel) at the edges. The defining principle is that `src/engine/` has zero imports from React, Vite, or any UI library — enabling Web Worker use, pure unit testing, and a clean interface for a future Rust port.

**Major components:**
1. `src/engine/` — Pure TS functions: `applyMove(state, move) → { nextState, events }`. Owns all game logic, immutable state, move generation, win detection.
2. `useGame` hook — Central coordinator: owns live `GameState`, dispatches moves, sequences animations, routes to `useAI` or `useP2P`, writes to localStorage.
3. `src/workers/ai.worker.ts` — Stateless AI subprocess: receives minimal `AIInput`, returns `Move`. Imports engine directly; no React.
4. SVG Board components — Presentational: `Board`, `Edge`, `Node`, `TigerPiece`, `GoatPiece`, `MoveHighlight`. Each animates independently.
5. `useP2P` hook — WebRTC lifecycle: creates offer/answer, manages data channel, injects remote moves via callback to `useGame`.
6. localStorage adapter — Versioned JSON serialization with `try/catch` on every write; in-progress save is a separate key from history archive.

Four key patterns to follow: (1) functional engine with immutable state, (2) stateless AI Web Worker per call, (3) command relay for P2P (send moves, not state), (4) event-driven animation queue from `GameEvent[]`.

Full build order with dependency graph is in `.planning/research/ARCHITECTURE.md`.

### Critical Pitfalls

1. **Jump-path adjacency bug (Pitfall 1)** — When deriving jump triples `(A, over B, land C)` from coordinate arithmetic, the check must be `adjacencyList[B].includes(C)`, not a distance check. The diagonal/orthogonal hybrid board creates false collinearity. Prevention: implement the check literally from `board-graph.md`, then enumerate all 23×23×23 triples in a unit test and assert both adjacency conditions hold. Address in Phase 1.

2. **Chain-hop state in UI instead of engine (Pitfall 2)** — `getLegalMoves()` must be the sole authority on whether a chain is ongoing. When `chainJumpInProgress !== null`, it returns only continuation moves — the UI never reasons independently. Putting chain state in React causes undo corruption and AI desync. Never put chain state in UI. Address in Phase 1.

3. **MCTS goat evaluation bias (Pitfall 6)** — In purely random rollouts, tigers win ~70% of games, making MCTS fail to distinguish good from bad goat placements. Replace pure random rollouts with heuristic-guided rollouts (bias toward blocking tiger adjacencies for goats). Validate with AI self-play: tiger win rate must be 55–80% across all difficulty levels. Address in Phase 2.

4. **WebRTC fails for 20–30% of users without TURN (Pitfall 7)** — STUN-only connections fail for symmetric NAT / mobile carrier users. For P2P launch: use Google public STUN, show a clear actionable error on connection timeout, and document that this is a network limitation. Add Coturn relay only in a future hardening phase. Address in Phase 6.

5. **Web Worker serialization jank (Pitfall 5)** — Sending full `GameState` (including `moveHistory` array and `stateHashes` Map) via `postMessage` costs 5–15ms on mid-range devices. Send only a minimal `AIInput` type: `{ board, phase, currentTurn, goatsInPool, goatsCaptured, chainJumpInProgress, config }`. Reduces payload from ~10KB to ~200 bytes. Address in Phase 2.

Full pitfall list with phase mappings and recovery costs is in `.planning/research/PITFALLS.md`.

---

## Implications for Roadmap

Based on the dependency graph from architecture research and the pitfall-to-phase mapping from pitfalls research, seven phases are recommended:

### Phase 1: Game Engine + Playable Board

**Rationale:** The engine is the foundation of everything. AI, undo, replay, P2P, and tutorial all require a correct, deterministic engine. The single highest-impact decision is getting rules correct before building on top. This phase ends with a local hot-seat game (human vs human, same device) — the first shippable milestone.

**Delivers:** Rules-correct engine (board topology, move gen, capture, chain-hops, win/draw detection) + SVG board + tap-tap interaction + legal move highlighting + undo + turn indicator + win/loss result screen + game auto-save.

**Addresses:** All table-stakes features that don't require AI.

**Avoids:** Pitfall 1 (jump adjacency), Pitfall 2 (chain-hop in engine not UI), Pitfall 3 (correct position hash for draw detection), Pitfall 4 (SVG touch targets minimum 44px).

**Research flag:** None needed — well-documented patterns. The game rules are fully specified in `game-rules.md` and `board-graph.md`.

---

### Phase 2: AI Opponent

**Rationale:** AI is required for solo play, which is the primary use case. The feature dependency graph shows AI must come before the tutorial (tutorial needs a benign AI to play against). AI implementation is the most algorithmically complex phase and benefits from the engine's unit test coverage from Phase 1.

**Delivers:** 4 AI difficulty levels (Easy/Medium/Hard/Expert) via hybrid MCTS (placement) + Minimax+alpha-beta (movement) in a Web Worker. Setup screen with difficulty selector. AI self-play validation that goat win rates are reasonable.

**Uses:** Comlink (typed Worker RPC), `vite.config.ts` `worker.format: 'es'` setting.

**Avoids:** Pitfall 5 (minimal AIInput type, not full GameState), Pitfall 6 (heuristic-guided MCTS rollouts), Anti-pattern 3 (AI in Web Worker unconditionally, even at Easy).

**Research flag:** Phase 2 is a candidate for deeper research during planning. MCTS + Minimax for asymmetric games is well-documented but the domain-specific evaluation function (tiger mobility, goat blockade scoring) needs tuning. The hybrid approach (MCTS for placement, Minimax for movement) is a project decision in `TECH-SPEC.md` — validate it against self-play before hardening difficulty parameters.

---

### Phase 3: Polish — Animations, Sound, Responsive Design

**Rationale:** Polish comes after the core loop is validated to avoid reworking animations when game mechanics change. Chain-hop animation sequencing requires the event queue pattern (`GameEvent[]`) which was established in Phase 1 engine design.

**Delivers:** Motion-driven piece animations (place, slide, capture, chain-hop sequence), sound effects (Howler audio sprites), responsive layout audit (mobile devices), visual themes groundwork.

**Uses:** Motion 12 (framer-motion), Howler 2.2.4, SVG `transform`/`opacity` animation (GPU composited — never animate `cx`/`cy` directly).

**Avoids:** Performance trap of re-rendering entire SVG board on every state change (memo `BoardLines`, `Node`; only re-render moved pieces), animation queue race condition during chain-hops.

**Research flag:** None — well-documented SVG animation patterns. The `motion` library has direct SVG element support.

---

### Phase 4: Tutorial + Onboarding

**Rationale:** Tutorial requires a working AI (Easy mode as the "guided opponent") and a fully functional board. It is a key differentiator — no existing Tiger-Goat web app has an interactive tutorial. New players genuinely do not understand the asymmetry, placement phase, or chain-hop rules.

**Delivers:** Step-by-step guided first game explaining piece asymmetry, placement phase vs movement phase, chain-hop rule, win conditions. Cultural "About Pulijoodam" page.

**Addresses:** Interactive tutorial (HIGH differentiator), Cultural framing (LOW complexity, meaningful for target audience).

**Research flag:** None — interactive tutorial is a well-understood UI pattern. Content is the challenge, not implementation.

---

### Phase 5: Persistence + Replay

**Rationale:** Replay requires the move history already stored in `GameState.moveHistory`. Formalizing persistence (history archive, export, clear) is best done after the game loop is stable so the save schema doesn't change frequently.

**Delivers:** Move-by-move replay of completed games. Persistent game history list (capped at 100 games). localStorage eviction on quota exceeded. In-progress game auto-save with graceful Safari private-browsing fallback.

**Avoids:** Pitfall 10 (localStorage quota overflow — store only final state + moveHistory per game, not 50 snapshots; wrap every write in try/catch for `QuotaExceededError`).

**Research flag:** None — localStorage patterns are well-established.

---

### Phase 6: P2P Multiplayer

**Rationale:** P2P is a significant complexity jump (WebRTC lifecycle, SDP exchange UX, state synchronization). It belongs after the core game is validated so the engine's determinism is already proven. This is a v1.x feature — add when at least one player asks for it.

**Delivers:** WebRTC invite-link P2P via PeerJS. Manual Base64 offer/answer exchange (primary flow). Data channel with move relay. Undo disabled in P2P mode at engine config level. Board hash cross-check protocol to detect state desync.

**Avoids:** Pitfall 7 (TURN failure for 20–30% of users — use Google STUN, show actionable error message), Pitfall 8 (state desync — relay moves not state, hash cross-check on every turn), Anti-pattern 2 (send Move commands, not GameState over wire).

**Research flag:** Phase 6 needs deeper research during planning. PeerJS's hosted PeerServer dependency is a single point of failure. The ICE negotiation and STUN/TURN configuration requires testing across network types (home WiFi, mobile carrier, corporate proxy). Manual SDP exchange UX needs usability validation.

---

### Phase 7: PWA + Production Hardening

**Rationale:** PWA is a polish layer that works independently of game features. Service worker precaching, autoUpdate configuration, and the "new version available" prompt are all low-risk, high-value additions that belong at the end when the build output is stable.

**Delivers:** vite-plugin-pwa with `registerType: 'autoUpdate'`, Workbox precache for all game assets including audio, web app manifest (standalone display, branded colors), installable on iOS/Android/desktop. Final accessibility audit (touch targets, color contrast, screen reader labels on SVG).

**Avoids:** Pitfall 9 (stale service worker — `autoUpdate` skips waiting, reloads automatically; audio files explicitly included in `globPatterns`).

**Research flag:** None — vite-plugin-pwa is well-documented and Vite 7 compatibility is confirmed.

---

### Phase Ordering Rationale

- **Engine before everything:** Every feature in the dependency graph (`getLegalMoves`, `applyMove`, `getGameStatus`) requires a correct engine. A buggy engine contaminates AI, replay, and P2P equally.
- **AI before Tutorial:** Tutorial needs a "guided opponent" — Easy AI serves this purpose without building a scripted opponent.
- **Polish (Phase 3) before Tutorial (Phase 4):** Tutorial relies on animations to make guided steps clear. Teaching a move that has no visual feedback is confusing.
- **Persistence (Phase 5) before P2P (Phase 6):** Replay is the natural lower-complexity substitute for spectator mode; having it before P2P means users who can't connect still get post-game review.
- **P2P (Phase 6) before PWA hardening (Phase 7):** P2P is the most error-prone phase; PWA comes last when the build is stable.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm March 2026; Vite 7 + React 19 + TypeScript 5.9 current stable; no compatibility issues |
| Features | MEDIUM-HIGH | Competitor feature inventory based on direct observation of live sites; Lichess as gold standard reference; missing user research data |
| Architecture | HIGH | Patterns are well-established for this class of app (Web Worker AI, command-relay P2P, functional engine); confirmed by boardgame.io reference implementations |
| Pitfalls | HIGH (engine/AI/PWA), MEDIUM (WebRTC) | Engine/AI pitfalls backed by multiple sources including asymmetric game research papers; WebRTC failure rates are industry-cited but vary by deployment |

**Overall confidence:** HIGH

### Gaps to Address

- **AI difficulty tuning:** The evaluation function parameters (tiger mobility weight, goat blockade weight, capture-threat scoring) are not derivable from research alone. Plan a self-play validation loop in Phase 2 to empirically tune difficulty levels. Budget time for iteration.
- **MCTS simulation count vs. time budget:** Research suggests iterative deepening with a time budget rather than fixed simulation counts, but the specific numbers (simulations per second on target hardware) require benchmarking. Flag for Phase 2 planning.
- **PeerServer reliability:** PeerJS's hosted signaling server (`peerjs.com`) is a dependency outside the project's control. For Phase 6, document the fallback (manual SDP exchange without PeerServer) as the primary UX, not the backup.
- **Safari PWA behavior:** Safari's service worker implementation has historically been the most aggressive at serving stale cache and the least reliable for PWA install prompts. Phase 7 must include Safari-specific testing. The `_headers` cache-control file approach may not work on GitHub Pages — test this explicitly.
- **No user research:** Feature prioritization is based on competitor analysis and general web game UX patterns, not user interviews. The tutorial complexity and the cultural framing assumptions should be validated with actual target users (Andhra/Telangana diaspora) as early as possible.

---

## Sources

### Primary (HIGH confidence)
- `.planning/research/STACK.md` — full technology stack with verified npm versions
- `.planning/research/ARCHITECTURE.md` — component boundaries, patterns, build order
- `specs/TECH-SPEC.md` — canonical architecture decisions
- `specs/game-rules.md`, `specs/board-graph.md` — authoritative game rules

### Secondary (MEDIUM confidence)
- `.planning/research/FEATURES.md` — competitor feature inventory (Baghchal.net, onlinesologames.com, Lichess)
- `.planning/research/PITFALLS.md` — pitfalls with phase mappings and recovery costs
- [Mastering Bagh Chal with self-learning AI — programiz.com](https://www.programiz.com/blog/mastering-bagh-chal-with-self-learning-ai/) — MCTS asymmetric game bias
- [WebRTC TURN server statistics — VideoSDK](https://www.videosdk.live/developer-hub/webrtc/turn-server-for-webrtc) — 20–30% failure rate without TURN

### Tertiary (for validation during planning)
- PeerJS hosted PeerServer reliability — needs monitoring; no SLA guarantees
- Safari PWA cache behavior on GitHub Pages — needs explicit testing in Phase 7

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
