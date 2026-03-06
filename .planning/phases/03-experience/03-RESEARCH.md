# Phase 3: Experience - Research

**Researched:** 2026-03-07
**Domain:** Animations, Sound Synthesis, Theming, Tutorial, Game History/Replay
**Confidence:** HIGH

## Summary

Phase 3 transforms a functional game into a polished experience across four domains: (1) SVG piece animations driven by the existing GameEvent queue, (2) procedurally synthesized sound effects via Web Audio API with zero audio files, (3) two visual themes via CSS custom properties, and (4) an interactive tutorial with game history/replay backed by localStorage.

The existing codebase is well-prepared for this phase. Piece components (GoatPiece, TigerPiece) already use SVG `transform` attributes for positioning, making CSS transitions straightforward. The `MoveResult.events: GameEvent[]` from `applyMove` provides a natural animation queue. GameState is JSON-serializable by design, ready for localStorage persistence. The key technical challenge is coordinating animation sequencing (especially chain-hops) with game state updates -- the UI must wait for animations to complete before accepting the next move.

**Primary recommendation:** Use pure CSS transitions on SVG transforms for piece movement (no animation library needed), Web Audio API with OscillatorNode/GainNode/noise buffers for all sounds, CSS custom properties on `:root` / `[data-theme]` for theming, and a custom `useAnimationQueue` hook to sequence GameEvents into visual+audio effects.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Animation feel:** Smooth & weighted, physical board game feel
- **Movement:** ~350ms ease-in-out slide transitions on SVG transforms
- **Capture:** Arc jump path -- tiger lifts in curved arc over goat, lands with slight settle (~400ms). Captured goat fades out (~200ms)
- **Chain-hop:** Deliberate sequential hops, each jump plays fully before next begins, brief pause between hops
- **Game over:** Winning pieces pulse/glow (500ms), board dims, then overlay fades in with result. No confetti.
- **Animation sequencing:** Driven by existing GameEvent[] from applyMove
- **Sound design:** Two sound packs linked to visual themes (Traditional = stone/traditional, Modern = wooden/tactile)
- **Sound synthesis:** Web Audio API -- zero audio files, zero bundle size impact
- **Chain-hop escalation:** Each successive capture at higher pitch/louder
- **Sound events:** place, slide, capture, win/loss, illegal move
- **Sound toggle:** On/off, independent of theme, persisted in localStorage
- **Themes:** Traditional (temple stone floor, default) and Modern (minimal dark)
- **Theme implementation:** CSS custom properties for switching
- **Settings UI:** Gear icon top-right, compact dropdown with theme toggle + sound toggle
- **Tutorial flow:** Guided with freedom -- text explains, highlights suggested moves, user can tap anywhere valid
- **Tutorial tone:** Warm & cultural, references South Indian heritage
- **Three lessons:** (1) Board & Placement, (2) Movement & Captures, (3) Winning & Losing
- **First-launch modal:** "New to Pulijoodam?" with Start Tutorial / Skip, shown once, remembered in localStorage
- **Tutorial accessible:** Always available from settings/menu after first dismissal

### Claude's Discretion
- Goat placement animation style (drop-in vs. scale-in)
- Exact CSS patterns/gradients for stone and wood textures
- Tutorial text copywriting (within warm & cultural tone)
- Settings dropdown exact styling and positioning
- History list layout and replay control styling
- Game event queue implementation details
- How to handle tutorial when user deviates significantly from expected path

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| POL-01 | Piece slide animations via CSS transitions on SVG transforms | CSS `transition` on `transform` attribute of piece components; ~350ms ease-in-out |
| POL-02 | Capture animation (tiger jump arc, goat removal effect) | Keyframe animation for arc path on tiger, opacity fade on captured goat |
| POL-03 | Chain-hop sequential animation plays captures in order | Animation queue hook processes GOAT_CAPTURED events sequentially with pause between |
| POL-04 | Placement drop-in animation for goats | CSS keyframe or transition for scale/translate entrance effect |
| POL-05 | Sound effects for place, slide, capture, win/loss, illegal move | Web Audio API OscillatorNode + GainNode synthesis, no audio files |
| POL-06 | Sound toggle in settings (on/off) | localStorage-persisted boolean, checked before each sound play |
| POL-07 | Two visual themes: Traditional and Modern | CSS custom properties on `[data-theme]` selector, swap all colors |
| POL-08 | Theme toggle in settings | Settings dropdown with theme switch, updates `data-theme` attribute |
| POL-09 | Settings persistence via localStorage | JSON object in localStorage for theme + sound preferences |
| TUT-01 | Lesson 1: Board & Placement | Real engine with standard initial state, guided goat placement steps |
| TUT-02 | Lesson 2: Movement & Captures | Pre-set board state via createGame + manual board setup, demonstrate jumps |
| TUT-03 | Lesson 3: Winning & Losing | Pre-set near-endgame state, trap tigers, show both win conditions |
| TUT-04 | Forced move sequences with highlighted targets | Tutorial step system highlights target nodes, validates against expected moves |
| TUT-05 | Brief text overlays (2-3 sentences per step) | Positioned tooltip/overlay component near relevant board area |
| TUT-06 | Skip option for experienced players | Skip button on every tutorial step + first-launch modal |
| TUT-07 | First-launch prompt | Modal on first app open, localStorage flag to show only once |
| HIST-01 | Auto-save game to localStorage on every move | useEffect on gameState change writes to localStorage |
| HIST-02 | Resume interrupted games on app reopen | Lazy initialization of game state from localStorage on mount |
| HIST-03 | Game history screen with date, role, opponent, result, duration | localStorage array of completed game records |
| HIST-04 | Replay mode with step forward/backward controls | Read-only game viewer stepping through moveHistory array |
| HIST-05 | Timeline scrubber for replay navigation | Range input mapped to move index |
| HIST-06 | Auto-play replay at 1 move/second with pause | setInterval stepping through moves with play/pause toggle |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | Already in project, all components are React |
| TypeScript | 5.7+ | Type safety | Already in project |
| Vite | 6.x | Build tool | Already in project |
| Tailwind CSS | 4.x | Utility CSS for shell UI | Already in project |
| Web Audio API | Browser native | Sound synthesis | Zero dependencies, zero bundle size, locked decision |
| CSS Custom Properties | Browser native | Theme switching | Zero dependencies, locked decision |
| localStorage | Browser native | Settings + game persistence | Zero dependencies, locked decision |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 3.x | Test framework | Already in project, all new tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS transitions | Motion (framer-motion) | Adds ~30KB to bundle; CSS transitions handle our use case (position changes on SVG transforms) without a library. Only consider if needing spring physics or gesture animations, which we do not. |
| Web Audio API | Howler.js | Howler requires audio files; user locked Web Audio API synthesis with zero files |
| Custom tutorial | Reactour/Walktour | These libraries are designed for product tours of DOM elements, not guided gameplay on SVG canvas. Custom implementation gives full control over board interaction during tutorial. |

**Installation:**
```bash
# No new packages needed -- all capabilities are browser-native or already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  audio/
    AudioEngine.ts       # Web Audio API synthesis -- all sound generation
    sounds.ts            # Individual sound recipes (place, slide, capture, etc.)
  theme/
    theme.ts             # Theme definitions, CSS custom property maps
    ThemeContext.tsx      # React context for theme + sound settings
  tutorial/
    TutorialContext.tsx   # Tutorial state management
    TutorialOverlay.tsx   # Step overlay UI component
    lessons.ts           # Lesson definitions (steps, expected moves, text)
  history/
    storage.ts           # localStorage read/write for games
    useGameHistory.ts    # Hook for history list + auto-save
    ReplayScreen.tsx     # Replay viewer component
    HistoryScreen.tsx    # Game history list component
  hooks/
    useAnimationQueue.ts # GameEvent[] -> sequential animation orchestration
    useSettings.ts       # Theme + sound preferences with localStorage
  components/
    Board/
      Board.tsx          # (existing -- add animation state props)
      GoatPiece.tsx      # (existing -- add CSS transition + animation classes)
      TigerPiece.tsx     # (existing -- add CSS transition + animation classes)
    GameScreen/
      GameScreen.tsx     # (existing -- integrate animation queue + sounds)
    Settings/
      SettingsDropdown.tsx  # Gear icon + dropdown
```

### Pattern 1: Animation Queue (GameEvent -> Visual Sequence)
**What:** A hook that takes `GameEvent[]` from `applyMove` and orchestrates animations sequentially, blocking user input until the queue drains.
**When to use:** Every move that produces events (every `applyMove` call).
**Example:**
```typescript
// useAnimationQueue.ts
interface AnimationState {
  isAnimating: boolean;
  currentEvent: GameEvent | null;
  piecePositions: Map<number, { x: number; y: number }>; // override positions during animation
}

function useAnimationQueue(events: GameEvent[], onComplete: () => void) {
  const [state, setState] = useState<AnimationState>({
    isAnimating: false, currentEvent: null, piecePositions: new Map()
  });

  useEffect(() => {
    if (events.length === 0) return;
    // Process events sequentially with timeouts matching animation durations
    let cancelled = false;
    const processQueue = async () => {
      setState(s => ({ ...s, isAnimating: true }));
      for (const event of events) {
        if (cancelled) break;
        setState(s => ({ ...s, currentEvent: event }));
        // Wait for CSS transition to complete
        await new Promise(r => setTimeout(r, getEventDuration(event)));
      }
      if (!cancelled) {
        setState({ isAnimating: false, currentEvent: null, piecePositions: new Map() });
        onComplete();
      }
    };
    processQueue();
    return () => { cancelled = true; };
  }, [events]);

  return state;
}
```

### Pattern 2: CSS Transitions on SVG Transform
**What:** Animate piece positions by adding `transition: transform 350ms ease-in-out` to piece SVG elements and changing their `transform` attribute via React props.
**When to use:** All piece movements (slide, placement, capture landing).
**Example:**
```typescript
// GoatPiece.tsx with animation support
export function GoatPiece({ x, y, isSelected, animationClass }: GoatPieceProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={9}
      fill="var(--goat-fill)"
      stroke={isSelected ? 'var(--select-stroke)' : 'var(--goat-stroke)'}
      strokeWidth={2}
      className={animationClass}
      style={{
        transition: 'cx 350ms ease-in-out, cy 350ms ease-in-out, opacity 200ms ease-out',
        pointerEvents: 'none',
      }}
      data-testid="goat-piece"
    />
  );
}
```
**Important:** Use `cx`/`cy` attributes instead of `transform` for smoother CSS transitions on SVG. The `cx` and `cy` properties are animatable via CSS transitions in modern browsers. Alternatively, use `transform: translate()` with `style.transition`.

### Pattern 3: CSS Custom Properties for Theming
**What:** Define all colors as CSS custom properties, swap them by changing `data-theme` attribute on document root.
**When to use:** All color references in SVG and shell UI.
**Example:**
```css
/* In index.css */
:root,
[data-theme="traditional"] {
  --board-bg: #d4a76a;
  --board-line: #8b6f47;
  --tiger-fill: #c8a84e;
  --tiger-stroke: #8b7635;
  --goat-fill: #6b6b6b;
  --goat-stroke: #404040;
  --node-fill: #374151;
  --bg-primary: #f5e6d3;
  --text-primary: #2d1b0e;
  --accent: #b87333;
}

[data-theme="modern"] {
  --board-bg: #1a1a2e;
  --board-line: #4a4a5a;
  --tiger-fill: #f59e0b;
  --tiger-stroke: #d97706;
  --goat-fill: #06b6d4;
  --goat-stroke: #0891b2;
  --node-fill: #2a2a3e;
  --bg-primary: #0f0f1a;
  --text-primary: #e0e0e0;
  --accent: #7c3aed;
}
```

### Pattern 4: Web Audio API Sound Synthesis
**What:** Singleton AudioEngine class that creates an AudioContext (lazy, on first user gesture), with methods for each sound type using OscillatorNode + GainNode chains.
**When to use:** Every game event that requires sound feedback.
**Example:**
```typescript
// AudioEngine.ts
class AudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    // Resume if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playPlaceSound(theme: 'traditional' | 'modern') {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Stone tap (traditional) or wood clack (modern)
    osc.type = theme === 'traditional' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(theme === 'traditional' ? 800 : 600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCaptureSound(theme: 'traditional' | 'modern', chainIndex = 0) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    // Escalating pitch for chain-hops
    const pitchMultiplier = 1 + (chainIndex * 0.15);
    const volumeBoost = 1 + (chainIndex * 0.1);
    // ... similar pattern with higher base frequency and noise burst
  }
}

export const audioEngine = new AudioEngine();
```

### Pattern 5: Tutorial with Real Engine
**What:** Tutorial uses the real game engine with scripted initial board states. Each lesson is an array of steps, each step specifying highlighted nodes, expected moves (flexible), and overlay text.
**When to use:** Tutorial mode only.
**Example:**
```typescript
// lessons.ts
interface TutorialStep {
  text: string;
  highlightNodes: number[];      // nodes to visually emphasize
  expectedMoves?: number[];      // valid target nodes (flexible -- any is accepted)
  autoMove?: Move;               // auto-play this move (for opponent turns)
  position: 'top' | 'bottom' | 'left' | 'right'; // overlay text position
}

interface Lesson {
  title: string;
  culturalIntro: string;
  initialState: Partial<GameState>; // override for createGame
  steps: TutorialStep[];
}
```

### Anti-Patterns to Avoid
- **Animating with requestAnimationFrame for piece positions:** CSS transitions handle interpolation more efficiently and with less code. Only use rAF for complex custom paths (like the capture arc).
- **Storing animation state in game reducer:** Animation is a view concern. Keep it in a separate hook/context that reads GameEvents but does not modify GameState.
- **Creating AudioContext on page load:** Browser autoplay policy will suspend it. Create lazily on first user interaction.
- **Blocking game state updates during animation:** Apply the move to state immediately, then animate the visual transition from old position to new position. The canonical state is always up-to-date; animation is cosmetic.
- **Using transform attribute for piece positioning and CSS transition together:** SVG `transform` attribute transitions can be inconsistent across browsers. Prefer `cx`/`cy` for circles or use inline `style={{ transform }}` for reliable CSS transition behavior.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sound synthesis | MP3/WAV audio files | Web Audio API OscillatorNode + GainNode | Locked decision: zero files, zero bundle impact |
| Complex animation sequencing | Custom rAF loop manager | CSS transitions + Promise-based queue with setTimeout | CSS handles interpolation; JS just orchestrates timing |
| Theme color management | Manual className toggling | CSS custom properties + data-theme attribute | One attribute change swaps all colors; no re-render needed |
| Game state persistence | IndexedDB wrapper | localStorage with JSON.stringify | GameState is already JSON-serializable; localStorage is simpler and sufficient for single-game saves |
| Tutorial product tour | Reactour / Walktour library | Custom overlay component | Third-party tour libraries target DOM elements, not SVG game boards; custom gives full control |

**Key insight:** This phase is about integration and polish, not introducing new infrastructure. Every feature builds on existing patterns (GameEvent queue, SVG components, JSON-serializable state) using browser-native APIs.

## Common Pitfalls

### Pitfall 1: AudioContext Autoplay Policy
**What goes wrong:** Sound does not play on first interaction because browser suspends AudioContext created before a user gesture.
**Why it happens:** Modern browsers require a user gesture (click/tap) before allowing audio playback.
**How to avoid:** Create AudioContext lazily on first call to any sound method, and always call `ctx.resume()` before playing. The game's first tap/click on the board counts as a user gesture.
**Warning signs:** Sound works in development but not in production; sound works on second click but not first.

### Pitfall 2: SVG Transform Transition Inconsistency
**What goes wrong:** CSS `transition` on SVG `transform` attribute does not animate, or animates differently across browsers.
**Why it happens:** SVG `transform` attribute is technically a presentation attribute, and CSS transition support varies. Chrome handles it well; Safari and Firefox can be inconsistent.
**How to avoid:** Two reliable approaches: (a) Use `cx`/`cy` attributes for circles and `x`/`y` for other elements -- these are CSS-animatable in modern browsers. (b) Use inline `style={{ transform: 'translate(...)' }}` which always works with CSS transitions. Avoid mixing SVG `transform` attribute with CSS `transition`.
**Warning signs:** Animation works in Chrome but jerks or snaps in Safari/Firefox.

### Pitfall 3: Animation-State Desync
**What goes wrong:** User taps during animation, causing the game state and visual state to diverge -- pieces appear in wrong positions or duplicate.
**Why it happens:** Game state updates instantly on move, but visual animation takes 350-400ms. If user can interact during that window, another state change fires before animation completes.
**How to avoid:** Set `isAnimating: true` flag in animation queue hook. Pass this to Board component to disable `onNodeTap` during animation. The existing `isAIThinking` pattern in useAIGame shows exactly how to gate input.
**Warning signs:** Rapid tapping causes pieces to teleport or stack.

### Pitfall 4: Chain-Hop Animation Timing
**What goes wrong:** All chain-hop captures animate simultaneously instead of sequentially, or the animation completes but the game state has already moved past.
**Why it happens:** GameEvent[] for a chain-hop contains multiple GOAT_CAPTURED events. If processed in parallel, they all fire at once.
**How to avoid:** The animation queue must process events one at a time with `await delay(eventDuration)` between them. Each hop: animate tiger to landing position (400ms) -> animate goat fade (200ms) -> pause (150ms) -> next hop.
**Warning signs:** Tiger appears to teleport to final position; all captured goats disappear simultaneously.

### Pitfall 5: localStorage Quota and Error Handling
**What goes wrong:** `localStorage.setItem` throws `QuotaExceededError` when storage is full, or fails silently in private browsing mode.
**Why it happens:** localStorage has a ~5-10MB limit; private browsing in some browsers disables or limits it.
**How to avoid:** Wrap all localStorage operations in try/catch. For game history, limit stored games (e.g., most recent 50). For auto-save, only store the current game, not every intermediate state -- store the move history array and replay to reconstruct any state.
**Warning signs:** App crashes on save; settings not persisting in Safari private mode.

### Pitfall 6: Tutorial Engine State Manipulation
**What goes wrong:** Tutorial tries to set up a custom board state but the engine rejects it because state invariants are violated.
**Why it happens:** `createGame` produces a valid initial state; tutorials need mid-game states for lessons 2 and 3.
**How to avoid:** Build tutorial states by replaying a sequence of valid moves from initial state, not by directly constructing GameState objects. Alternatively, create a `createGameFromState` utility that bypasses validation for tutorial-only use, clearly marked as such.
**Warning signs:** Lesson 2/3 crash on startup; engine rejects tutorial moves as illegal.

### Pitfall 7: Theme Flicker on Load
**What goes wrong:** Page loads with default theme colors, then flickers to saved theme preference after React hydrates.
**Why it happens:** CSS custom properties default to :root values; localStorage read happens in useEffect (after first paint).
**How to avoid:** Read localStorage theme preference in a `<script>` tag in index.html (before React mounts) and set `data-theme` attribute on `<html>` element immediately. This ensures correct theme on first paint.
**Warning signs:** Brief flash of wrong theme colors on page load.

## Code Examples

### Web Audio API: Percussive Sound Synthesis
```typescript
// Source: MDN Web Audio API docs + synthesis patterns from dev.opera.com
// Verified technique: OscillatorNode + GainNode with exponentialRamp for percussion

function playStonePlace(ctx: AudioContext) {
  const now = ctx.currentTime;

  // Tone: short sine burst simulating stone impact
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(150, now + 0.06);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);

  // Noise burst for texture (stone scrape)
  const bufferSize = ctx.sampleRate * 0.05; // 50ms of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  // Bandpass filter for stone character
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 1.5;

  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.05);
}

function playBellChime(ctx: AudioContext) {
  const now = ctx.currentTime;
  // FM synthesis for metallic bell tone
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const outGain = ctx.createGain();

  carrier.type = 'sine';
  carrier.frequency.value = 880;
  modulator.type = 'sine';
  modulator.frequency.value = 880 * 1.4; // inharmonic ratio for bell
  modGain.gain.value = 300;

  outGain.gain.setValueAtTime(0.2, now);
  outGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  modulator.connect(modGain).connect(carrier.frequency);
  carrier.connect(outGain).connect(ctx.destination);
  modulator.start(now);
  carrier.start(now);
  modulator.stop(now + 0.8);
  carrier.stop(now + 0.8);
}
```

### CSS Theme Custom Properties
```css
/* Source: MDN CSS Custom Properties + established React theming patterns */
:root,
[data-theme="traditional"] {
  /* Board */
  --board-bg: #c4a882;
  --board-line: #7a6548;
  --board-line-width: 2.5;
  --node-fill: #5c4a32;
  --node-selected: #f59e0b;
  --legal-move-stroke: #22d3ee;

  /* Pieces */
  --tiger-fill: #c8a84e;
  --tiger-stroke: #8b7635;
  --goat-fill: #6b6b6b;
  --goat-stroke: #4a4a4a;

  /* Shell */
  --bg-primary: #f5e6d3;
  --bg-secondary: #e8d5bf;
  --text-primary: #2d1b0e;
  --text-secondary: #5c4a32;
  --accent: #b87333;
  --accent-hover: #a06028;
}

[data-theme="modern"] {
  --board-bg: #1a1a2e;
  --board-line: #3a3a4e;
  --board-line-width: 1.5;
  --node-fill: #2a2a3e;
  --node-selected: #f59e0b;
  --legal-move-stroke: #7c3aed;

  --tiger-fill: #f59e0b;
  --tiger-stroke: #d97706;
  --goat-fill: #06b6d4;
  --goat-stroke: #0891b2;

  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
}
```

### Animation Queue Hook Pattern
```typescript
// Source: Custom pattern derived from existing useAIGame isAIThinking pattern

interface AnimationQueueState {
  isAnimating: boolean;
  animatingPiece: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
  fadingGoat: number | null; // node ID of goat being captured
}

function useAnimationQueue(
  lastEvents: GameEvent[],
  soundEnabled: boolean,
  theme: 'traditional' | 'modern'
) {
  const [animState, setAnimState] = useState<AnimationQueueState>({
    isAnimating: false,
    animatingPiece: null,
    fadingGoat: null,
  });

  const eventsRef = useRef<GameEvent[]>([]);

  useEffect(() => {
    // Skip if same events reference (no new move)
    if (lastEvents === eventsRef.current || lastEvents.length === 0) return;
    eventsRef.current = lastEvents;

    let cancelled = false;
    const run = async () => {
      setAnimState(s => ({ ...s, isAnimating: true }));

      for (const event of lastEvents) {
        if (cancelled) break;

        switch (event.type) {
          case 'PIECE_MOVED':
            // Set target position; CSS transition handles interpolation
            setAnimState(s => ({ ...s, animatingPiece: { /* positions */ } }));
            if (soundEnabled) audioEngine.playSlide(theme);
            await delay(350);
            break;

          case 'GOAT_CAPTURED':
            // Tiger arc animation
            if (soundEnabled) audioEngine.playCapture(theme);
            await delay(400);
            // Goat fade
            setAnimState(s => ({ ...s, fadingGoat: event.over }));
            await delay(200);
            break;

          case 'GOAT_PLACED':
            if (soundEnabled) audioEngine.playPlace(theme);
            await delay(250);
            break;

          case 'GAME_OVER':
            if (soundEnabled) audioEngine.playGameOver(theme);
            // Winning piece glow handled by CSS class
            await delay(500);
            break;
        }
      }

      if (!cancelled) {
        setAnimState({ isAnimating: false, animatingPiece: null, fadingGoat: null });
      }
    };

    run();
    return () => { cancelled = true; };
  }, [lastEvents, soundEnabled, theme]);

  return animState;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### localStorage Game Persistence
```typescript
// Source: React localStorage persistence patterns (Josh Comeau, MDN)

const CURRENT_GAME_KEY = 'pulijoodam_current_game';
const GAME_HISTORY_KEY = 'pulijoodam_history';
const SETTINGS_KEY = 'pulijoodam_settings';
const MAX_HISTORY_GAMES = 50;

interface SavedGame {
  id: string;
  startedAt: string;
  lastPlayedAt: string;
  humanRole: Role;
  opponent: 'ai' | 'local';
  difficulty?: AIDifficulty;
  moveHistory: Move[];
  result?: GameStatus;
}

interface Settings {
  theme: 'traditional' | 'modern';
  soundEnabled: boolean;
}

function saveCurrentGame(game: SavedGame): void {
  try {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(game));
  } catch {
    // QuotaExceededError or private browsing -- fail silently
  }
}

function loadCurrentGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(CURRENT_GAME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { theme: 'traditional', soundEnabled: true };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Howler.js for game audio | Web Audio API direct synthesis | N/A (decision) | Zero audio files, zero bundle impact, full synthesis control |
| Class-based CSS theming | CSS custom properties + data-attribute | ~2020+ | Single attribute change swaps all colors; no JS re-renders for color changes |
| SVG SMIL animation | CSS transitions + keyframes on SVG | ~2018+ | SMIL deprecated in Chrome (then un-deprecated); CSS approach is standard |
| framer-motion for SVG | Pure CSS transitions | N/A (decision) | No library dependency; CSS handles position transitions adequately |
| Component-level theme props | CSS custom properties cascade | ~2020+ | Colors defined once in CSS, referenced everywhere via var() |

**Deprecated/outdated:**
- SVG SMIL `<animate>` elements: Still supported but CSS transitions are the recommended approach for simple property animations
- `webkitAudioContext`: Removed in modern browsers; use standard `AudioContext`

## Open Questions

1. **Capture Arc Path Animation**
   - What we know: Tiger should follow a curved arc over the captured goat during capture. CSS transitions only interpolate linearly between start/end positions.
   - What's unclear: Whether to use CSS `@keyframes` with intermediate waypoints, or a brief `requestAnimationFrame` loop for the arc, or an SVG `<animateMotion>` path.
   - Recommendation: Use CSS `@keyframes` animation with a 3-point path (start -> apex above midpoint -> landing). Define as a CSS animation class applied temporarily. This avoids rAF complexity while producing a smooth arc. The keyframes approach: `0% { transform: translate(startX, startY) } 50% { transform: translate(midX, midY - arcHeight) } 100% { transform: translate(endX, endY) }`.

2. **Goat Placement Animation Style**
   - What we know: Claude's discretion -- drop-in or scale-in.
   - Recommendation: **Scale-in** (0 -> 1 over 200ms with ease-out). A drop-in from above would conflict with the SVG viewBox coordinate system and look odd on a top-down board. Scale-in feels like the piece materializes on the board, matching the "placing a stone on a board" mental model.

3. **Tutorial Deviation Handling**
   - What we know: Tutorial is "guided with freedom" -- user can tap anywhere valid, with gentle encouragement text.
   - What's unclear: How far to let users deviate before course-correcting.
   - Recommendation: Define each step with a set of "ideal" target nodes and a broader set of "acceptable" nodes. If user picks acceptable but not ideal, show encouragement ("That works too!"). If user picks valid but unexpected, show the step text again with the suggestion. Never block a legal move -- the real engine validates everything.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | vite.config.ts (test section) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| POL-01 | Piece slide uses CSS transition property | unit | `npx vitest run src/components/Board/GoatPiece.test.tsx -t "transition"` | No -- Wave 0 |
| POL-02 | Capture animation applies arc class | unit | `npx vitest run src/components/Board/TigerPiece.test.tsx -t "capture"` | No -- Wave 0 |
| POL-03 | Chain-hop events processed sequentially | unit | `npx vitest run src/hooks/useAnimationQueue.test.ts` | No -- Wave 0 |
| POL-04 | Goat placement applies entrance animation | unit | `npx vitest run src/components/Board/GoatPiece.test.tsx -t "placement"` | No -- Wave 0 |
| POL-05 | AudioEngine produces sound for each event type | unit | `npx vitest run src/audio/AudioEngine.test.ts` | No -- Wave 0 |
| POL-06 | Sound toggle disables/enables audio | unit | `npx vitest run src/hooks/useSettings.test.ts -t "sound"` | No -- Wave 0 |
| POL-07 | Theme CSS variables change with data-theme | unit | `npx vitest run src/theme/theme.test.ts` | No -- Wave 0 |
| POL-08 | Theme toggle updates document attribute | unit | `npx vitest run src/hooks/useSettings.test.ts -t "theme"` | No -- Wave 0 |
| POL-09 | Settings persist to and load from localStorage | unit | `npx vitest run src/hooks/useSettings.test.ts -t "persist"` | No -- Wave 0 |
| TUT-01 | Lesson 1 guided placement steps complete | integration | `npx vitest run src/tutorial/Tutorial.test.ts -t "lesson 1"` | No -- Wave 0 |
| TUT-02 | Lesson 2 pre-set board for captures | integration | `npx vitest run src/tutorial/Tutorial.test.ts -t "lesson 2"` | No -- Wave 0 |
| TUT-03 | Lesson 3 win conditions shown | integration | `npx vitest run src/tutorial/Tutorial.test.ts -t "lesson 3"` | No -- Wave 0 |
| TUT-04 | Highlighted targets match step definition | unit | `npx vitest run src/tutorial/TutorialOverlay.test.tsx -t "highlight"` | No -- Wave 0 |
| TUT-05 | Text overlays render near board area | unit | `npx vitest run src/tutorial/TutorialOverlay.test.tsx -t "overlay"` | No -- Wave 0 |
| TUT-06 | Skip button exits tutorial | unit | `npx vitest run src/tutorial/TutorialOverlay.test.tsx -t "skip"` | No -- Wave 0 |
| TUT-07 | First-launch modal shows once | unit | `npx vitest run src/tutorial/FirstLaunchModal.test.tsx` | No -- Wave 0 |
| HIST-01 | Auto-save writes to localStorage on move | unit | `npx vitest run src/history/storage.test.ts -t "auto-save"` | No -- Wave 0 |
| HIST-02 | Resume loads saved game on mount | unit | `npx vitest run src/history/storage.test.ts -t "resume"` | No -- Wave 0 |
| HIST-03 | History screen lists completed games | unit | `npx vitest run src/history/HistoryScreen.test.tsx` | No -- Wave 0 |
| HIST-04 | Replay step forward/backward works | unit | `npx vitest run src/history/ReplayScreen.test.tsx -t "step"` | No -- Wave 0 |
| HIST-05 | Timeline scrubber navigates to move index | unit | `npx vitest run src/history/ReplayScreen.test.tsx -t "scrubber"` | No -- Wave 0 |
| HIST-06 | Auto-play advances at 1 move/second | unit | `npx vitest run src/history/ReplayScreen.test.tsx -t "auto-play"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/audio/AudioEngine.test.ts` -- covers POL-05 (Web Audio API needs mock AudioContext)
- [ ] `src/hooks/useAnimationQueue.test.ts` -- covers POL-03
- [ ] `src/hooks/useSettings.test.ts` -- covers POL-06, POL-08, POL-09
- [ ] `src/theme/theme.test.ts` -- covers POL-07
- [ ] `src/tutorial/Tutorial.test.ts` -- covers TUT-01, TUT-02, TUT-03
- [ ] `src/tutorial/TutorialOverlay.test.tsx` -- covers TUT-04, TUT-05, TUT-06
- [ ] `src/tutorial/FirstLaunchModal.test.tsx` -- covers TUT-07
- [ ] `src/history/storage.test.ts` -- covers HIST-01, HIST-02
- [ ] `src/history/HistoryScreen.test.tsx` -- covers HIST-03
- [ ] `src/history/ReplayScreen.test.tsx` -- covers HIST-04, HIST-05, HIST-06
- [ ] `src/components/Board/GoatPiece.test.tsx` -- covers POL-01, POL-04 (new file)
- [ ] `src/components/Board/TigerPiece.test.tsx` -- covers POL-02 (new file)
- Note: Web Audio API tests require mocking `AudioContext`, `OscillatorNode`, `GainNode`. Use `vi.fn()` and `vi.spyOn()`. The vitest environment is `node` (not jsdom), so tests focus on function calls and state, not DOM rendering.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/engine/types.ts` (GameEvent types), `src/hooks/useGame.ts` (reducer pattern), `src/components/Board/*.tsx` (SVG rendering pattern)
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) -- AudioContext, OscillatorNode, GainNode API
- [MDN OscillatorNode](https://developer.mozilla.org/en-US/docs/Web/API/OscillatorNode) -- Waveform types, frequency scheduling
- [MDN CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Transitions/Using) -- transition property syntax, SVG compatibility
- [MDN Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) -- Autoplay policy, AudioContext lifecycle

### Secondary (MEDIUM confidence)
- [Chrome Autoplay Policy](https://developer.chrome.com/blog/autoplay) -- AudioContext suspend/resume requirements
- [Dev.Opera Drum Synthesis](https://dev.opera.com/articles/drum-sounds-webaudio/) -- Percussive sound synthesis techniques with Web Audio API
- [Sonoport Synthesising Sounds](https://sonoport.github.io/synthesising-sounds-webaudio.html) -- Noise buffer, FM synthesis for metallic sounds
- [CSS-Tricks Transforms on SVG](https://css-tricks.com/transforms-on-svg-elements/) -- SVG transform vs CSS transform behavior
- [CSS-Tricks Theme Switching](https://css-tricks.com/easy-dark-mode-and-multiple-color-themes-in-react/) -- CSS custom properties + data-attribute pattern
- [Josh Comeau localStorage Persistence](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) -- React state + localStorage patterns

### Tertiary (LOW confidence)
- None -- all findings verified through multiple sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all browser-native APIs, well-documented, no new dependencies
- Architecture: HIGH -- patterns derived directly from existing codebase patterns (reducer, hooks, SVG components)
- Pitfalls: HIGH -- autoplay policy and SVG transform issues are well-documented across MDN and browser vendor blogs
- Sound synthesis: MEDIUM -- specific percussive recipes (stone vs. wood tones) will need tuning by ear; the synthesis technique itself is well-proven
- Tutorial: MEDIUM -- step system design is custom; patterns are clear but exact step definitions require iteration

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable domain -- browser APIs rarely change)
