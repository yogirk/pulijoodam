# Pitfalls Research

**Domain:** Web-based asymmetric strategy board game (Pulijoodam / Tiger-Goat)
**Researched:** 2026-03-04
**Confidence:** HIGH (engine/AI/PWA sections), MEDIUM (WebRTC section)

---

## Critical Pitfalls

### Pitfall 1: Jump-Path Derivation Misses Diagonal-vs-Orthogonal Direction

**What goes wrong:**
The 23-node board has both orthogonal (grid) and diagonal (triangle apex) connections. When computing jump triples `(A, over B, land C)` by adding direction vectors, the code may register illegal jumps — e.g., a tiger at a grid corner computing a diagonal direction into the triangle zone and hitting a node that is geometrically collinear but not graph-adjacent to B. Captured goat is removed; landing node is accepted; no error is thrown. The bug is silent.

**Why it happens:**
Developers derive jump paths by arithmetic on (x, y) coordinates. The check "node C exists AND is adjacent to B" is the critical guard, but it is easy to write "node C exists AND distance from B equals expected step" instead — which is a different and weaker condition. In this board the apex triangle creates short diagonals that can produce false collinearity with distant grid nodes.

**How to avoid:**
The TECH-SPEC derivation algorithm (step 3: "node C exists AND is adjacent to B") is correct. Implement it literally: `adjacencyList[B].includes(C)` — not a distance check. After building the jump map, enumerate all 23×23×23 triples and assert: every registered jump triple `(A,B,C)` must satisfy both `adj[A].includes(B)` and `adj[B].includes(C)`. Write this as an engine unit test that runs against the hard-coded board-graph.md adjacency list.

**Warning signs:**
- AI captures goats from positions that feel "too far away"
- Manual test: place goat at node 4 (corner), tiger at node 9 (below it), no empty node beyond — tiger should not be able to jump; if it can, the jump map is wrong
- Tiger captures across the triangle/grid seam in unexpected directions

**Phase to address:** Phase 1 (engine unit tests — topology, captures)

---

### Pitfall 2: Chain-Hop Termination Handled in UI Instead of Engine

**What goes wrong:**
Mid-chain-hop state (`chainJumpInProgress`) is a first-class game state concept, but developers often leak it into the UI layer ("if a capture just happened, check the board for more jumps"). When the engine and UI disagree on when a chain ends, you get: UI lets the goat player move while a chain is still live; or the tiger can "opt out" of a chain inconsistently; or undo during a chain leaves the board in a corrupt intermediate state.

**Why it happens:**
Chain-hops feel like a UI concern ("keep highlighting destinations") so developers handle the continuation check in the React component rather than in `getLegalMoves()`. The engine's `GameState.chainJumpInProgress` field then becomes decorative.

**How to avoid:**
`getLegalMoves()` must be the single authority. When `chainJumpInProgress !== null`, it returns only further-jump moves for the in-progress tiger, or an empty list (signalling chain end and turn switch). The UI reads `getLegalMoves()` on every render — it never reasons independently about whether a chain is ongoing. Write unit tests for: chain of 2 jumps, chain where second jump is optional (Andhra rules), undo in the middle of a chain.

**Warning signs:**
- Undo during a chain-hop leaves a captured goat on the board
- Goat player gets a move prompt between two tiger jumps
- Chain logic works in isolation but breaks when the AI is playing tiger (because the AI calls `applyMove()` twice without going through the UI)

**Phase to address:** Phase 1 (engine correctness), Phase 2 (AI self-play exposes chain-hop bugs quickly)

---

### Pitfall 3: Threefold Repetition Hash Includes Mutable Transient Fields

**What goes wrong:**
The draw-detection hash is computed over `GameState`. If the hash includes fields that differ between two positions that are logically identical — e.g., `moveHistory`, `capturelessMoves`, or `chainJumpInProgress` when null — two identical board positions produce different hashes. Draws are never declared; the `stateHashes` map bloats. Or worse: if the hash is too shallow (only `board` array), two states that are positionally identical but have different `currentTurn` values hash the same, and a draw is declared prematurely.

**Why it happens:**
`JSON.stringify(state)` is tempting as a quick hash. It includes everything: history arrays, config, the works. Developers either include too much (false negatives for repetition) or too little (false positives).

**How to avoid:**
Hash exactly: `board` (piece positions) + `currentTurn` + `chainJumpInProgress`. Nothing else. Use a fast, consistent serialisation — concatenate the 23-slot board array as a string plus turn char plus chain state. For performance in MCTS simulations, pre-compute a Zobrist hash: 23 nodes × 3 states (empty/tiger/goat) = 69 random 32-bit numbers XOR'd together, plus turn bit and chain bit. This is O(1) incremental update on each move application. Write unit tests: same board same turn = same hash; same board different turn = different hash; history irrelevant to hash.

**Warning signs:**
- Long games between two AIs at Expert level never trigger draw (check: is `stateHashes` actually accumulating entries?)
- Draw triggered on move 2 or 3 (hash too coarse)
- `stateHashes` map grows without bound during self-play benchmarks

**Phase to address:** Phase 1 (draw detection), Phase 2 (exposed by AI self-play loops)

---

### Pitfall 4: SVG Node Hit Areas Are Too Small on Mobile

**What goes wrong:**
SVG `<circle>` elements for board nodes are sized visually (e.g., radius 8–12px) and are the sole touch target. On a 320px-wide phone screen, the 23 nodes of this board are packed at roughly 20–25px spacing in the grid section. Tapping a node reliably requires hitting a circle with a 16–24px diameter — less than half the 44px minimum. Users tap adjacent nodes constantly. The board feels broken.

**Why it happens:**
The board renders correctly on a 1440px desktop monitor. Developers test on desktop, ship, then discover the mobile problem. SVG `viewBox` auto-scales the visual but not the interaction — a circle rendered at radius 10 in a viewBox will have a 10-unit touch area regardless of the rendered pixel size on screen.

**How to avoid:**
Overlay transparent `<circle>` or `<rect>` hit-area elements at a fixed 44px minimum, separate from the visual circles. Use a `hitRadius` computed as `max(visualRadius, 22)` in SVG user units scaled to match rendered size. Calculate: if the viewBox is 400 units wide and the screen is 320px, one unit = 0.8px — so you need hit circles of radius 27.5 units (= 22px / 0.8) to achieve 44px. Derive this from the container's `getBoundingClientRect()` at mount. Test on a real 375px-wide device, not browser devtools emulation.

**Warning signs:**
- Tap accuracy below 90% in manual playtesting on a physical iPhone SE
- Users reporting "I tapped but nothing happened"
- Devtools mobile emulation works but real device doesn't

**Phase to address:** Phase 1 (board interaction), Phase 3 (responsive design audit), Phase 7 (final accessibility pass)

---

### Pitfall 5: Web Worker AI Serialization Blocks Main Thread on State Size

**What goes wrong:**
`postMessage(gameState)` to the AI worker triggers structured clone serialization. The `GameState` includes `moveHistory: Move[]` (up to 100+ moves in a late game), `stateHashes: Map<string, number>` (potentially hundreds of entries), and the full `config` object. Structured clone of complex nested objects with Maps takes 5–15ms on mid-range devices. This runs on the main thread, stalling the UI briefly on every move — visible as a frame drop just before the "thinking" spinner appears.

**Why it happens:**
The cost is invisible in Chrome devtools on a MacBook Pro. It appears in production on Android mid-range or under CPU throttling. The `Map` type is particularly expensive to serialize because it's not a plain object.

**How to avoid:**
Serialise only what the AI needs: `{ board: number[], phase, currentTurn, goatsInPool, goatsCaptured, chainJumpInProgress, config }`. The AI does not need `moveHistory` or `stateHashes` — it computes its own search tree. Keep `GameState` intact in the main thread; pass a minimal `AIInput` type to the worker. This reduces the payload from ~10KB to ~200 bytes for a typical game state. Measure with a `performance.mark()` around the `postMessage()` call in development.

**Warning signs:**
- Slight UI freeze (jank) when the AI begins computing, separate from when it finishes
- Chrome Performance tab shows a long "structured clone" task on the main thread call stack
- Problem appears only on CPU-throttled devtools or real low-end devices

**Phase to address:** Phase 2 (Web Worker setup)

---

### Pitfall 6: MCTS Evaluation Asymmetry — Tiger Wins Without Training Signal

**What goes wrong:**
In random-play MCTS rollouts for the placement phase, tigers win dramatically more often than goats (research on comparable games like Bagh Chal confirms this bias). The MCTS tree therefore rates goat placement moves as near-equivalent (all lead to ~70% tiger win in rollouts), fails to distinguish good from bad goat positions, and produces an AI that plays mediocre goat placement but excellent tiger. Result: "Hard" goat AI feels Easy; "Easy" tiger AI feels Hard.

**Why it happens:**
Pure MCTS rollouts assume random play is a reasonable proxy for game quality. In highly asymmetric games with a dominant player in random play, this proxy breaks down for the weaker-in-random-play side.

**How to avoid:**
Replace pure random rollouts with heuristic-guided rollouts. During MCTS simulation, instead of selecting random moves, bias toward moves that score highly on a simple heuristic (e.g., goats: prefer placements that block tiger adjacencies; tigers: prefer placements that create capture opportunities). Even light guidance — selecting the best of 3 random moves — significantly improves goat evaluation signal. Validate with AI self-play: at each difficulty level, goat win rate should be 20–40% at Easy, rising to 35–50% at Expert. If goat win rate is under 10% at any level, rollout bias is the cause.

**Warning signs:**
- Easy AI beats new human players as tiger but loses trivially as goat
- Expert AI as goat loses to Medium AI as tiger consistently
- AI self-play shows tiger win rate above 85% at all difficulty levels

**Phase to address:** Phase 2 (AI implementation and self-play validation)

---

### Pitfall 7: WebRTC P2P Fails for ~20–30% of Users Without TURN

**What goes wrong:**
The plan is zero-server WebRTC with manual SDP exchange. STUN-only connections fail when either peer is behind a symmetric NAT or a strict corporate/mobile carrier firewall. Industry data: approximately 20% of users operate behind restrictive NAT, and up to 30% of WebRTC sessions require a TURN relay server. For these users, connection simply never establishes — the invite code exchange completes but the data channel never opens. There is no error message; the app silently hangs.

**Why it happens:**
Developers test on their home/office network where STUN works. They don't test on mobile carrier networks, strict corporate proxies, or from behind double-NAT (common with 4G/5G). The assumption "it's just a turn-based game, no real-time needed" is correct for latency but not for connection establishment.

**How to avoid:**
Use free public STUN servers (Google's `stun:stun.l.google.com:19302`) for the majority of users. Document the failure case explicitly: show a fallback UX ("Connection failed — your network may block direct connections. Try a different network or share a link via the local network."). Do NOT promise "zero server" in the UI — promise "no account required." For a future hardening phase, consider a free/self-hosted TURN server (Coturn on a $5/month VPS). The data channel is text-only turn-based game commands — TURN relay bandwidth is negligible. For Phase 6, the minimum viable bar is: connection works on home WiFi + mobile (most cases), and fails gracefully with a clear message elsewhere.

**Warning signs:**
- Manual testing works between two machines on the same WiFi
- Testing from phone (mobile data) to laptop (WiFi) hangs indefinitely
- No ICE connection state progress visible in browser devtools WebRTC internals

**Phase to address:** Phase 6 (P2P multiplayer)

---

### Pitfall 8: State Desync in P2P Due to Both Clients Running Engine Independently

**What goes wrong:**
Both peers run the engine locally and relay only moves (commands). If the engine has any non-determinism — or if a client applies a move in a slightly different game state due to an earlier disagreement — the boards silently diverge. Tigers appear on different nodes on each screen. The game continues with each player seeing a different board. The bug is catastrophic and invisible.

**Why it happens:**
The "lockstep with relay" pattern requires the engine to be perfectly deterministic. Any hidden state — e.g., a `Math.random()` call inside move validation, a floating-point comparison, or an engine bug that triggers only on certain state transitions — produces divergence. Also: if undo is mistakenly enabled in P2P games, one client's undo is not relayed, and the states immediately diverge.

**How to avoid:**
The engine must be entirely deterministic and pure (no random calls — the AI's randomness lives in the worker, and only the chosen move is relayed). Enforce this at the type level: the engine takes no `Random` parameter; AI difficulty randomness is injected only at the AI layer. Add a state hash check: after each move, both clients compute the board hash and include it in the next message. If hashes diverge, surface a "Sync error — game state mismatch" banner and offer to restart. This catches divergence at the first bad move rather than 10 moves later. The TECH-SPEC notes to disable undo in P2P — enforce this in the engine layer, not just the UI.

**Warning signs:**
- Manual P2P test where one player undoes via browser refresh and the other does not
- AI-driven automated P2P test shows board position mismatch after 20 moves
- One player sees "goat's turn" while the other sees "tiger's turn"

**Phase to address:** Phase 6 (P2P multiplayer)

---

### Pitfall 9: Service Worker Serves Stale Build After GitHub Pages Deploy

**What goes wrong:**
A user has the app installed as a PWA or cached offline. A new version is deployed to GitHub Pages. The service worker intercepts the request for `index.html`, serves the cached version, and never fetches the new one. The user runs old code — potentially with a bug that was just fixed — indefinitely, until they manually clear cache or the browser evicts it. Safari is particularly aggressive at serving stale service worker responses.

**Why it happens:**
Vite's `vite-plugin-pwa` default precache strategy caches `index.html` aggressively. GitHub Pages sets permissive cache headers. The service worker `sw.js` file itself is cached by the browser's HTTP cache, so even the new service worker is not fetched. The update loop is: new `sw.js` → new `sw.js` is fetched → install → wait for all tabs to close → activate. If users leave tabs open, they run old code for days.

**How to avoid:**
Configure `vite-plugin-pwa` with `registerType: 'autoUpdate'` — when a new service worker is detected, automatically skip waiting and reload the page. This is appropriate for a game (no unsaved form data to lose). Set `cache-control: no-cache` on `sw.js` and `index.html` at the GitHub Pages level (use a `_headers` file if the host supports it, or accept the browser's default behavior of re-checking the SW file every 24 hours). Add a visible "New version available — tap to update" prompt as a secondary measure. Vite's plugin handles cache-busting of hashed assets automatically — the risk is only for `index.html` and `sw.js`.

**Warning signs:**
- After deploying a bug fix, some users still report the bug
- The app version string in Settings shows an old version
- Browser devtools > Application > Service Workers shows a "waiting" worker

**Phase to address:** Phase 7 (service worker / PWA)

---

### Pitfall 10: localStorage Game History Grows Without Bound

**What goes wrong:**
Auto-save on every move writes the full game state (23-node board + history + metadata) to `localStorage`. A complete game is ~50 moves; at ~1KB per state snapshot, one game = ~50KB. After 200 games (realistic for an engaged player), the history store exceeds 10MB and hits the browser's `localStorage` quota. The next `setItem()` throws a silent `QuotaExceededError`, the auto-save silently fails, and the user's in-progress game is lost on browser close.

**Why it happens:**
localStorage's 5–10MB limit feels large during development. The auto-save write is fire-and-forget without error handling. Developers test with a handful of games, never reach the limit, and ship.

**How to avoid:**
Wrap every `localStorage.setItem()` in try/catch for `QuotaExceededError`. When quota is exceeded, evict the oldest N games before retrying. Store only the final game state (not every move snapshot) in the history list; use the engine's `moveHistory` array to reconstruct intermediate states for replay — do not store 50 snapshots per game. The in-progress game snapshot (one entry, overwritten every move) should be a separate key from the history archive. Cap history at a configurable maximum (e.g., 100 games); surface a "History full — oldest games deleted" notification.

**Warning signs:**
- Long-term playtesting session loses a game on browser close with no warning
- `localStorage.getItem('gameHistory')` returns a JSON string longer than 1MB
- Any console error mentioning `QuotaExceededError` during manual testing

**Phase to address:** Phase 5 (game history), Phase 3 (settings persistence begins here)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode adjacency as plain array literal | No graph abstraction needed for MVP | Cannot validate graph integrity; jump derivation harder to audit | Phase 1 only if exported as a tested constant |
| Put chain-hop state in UI (React state, not engine) | Faster to implement in Phase 1 | Breaks AI move application; undo is unpredictable | Never — chain state belongs in engine |
| Use `JSON.stringify(state)` as position hash | Zero implementation effort | Includes history/config; threefold detection broken | Never — always hash only the position tuple |
| Pass full `GameState` to Web Worker | Simpler message protocol | Main-thread serialization jank on mid-range devices | Acceptable in Phase 2 MVP; fix before Phase 3 ships |
| Skip TURN server entirely | Zero infra cost | 20–30% of users cannot connect via P2P | Acceptable for Phase 6 launch if error message is clear |
| Auto-save full state snapshots per move | Simple replay implementation | localStorage quota exceeded after ~200 games | Phase 3 short-term; fix before Phase 5 ships |
| Pure random MCTS rollouts | Fastest to implement | Goat AI is systematically weak; difficulty levels misleading | Phase 2 prototype only; fix before user-facing ships |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Web Worker + Engine | Import React or Vite-specific modules into worker | Keep `src/engine/` import-free from React; worker imports engine directly |
| Web Worker + AI | Terminate worker on component unmount without cancelling in-flight computation | Track worker state; ignore result if game mode changed before AI responds |
| SVG + React | Animate `cx`/`cy` or `d` attributes (triggers layout) | Animate only `transform` and `opacity` via CSS transitions — GPU composited |
| SVG + Touch | Attach `onClick` to visual `<circle>` | Overlay a larger transparent hit-area element with the click handler |
| localStorage + JSON | Call `JSON.parse()` on potentially-corrupted data without try/catch | Always wrap in try/catch; on parse failure, discard the save and start fresh |
| WebRTC + GitHub Pages | Use `http://` STUN URLs | STUN/TURN URLs must use `stun:` / `turns:` scheme; GitHub Pages is HTTPS so mixed-content rules apply |
| vite-plugin-pwa + GitHub Pages | Default `registerType: 'prompt'` leaves stale content for weeks | Use `registerType: 'autoUpdate'` for a game app with no critical unsaved state |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Re-rendering entire SVG board on every state change | Visible frame drops during animations; high CPU on React DevTools profiler | Memoize `<BoardLines>` and `<Node>` components; only re-render pieces that moved | From Phase 3 (animations) — invisible without animations |
| MCTS running 100K simulations synchronously in worker | Worker returns after 8+ seconds; UI shows frozen "thinking" spinner | Use iterative deepening with a time budget: check `Date.now()` every 100 iterations; return best move found so far | Expert difficulty, move 1 of the game (highest branching) |
| Animating chain-hop captures sequentially without queuing | Second jump animation fires before first resolves; board in wrong visual state | Use an animation queue: engine returns all `GameEvent[]`; UI dequeues one at a time with `setTimeout` gaps | Phase 3 (chain-hop animation) |
| Loading full game history from localStorage synchronously on app start | App startup jank proportional to history size | Load only metadata (game list) on start; load full move history only when user opens replay | After ~50 saved games |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual distinction between "no legal moves" and "must continue chain-hop" | Player confused whether it's their turn | Show distinct UI state: "Tiger is jumping — watch for more captures" vs. "No moves — trapped" |
| AI "thinking" with no time indication | Player thinks app is frozen on Expert AI (up to 5 seconds) | Show animated spinner from the moment the AI is invoked; show "Thinking..." text with elapsed seconds |
| Tap-tap interaction: second tap on same piece deselects but looks like a miss | Player confused; double-tap feels broken | Animate deselection visually; treat second tap on selected piece as explicit "cancel selection" |
| Chain-hop: player doesn't realise they can stop the chain | Mandatory multi-jump vs. optional (Andhra rules allow stopping) | Show "Stop chain" button explicitly during a chain in Andhra preset |
| P2P: "connection failed" with no actionable guidance | User gives up, thinks the feature is broken | Show: "Try switching from WiFi to mobile data" / "Ask your friend to try a different network" |
| Game over screen with no "Rematch" button | Friction kills engagement; user closes the app | Game-over screen must have: Rematch, Review Game, Main Menu — in that priority order |

---

## "Looks Done But Isn't" Checklist

- [ ] **Capture logic:** Tigers can capture in both phases (placement AND movement) — verify tigers can capture during Phase 1 (placement phase) before all goats are placed
- [ ] **Chain-hop opt-out:** In Andhra rules, chain continuation is optional — verify the engine allows tiger to stop mid-chain, and the UI shows this choice
- [ ] **Draw detection:** Verify 50-move counter resets to zero on any capture; verify it does NOT reset on a non-capturing move
- [ ] **Turn order correctness:** Goat player moves first in Phase 1 — verify the initial `currentTurn` is `'goat'`, not `'tiger'`
- [ ] **Phase transition timing:** Phase transitions to movement when `goatsInPool === 0` and the current goat placement move is applied — not before the move is applied
- [ ] **Win condition:** Tiger wins at 10 captures (Andhra) — verify the win check triggers after the 10th capture is applied, not at 9
- [ ] **AI undo:** Undo in AI games should undo both the AI's move AND the human's preceding move — verify it undoes the pair, not just one move
- [ ] **P2P undo disabled:** The P2P game mode must disable undo at the engine config level, not just hide the UI button
- [ ] **localStorage on private browsing:** `localStorage.setItem()` throws immediately in strict private mode on Safari — verify graceful fallback (in-memory only, warn user)
- [ ] **SVG `viewBox` scaling on orientation change:** Board must re-derive touch hit-area sizes after device rotation — verify `getBoundingClientRect()` is re-called on `resize`/`orientationchange`

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Jump-path bug discovered after Phase 1 ships | MEDIUM | Engine fix + new test cases; no UI changes needed; deploy patch |
| Chain-hop in UI not engine | HIGH | Refactor: move all chain state into engine; audit AI move application; re-test all capture scenarios |
| Wrong position hash causing draw misfire | MEDIUM | Fix hash function; reset `stateHashes` key format; existing saved games become unreplayable (acceptable) |
| SVG touch targets too small discovered in Phase 3 | LOW | Add transparent overlay elements; no engine changes |
| MCTS goat bias discovered post-Phase 2 | MEDIUM | Rewrite rollout function; re-tune difficulty parameters; re-run self-play validation |
| P2P desync in production | HIGH | Add state hash cross-check protocol; requires coordinated deploy (both peers must update); offer "Restart game" as escape hatch |
| Service worker serving stale build | LOW | Update vite-plugin-pwa config; force SW update via version bump in manifest |
| localStorage quota exceeded | LOW | Add eviction logic + error handling; existing data preserved (just capped) |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Jump-path adjacency error | Phase 1 | Unit test: enumerate all jump triples, assert both adjacency conditions |
| Chain-hop in UI not engine | Phase 1 | Unit test: `getLegalMoves()` during chain returns only continuation moves |
| Threefold repetition hash wrong | Phase 1 | Unit test: hash equality for logically identical positions; inequality for different turns |
| SVG touch targets too small | Phase 1 (layout), Phase 7 (audit) | Manual test on physical device ≤375px width |
| Web Worker serialization jank | Phase 2 | `performance.mark()` on postMessage; must be <2ms |
| MCTS goat bias | Phase 2 | AI self-play: tiger win rate at all levels must be between 55–80% |
| WebRTC connection failure (no TURN) | Phase 6 | Test from mobile carrier network to home WiFi; verify error message shown on timeout |
| P2P state desync | Phase 6 | Automated: run 50 self-play games via simulated P2P relay; compare final board hashes |
| Service worker stale cache | Phase 7 | Deploy a canary build; verify returning users see new version within 24 hours |
| localStorage quota overflow | Phase 5 | Stress test: simulate 300 completed games; verify no silent data loss |

---

## Sources

- [Boardgame.io Hacker News discussion — adjacency recognition as hardest graph-board problem](https://news.ycombinator.com/item?id=42449497)
- [Hybrid Minimax-MCTS and Difficulty Adjustment for General Game Playing (SBGames 2023)](https://arxiv.org/abs/2310.16581)
- [Mastering Bagh Chal with self-learning AI — programiz.com (asymmetric game evaluation bias)](https://www.programiz.com/blog/mastering-bagh-chal-with-self-learning-ai/)
- [Goats-and-Tigers RL — asymmetric game random-play bias documented](https://github.com/cjfelixx/Goats-and-Tigers)
- [Is postMessage slow? — surma.dev (serialization cost analysis)](https://surma.dev/things/is-postmessage-slow/)
- [Performance issue of using massive transferable objects in Web Worker — joji.me](https://joji.me/en-us/blog/performance-issue-of-using-massive-transferable-objects-in-web-worker/)
- [WebRTC TURN server statistics — VideoSDK: 20–30% failure rate without TURN](https://www.videosdk.live/developer-hub/webrtc/turn-server-for-webrtc)
- [Building Real-Time P2P Multiplayer Games — Medium/@aguiran (desync resolution patterns)](https://medium.com/@aguiran/building-real-time-p2p-multiplayer-games-in-the-browser-why-i-eliminated-the-server-d9f4ea7d4099)
- [Mastering SVG Animation in React: Common Pitfalls — infinitejs.com](https://infinitejs.com/posts/mastering-svg-animation-react-pitfalls/)
- [Repetitions — Chessprogramming wiki (Zobrist hash, hash collision probability)](https://www.chessprogramming.org/Repetitions)
- [Storage quotas and eviction criteria — MDN (localStorage 5–10MB limit)](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Web browser game randomly losing localStorage data — itch.io (QuotaExceededError in production)](https://itch.io/t/5464689/web-browser-game-randomly-losing-localstorage-data)
- [Handling Service Worker updates — whatwebcando.today](https://whatwebcando.today/articles/handling-service-worker-updates/)
- [Taming PWA Cache Behavior — iinteractive.com (Safari stale cache)](https://iinteractive.com/resources/blog/taming-pwa-cache-behavior)
- [vite-plugin-pwa service worker not detecting updates — GitHub Discussion #821](https://github.com/vite-pwa/vite-plugin-pwa/discussions/821)
- [Accessible tap target sizes — Smashing Magazine (44px standard, precision variation by screen zone)](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/)
- [Rendering Game With SVG + React — radzion.com (board game SVG performance patterns)](https://radzion.com/blog/breakout-game/render/)

---
*Pitfalls research for: Pulijoodam — web-based asymmetric board game (Tiger vs Goat)*
*Researched: 2026-03-04*
