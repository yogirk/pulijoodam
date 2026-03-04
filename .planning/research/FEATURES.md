# Feature Research

**Domain:** Web-based abstract strategy board game (asymmetric, single-player AI + local/P2P multiplayer)
**Researched:** 2026-03-04
**Confidence:** MEDIUM-HIGH (based on analysis of Lichess, BaghChal/Baghchal online, BoardGameArena, chess.com, and Baghchal — the closest existing analog to Pulijoodam)

---

## Closest Analogs Studied

| Platform | Type | Relevance |
|----------|------|-----------|
| Baghchal.net / playbaghchal.com | Tigers-and-goats online | Nearest game-mechanic analog (4T/20G, 5x5 board) |
| onlinesologames.com/tigers-and-goats | HTML5, no-install, browser | Same niche: Tigers-goats, web-only |
| Lichess.org | Free open-source chess web app | Gold standard for free browser strategy game UX |
| BoardGameArena | Abstract strategy multi-game platform | Real-time + async, AI + human play |
| Wordle / NYT Games | Single-URL, no-account casual games | Share-result viral mechanic |

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Playable game in browser, zero install | Every casual game site works this way | LOW | Already the plan — GitHub Pages SPA |
| Correct rules enforcement | Players immediately distrust a game that lets illegal moves through | HIGH | Engine completeness: move gen, capture, win/draw detection |
| Visual feedback on legal moves | Every digital board game highlights valid moves on piece selection | LOW | Highlight valid destination nodes on piece select or hover |
| AI opponent (at least one difficulty) | Solo play is the primary use case for niche games without an active playerbase | HIGH | MCTS + Minimax already planned; even one difficulty is required at launch |
| Win / loss detection with clear result screen | Players must know when the game ends and who won | LOW | Result overlay with outcome (Tiger wins / Goats win) and replay option |
| Undo last move | Standard in all casual strategy game apps; absence feels punishing | LOW | Already in engine via history; expose in UI |
| New game / restart | Trivially expected | LOW | Reset state, return to start |
| Responsive layout (mobile + desktop) | 60%+ of casual web traffic is mobile; a desktop-only game loses half the audience | MEDIUM | SVG viewBox scales naturally; touch targets 44px min already planned |
| Piece placement / movement feedback (animations) | Without animation, moves feel instantaneous and confusing; players lose track of what changed | MEDIUM | CSS transitions on SVG elements; capture animation |
| Offline play (or at least no server dependency) | Casual players bookmark games; network failures must not break solo play | LOW | Pure client-side SPA; add service worker for true offline |
| Game state auto-save | Browser tab close / refresh must not lose a game in progress | LOW | localStorage on every move; already planned |
| Clear turn indicator | Whose turn it is must always be visible | LOW | Header / HUD element |

### Differentiators (Competitive Advantage)

Features that set this product apart from the 3-4 bare-bones existing implementations.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multiple AI difficulty levels (4) | Existing Baghchal apps offer 1-3 levels; 4 levels (Easy / Medium / Hard / Expert) serves both new learners and players who want a serious challenge | HIGH | Easy = random/weak eval, Medium = shallow minimax, Hard = deeper minimax, Expert = full MCTS + deep search |
| Interactive tutorial / onboarding | No existing Tigers-and-goats web game has a real interactive tutorial; new players have no idea how chain-hops work | HIGH | Step-by-step guided first game: explain asymmetry, placement phase vs movement phase, chain-hop rule |
| Move-by-move replay | Baghchal.net has replay; most bare-bones implementations don't | MEDIUM | Step through completed game; pairs with auto-save |
| P2P multiplayer via invite link | No other web-based Tigers-and-goats game has this | HIGH | WebRTC DataChannel; share URL to friend; no account required |
| PWA / installable | "Add to Home Screen" for mobile users; makes the game feel native | LOW | Service worker + web manifest; low effort, high perceived quality |
| Cultural framing / game description | "Pulijoodam" is unknown outside Andhra/Telangana; a brief in-game cultural note builds emotional investment | LOW | About page or first-run modal with game history |
| Tap-tap interaction model (not drag) | On mobile, drag-to-move on a small board is error-prone; tap source then tap destination is more reliable | LOW | Already planned; worth explicitly building and testing this |
| Distinct visual themes | Board aesthetics that reference South Indian material culture (wood grain, kolam patterns) differentiate from generic gray grids | MEDIUM | 2-3 themes: Classic (natural wood), High-contrast (accessibility), Minimal (modern) |
| Sound design (satisfying piece clicks, capture sound) | Adds tactile feel missing from browser games; Wordle-style micro-interactions build habit | LOW | 3-5 sounds: place piece, capture, game-over win, game-over lose, illegal move |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / login | "Save my game history", "see my rating" | Requires backend, auth, privacy policy, GDPR compliance — destroys the zero-infrastructure constraint and delays launch indefinitely | localStorage for local history; no cross-device sync |
| Global leaderboard / ELO ratings | Players want to compare themselves to others | Requires server + persistent database + anti-cheat; entirely incompatible with GitHub Pages | Show local win/loss stats per difficulty level |
| Spectator mode for P2P games | "Watch my friend play" | Significant WebRTC complexity; third party in a two-party P2P session requires relay architecture | Defer to v2; replay file sharing is a simpler substitute |
| Time controls / chess clock | Makes the game competitive and tense | Pulijoodam is a casual cultural game, not an esport; time pressure will frustrate new learners and is misaligned with the target audience | Casual, untimed play only; revisit if competitive scene emerges |
| Hints / move suggestions | "Tell me what to do" | Undermines the learning experience; trivializes the AI difficulty tiers; complex to implement correctly without an oracle | Tutorial mode teaches patterns without giving real-time hints |
| Server-based matchmaking | "Find a random opponent" | Requires always-on infrastructure, violates GitHub Pages static constraint, and assumes an active playerbase that doesn't exist yet | P2P invite link satisfies multiplayer need without infrastructure |
| Tamil rule variant at launch | "I play Tamil rules" | Different board topology, different win condition — effectively a second game engine; doubles test surface | Andhra preset only for v1; Tamil as v2 feature once engine is validated |
| Post-game analysis / blunder detection | "Show me my mistakes" | Requires running full engine evaluation over entire game history; adds significant compute and UI complexity | Out of scope; add in v2 once game has players to analyze |
| Animated tutorial videos / cutscenes | "Make it look like a real app" | Massive asset size; violates < 1MB bundle target; high production cost | Interactive step-through tutorial (text + highlights) achieves same goal |
| Chat during P2P game | "Talk to my friend while playing" | Requires content moderation for public deployment; even in P2P, in-game chat creates liability | Players use their own messaging; game focuses on the board |

---

## Feature Dependencies

```
[Correct Rules Engine]
    └──required by──> [AI Opponent]
    └──required by──> [Legal Move Highlighting]
    └──required by──> [Win/Loss Detection]
    └──required by──> [Move Replay]
    └──required by──> [P2P Multiplayer] (both sides must agree on state)

[Game State / History]
    └──required by──> [Undo]
    └──required by──> [Auto-save / localStorage]
    └──required by──> [Move Replay]

[AI Opponent]
    └──enhances──> [Multiple Difficulty Levels]
    └──required before──> [Tutorial] (tutorial needs a benign AI to play against)

[SVG Board Rendering]
    └──required by──> [Legal Move Highlighting]
    └──required by──> [Animations]
    └──required by──> [Visual Themes]

[PWA / Service Worker]
    └──enhances──> [Offline Play]
    └──enables──> [Add to Home Screen]

[WebRTC P2P]
    └──required by──> [Multiplayer Invite Link]
    └──conflicts with──> [GitHub Pages constraint] (signaling only; game state is P2P)

[Undo]
    └──conflicts with──> [P2P Multiplayer] (undo requires opponent consent in two-player)
```

### Dependency Notes

- **Rules Engine required by everything:** The engine must be complete and correct before any other feature is meaningful. A buggy engine contaminates AI, replay, and multiplayer equally.
- **AI required before Tutorial:** The tutorial needs to be "played against something"; an easy-mode AI serves this purpose. A scripted opponent is an alternative but more maintenance burden.
- **Undo conflicts with P2P:** In hot-seat local play, undo is straightforward. In P2P, undo requires a take-back request/accept protocol. Keep undo simple in v1 (local only); P2P take-back is v2.
- **Service worker enhances but doesn't block:** PWA is a polish layer. The game works without it; the service worker just ensures offline reliability.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate that a playable Pulijoodam exists on the web.

- [x] Rules-correct game engine (board topology, move gen, capture, win/draw)
- [x] SVG board with tap-tap interaction and legal move highlighting
- [x] AI opponent at 4 difficulty levels (Easy through Expert)
- [x] Undo last move
- [x] Clear turn indicator and result screen
- [x] Game auto-save to localStorage (survive refresh)
- [x] Move-by-move replay of completed game
- [x] Responsive layout (mobile + desktop; 44px touch targets)
- [x] Interactive tutorial (guided first game explaining asymmetry + chain-hops)
- [x] Sound on/off toggle (satisfying defaults; off for silent environments)
- [x] PWA manifest + service worker (installable; offline-capable)
- [x] Cultural "About Pulijoodam" page (context for the game)

### Add After Validation (v1.x)

Features to add once core is working and players exist.

- [ ] P2P multiplayer via WebRTC invite link — add when at least one person says "I want to play with a friend"
- [ ] Local hot-seat 2-player mode — lower priority than AI since most users are solo; add when P2P is validated
- [ ] Visual theme selector (2-3 themes) — add after initial player feedback on aesthetics
- [ ] Share result card (emoji grid + outcome text, copyable) — add when players organically ask "how do I share this?"

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Tamil rule variant — second board topology; defer until v1 has players requesting it
- [ ] Post-game analysis / blunder detection — requires significant compute; defer until player base exists
- [ ] Hints / move suggestion during play — complex; undermines learning; revisit with user feedback
- [ ] Spectator mode for P2P games — requires relay architecture; not feasible with zero infrastructure
- [ ] Native Android app (Rust engine port) — future platform; architecture supports this

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Rules-correct engine | HIGH | HIGH | P1 |
| SVG board + tap-tap interaction | HIGH | MEDIUM | P1 |
| AI opponent (4 levels) | HIGH | HIGH | P1 |
| Win/loss result screen | HIGH | LOW | P1 |
| Undo | HIGH | LOW | P1 |
| Auto-save / localStorage | HIGH | LOW | P1 |
| Legal move highlighting | HIGH | LOW | P1 |
| Responsive layout | HIGH | MEDIUM | P1 |
| Interactive tutorial | HIGH | MEDIUM | P1 |
| Move replay | MEDIUM | MEDIUM | P1 |
| PWA / offline | MEDIUM | LOW | P1 |
| Sound effects | MEDIUM | LOW | P1 |
| Cultural "About" page | MEDIUM | LOW | P1 |
| P2P multiplayer | HIGH | HIGH | P2 |
| Local hot-seat mode | MEDIUM | LOW | P2 |
| Visual theme selector | LOW | MEDIUM | P2 |
| Share result card | MEDIUM | LOW | P2 |
| Tamil rule variant | MEDIUM | HIGH | P3 |
| Post-game analysis | MEDIUM | HIGH | P3 |
| Hints system | LOW | HIGH | P3 |
| Spectator mode | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Baghchal (baghchal.net) | onlinesologames tigers-and-goats | Our Approach |
|---------|-------------------------|----------------------------------|--------------|
| No-install browser play | Yes | Yes | Yes |
| AI opponent | Yes (1-3 levels) | Yes (1 level) | 4 levels, stronger AI |
| Interactive tutorial | No | No | Yes — key differentiator |
| Move replay | Yes | No | Yes |
| P2P multiplayer | Yes (account-based) | No | Yes, no account, invite link |
| PWA / installable | No | No | Yes |
| Legal move highlighting | Yes | Partial | Yes |
| Cultural context | Minimal | None | Yes — About page |
| Sound | Yes | No | Yes (on/off toggle) |
| Offline support | No | No | Yes via service worker |
| Mobile responsive | Partial | Partial | Yes — mobile-first |
| Undo | Yes | No | Yes |
| Accounts required | Yes (for save/MP) | No | No — never |

**Observation:** The existing web implementations of this game class are bare-bones. None has a real tutorial. None is installable. None uses modern P2P. The quality bar is low — which means Pulijoodam has a clear opportunity to be definitively the best web implementation simply by shipping the features already planned.

---

## Sources

- [Baghchal.net](https://www.baghchal.net/) — feature inventory of closest analog game (MEDIUM confidence, direct observation)
- [Play Tigers and Goats — onlinesologames.com](https://www.onlinesologames.com/tigers-and-goats) — feature inventory, HTML5 bare-bones implementation
- [Lichess features page](https://lichess.org/features) — gold standard for free browser strategy game feature expectations (HIGH confidence)
- [BoardGameArena](https://en.boardgamearena.com/) — abstract strategy platform, async + real-time patterns
- [GitHub: sumn2u/baghchal](https://github.com/sumn2u/baghchal) — open source Baghchal implementation with AI
- [WebRTC DataChannel multiplayer game — webrtchacks.com](https://webrtchacks.com/datachannel-multiplayer-game/) — P2P game architecture patterns
- [GitHub: rameshvarun/netplayjs](https://github.com/rameshvarun/netplayjs) — P2P browser game library (WebRTC)
- [Accessibility Terms for Game Developers — Filament Games](https://www.filamentgames.com/blog/accessibility-terms-for-game-developers-a-wcag-2-1-aa-glossard/) — WCAG game accessibility
- [PWA games overview 2025 — simicart.com](https://simicart.com/blog/pwa-games/) — PWA game patterns and installability
- BoardGameArena most played 2025 — abstract strategy player behavior

---
*Feature research for: Pulijoodam web-based board game*
*Researched: 2026-03-04*
