# Feature Landscape

**Domain:** Digital traditional board game (asymmetric strategy -- Tigers and Goats / Pulijoodam)
**Researched:** 2026-03-03
**Overall confidence:** MEDIUM-HIGH

## Table Stakes

Features users expect from any digital board game in 2026. Missing any of these and users bounce.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Complete rule enforcement** | The engine must be the authority -- invalid moves are impossible. Every chess/Go/checkers app does this. | High | Includes board topology, move validation, captures, chain-hops, phase transitions, win/draw detection. The asymmetric nature (placement phase vs movement phase) adds complexity beyond symmetric games. |
| **AI opponent (multiple difficulties)** | Solo play against AI is the primary mode for niche traditional games. BaghChal apps offer 3 levels, chess apps offer 4+. Without AI, there is no game. | High | 4 levels (Easy/Medium/Hard/Expert) is the right call. Easy should feel beatable on first try. Expert should be genuinely challenging. The hybrid MCTS + Minimax approach in PROJECT.md is well-suited to the asymmetric phases. |
| **Play as either side** | Asymmetric games require this. Every BaghChal/Tigers-and-Goats app lets you choose Tigers or Goats. Omitting this would halve the game. | Low | Simple role selection before game start. |
| **Responsive board rendering** | The board is the entire UI. It must render crisply at any screen size, handle touch accurately, and run at 60fps. Lichess and Chess.com set the bar for smooth board interaction. | High | CustomPainter on Flutter with CanvasKit renderer. The non-standard triangle-over-grid board (23 nodes) is more complex than a square grid. Must handle varied aspect ratios gracefully. |
| **Tap and drag interaction** | Users expect both tap-tap (select source, select destination) and drag-and-drop. Chess.com and Lichess both support both. Omitting either frustrates a segment of users. | Medium | Drag needs visual feedback (piece follows finger, valid targets highlighted). Tap-tap needs clear selection state. |
| **Move validation feedback** | When a user attempts an illegal move, immediate visual/audio feedback is required. Shaking the piece, flashing the invalid target, playing an error sound. | Low | Small but critical for UX. Silent failure is the worst option. |
| **Undo/redo** | Standard in single-player board games. SmartGo has "take back moves." Chess.com forum users actively request save/resume for computer games. For AI games, undo should retract the full turn (player move + AI response). | Medium | Command/Event architecture in PROJECT.md supports this naturally. Undo stack must handle both phases (placement and movement) correctly. |
| **Sound effects with toggle** | Place, slide, capture, win/lose, illegal move. Every polished board game app has audio cues. Equally important: a mute toggle. Many users play in quiet environments. | Low | 6-8 sound effects total. Keep them subtle and satisfying. Wood/stone sounds for the traditional theme, clean clicks for modern. |
| **Game auto-save** | Users close browser tabs, get interrupted, lose connectivity. The game must persist. PlayChess.com auto-saves. Chess.com forum threads are full of frustration about lost games against AI. | Medium | LocalStorage or IndexedDB for web. Save on every move. Resume seamlessly on next visit. The Command/Event log is the natural save format. |
| **Visual move indicators** | Last move highlighting, valid move indicators on piece selection. Universal across chess/Go/checkers apps. Without these, users cannot track what just happened. | Low | Highlight the last move (source and destination). Show valid targets on piece selection. Animate AI moves so the user can follow. |
| **Basic capture animation** | When a tiger captures a goat, the goat should visually disappear with some flourish (not just vanish). Chess apps animate captures; BaghChal apps with "smooth animations" are specifically praised in reviews. | Medium | Bounce/pop with particle burst as specified in PROJECT.md is good. Keep it fast (under 500ms) so it does not slow gameplay. |
| **Game result screen** | Clear win/loss/draw screen with summary (goats captured, moves played). Every board game app has this. | Low | Show outcome, basic stats, option to play again or review. |

## Differentiators

Features that set Pulijoodam apart from the handful of existing Tigers-and-Goats apps, which are universally low-polish, feature-thin, and culturally generic. This is where the gap is widest and the opportunity is greatest.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Two regional rule presets (Andhra + Tamil)** | No existing app offers regional rule variants. This is cultural authenticity that players from different regions will recognize and appreciate. Andhra allows chain-hops with 10-goat threshold; Tamil has no chain-hops with 5-goat threshold. | Medium | Engine must parameterize these rules. UI needs a clear selector with brief explanation of differences. This is a genuine differentiator -- no competitor does this. |
| **Interactive tutorial (3 lessons)** | Existing Tigers-and-Goats apps have no tutorials or just a rules text page. BadukPop and Duolingo Chess show that interactive, guided tutorials massively improve new player onboarding. For a niche game most people have never played, this is critical. | High | Guided board states with constrained moves, explanatory text, and progressive complexity. Lesson 1: board layout and basic moves. Lesson 2: placement strategy. Lesson 3: capturing and blocking. |
| **Game history with replay mode** | Lichess offers full game replay with timeline scrubber. Board Game Arena has step-forward/back navigation. No Tigers-and-Goats app offers replay. This enables learning from past games. | High | Timeline scrubber, step forward/back, jump to any move. The Command/Event log makes this straightforward architecturally but the UI (scrubber, synchronized board state, move list) is the hard part. |
| **Two visual themes (Traditional + Modern)** | Existing apps are visually bland. A lovingly crafted traditional theme (stone, earthy textures, hand-drawn feel) connects to the cultural heritage. A modern theme (clean geometric) appeals to users who prefer minimalism. | Medium | Theme system must be cleanly separated from game logic. Traditional: warm earth tones, textured board, carved-feeling pieces. Modern: flat design, high contrast, geometric shapes. |
| **Cultural context and storytelling** | Research shows digital games are an effective vehicle for cultural heritage preservation. Brief cultural notes about the game's history, regional names, and significance elevate the app beyond a mere game into a cultural artifact. | Low | An "About" section with the game's history, regional names (Telugu, Tamil, Kannada), and cultural significance. Not intrusive -- available for those who want it. Consider brief loading screen facts. |
| **Capture animation polish** | Bounce/pop with particle burst goes beyond what any existing Tigers-and-Goats app offers. BaghChal reviews specifically praise "smooth animations" -- raising the bar further is a clear differentiator. | Medium | The animation budget is small but impactful. Particle effects on capture, subtle board vibration, piece placement thud. These "feel" details are what make users say "this is polished." |
| **Accessibility (comprehensive)** | 44x44pt touch targets, high contrast support, screen reader compatibility, color-blind safe palettes. No existing Tigers-and-Goats app even mentions accessibility. Lichess is held up as a gold standard for accessible chess. | High | Canvas-based rendering (CustomPainter) is inherently inaccessible to screen readers -- requires a parallel semantic layer (hidden DOM with ARIA roles that mirrors the board state). Color-blind safety means pieces must differ by shape/pattern, not just color. This is hard to do well but morally and practically important. |
| **AI move animation with timing** | AI should not move instantly (feels robotic) or too slowly (feels broken). A 300-800ms "thinking" pause followed by an animated move creates the illusion of a real opponent. Chess.com bots do this well. | Low | Simple delay + animation sequencing. Slight randomization of delay feels more natural. |

## Anti-Features

Features to explicitly NOT build for v1. These are deliberate exclusions, not oversights.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Multiplayer (P2P or server-based)** | Adds WebRTC/server complexity, matchmaking, disconnection handling, and cheating concerns. The audience for a niche traditional game is small -- finding opponents online is hard. Solo AI is the core experience. | Defer to v1.5 as planned. Architecture supports it (Command/Event serializes over network). Focus v1 on making AI play feel like sitting across from a real person. |
| **Achievements/badges/gamification** | Dopamine loop mechanics distract from the meditative, strategic nature of the game. They add state management complexity and feel at odds with cultural preservation goals. | Keep the experience focused and respectful. The game itself is the reward. Defer to v2 if user feedback demands it. |
| **ELO rating / player statistics** | Requires persistent identity, statistical tracking, and only matters with multiplayer. For solo AI play, difficulty levels serve the same "how good am I" signal. | Difficulty levels are the rating system for v1. Track basic stats (games played, win rate per difficulty) locally if simple enough, but do not build a ratings engine. |
| **Hints / move suggestions** | Tempting but undermines learning. Players who use hints never develop their own strategic thinking. The tutorial teaches principles; after that, players should experiment. | The tutorial teaches strategy. After that, let players learn through play and replay (game history). Defer move suggestions to v2 as planned. |
| **Post-game analysis / blunder detection** | Requires position evaluation engine and annotation UI. High complexity for marginal value in a game with much less established theory than chess. | Game replay serves the review need for v1. Players can scrub through their games and spot their own mistakes. |
| **Time controls** | Irrelevant for AI play. AI does not need a clock, and artificial time pressure on the player undermines the thoughtful nature of the game. Only relevant for multiplayer. | No timer. Let players think as long as they want. Defer to multiplayer in v1.5. |
| **Localization** | Telugu, Tamil, Kannada UI translations are culturally valuable but add translation maintenance overhead and testing matrix complexity. | English only for v1. Architecture should support localization (externalize all strings). Cultural context section can include regional names in native scripts without full UI translation. |
| **In-app purchases / ads / monetization** | PROJECT.md specifies $0 cost, open source, no ads. This is a cultural preservation project, not a revenue product. Ads would cheapen the experience. | MIT/Apache license, GitHub Pages hosting, completely free. |
| **Puzzle / challenge mode** | Curated puzzles require content creation, a puzzle engine, and difficulty rating. High effort, deferred to v3. | The AI at various difficulties provides the challenge. Replay mode lets users study positions. |
| **Adaptive AI difficulty** | Dynamically adjusting AI strength based on player performance is technically interesting but adds complexity and can feel patronizing ("the AI is going easy on me"). | Fixed difficulty levels are honest and predictable. Players choose their challenge level explicitly. Defer adaptive AI to v2. |

## Feature Dependencies

```
Complete rule enforcement ──> AI opponent (AI needs valid moves to evaluate)
Complete rule enforcement ──> Move validation feedback (needs rule engine)
Complete rule enforcement ──> Undo/redo (needs move history from engine)
Board rendering ──> Tap/drag interaction (needs the canvas to exist)
Board rendering ──> Visual move indicators (rendered on the board)
Board rendering ──> Capture animation (rendered on the board)
Board rendering ──> Theme system (themes are board rendering variants)
Command/Event architecture ──> Undo/redo (replay events backwards)
Command/Event architecture ──> Game auto-save (serialize event log)
Command/Event architecture ──> Game history + replay (replay event log forward)
AI opponent ──> AI move animation/timing (needs AI to generate moves first)
Tutorial system ──> Board rendering (tutorials need constrained board views)
Tutorial system ──> Rule enforcement (tutorials need to validate guided moves)
Accessibility (semantic layer) ──> Board rendering (shadow DOM mirrors canvas state)
Theme system ──> Board rendering (themes change how the board renders)
Regional rule presets ──> Complete rule enforcement (rules are parameterized)
```

**Critical path:** Rule engine --> Board rendering --> AI --> Game loop (this is the minimum playable game). Everything else layers on top.

## MVP Recommendation

**Minimum playable game (Phase 1):**
1. Complete rule enforcement with Andhra rules (default)
2. Board rendering with one theme (Traditional)
3. AI opponent at 2 difficulty levels (Easy + Hard)
4. Play as either side
5. Tap-tap interaction (drag can come slightly later)
6. Sound effects with toggle
7. Move validation feedback
8. Visual move indicators
9. Game result screen

**Core experience (Phase 2):**
1. Undo/redo
2. All 4 AI difficulty levels
3. Drag interaction (alongside tap-tap)
4. Capture animations
5. Game auto-save
6. AI move animation with timing
7. Tamil rule preset

**Differentiators (Phase 3):**
1. Interactive tutorial (3 lessons)
2. Game history with replay mode
3. Modern theme
4. Cultural context / About section
5. Accessibility improvements (touch targets, high contrast, screen reader support)

**Rationale for this ordering:**
- Phase 1 gets a playable game in hands. You cannot test AI quality, board feel, or interaction design without a playable game.
- Phase 2 makes the game feel polished and complete. Undo/redo and auto-save prevent frustration. Full difficulty range serves all skill levels. Tamil rules demonstrate the regional variant system.
- Phase 3 adds the features that make this app special rather than just functional. Tutorials expand the audience. Replay enables learning. Accessibility is morally important and practically expands reach.

**Defer entirely:**
- Multiplayer (v1.5) -- different architecture concerns
- Localization, statistics, hints, analysis, puzzles, achievements (v2+) -- validated features first

## Sources

- [Lichess features](https://lichess.org/features) -- gold standard for free, open-source board game platform features (HIGH confidence)
- [Lichess vs Chess.com comparison](https://www.chess.com/blog/VaultTech/lichess-vs-chess-com-battle-of-the-top-2-chess-websites) -- feature expectations in the chess ecosystem (MEDIUM confidence)
- [What's New with Lichess in 2025](https://thechessadvisor.com/software-review/lichess-in-2025/) -- current feature trajectory (MEDIUM confidence)
- [BaghChal - Tigers and Goats on Google Play](https://play.google.com/store/apps/details?id=com.sudarshanz&hl=en_US) -- closest competitor analysis (MEDIUM confidence)
- [Goats and Tigers - BaghChal on Google Play](https://play.google.com/store/apps/details?id=com.alignit.tigerandgoats&hl=en_US) -- competitor feature set (MEDIUM confidence)
- [Board Game Arena replay features](https://forum.boardgamearena.com/viewtopic.php?t=14249) -- replay UI patterns and user expectations (MEDIUM confidence)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/) -- comprehensive accessibility reference (HIGH confidence)
- [Usability Heuristics Applied to Board Games - NN/g](https://www.nngroup.com/articles/usability-heuristics-board-games/) -- UX principles for board games (HIGH confidence)
- [Color Blind Mode in Games](https://www.numberanalytics.com/blog/ultimate-guide-color-blind-mode-games) -- accessibility pattern for color differentiation (MEDIUM confidence)
- [Designing Games with Cultural Heritage](https://moldstud.com/articles/p-designing-games-with-cultural-heritage-preserving-traditions-through-interactive-experiences) -- cultural preservation through games (MEDIUM confidence)
- [Cultural Impact of Traditional Games in the Digital Era](https://www.decipherzone.com/blog-detail/cultural-impact-of-traditional-games-in-the-digital-era) -- heritage preservation patterns (MEDIUM confidence)
- [BadukPop](https://badukpop.com/) -- interactive tutorial patterns for traditional games (MEDIUM confidence)
- [SmartGo](https://www.smartgo.com/) -- replay and analysis features for board games (MEDIUM confidence)
- [Duolingo Chess](https://blog.duolingo.com/chess-course/) -- onboarding and tutorial design patterns (MEDIUM confidence)
- [Making Games Accessible: Lessons in UI/UX](https://kokkugames.com/making-games-accessible-lessons-in-ui-ux/) -- game accessibility implementation (MEDIUM confidence)
