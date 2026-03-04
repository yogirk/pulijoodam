# Technology Stack

**Project:** Pulijoodam — Web-based strategy board game SPA
**Researched:** 2026-03-04
**Overall confidence:** HIGH (all core choices verified against npm and official docs)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TypeScript | 5.9.x | Language | Strict mode, latest features (import defer, erasable syntax); non-negotiable per project constraints |
| React | 19.2.x | UI framework | Non-negotiable per project constraints; v19.2 is current stable as of Jan 2026 |
| Vite | 7.x | Build tool | Current stable (7.3.1); Vite 7 dropped Node 18, requires Node 20.19+/22.12+; significantly faster than Vite 6 |

**tsconfig baseline — use strict mode plus these additional flags:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```
`noUncheckedIndexedAccess` is especially valuable for the game engine: `board[nodeId]` will force null-checking, preventing off-board access bugs.

---

### Styling

**Recommendation: Tailwind CSS v4 via `@tailwindcss/vite`**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| tailwindcss | 4.2.x | UI styling | Zero-config CSS-first setup; first-party Vite plugin (`@tailwindcss/vite`) — no PostCSS config required; 100x faster incremental builds vs v3 |
| @tailwindcss/vite | 4.x | Vite integration | Replaces PostCSS pipeline; single plugin in `vite.config.ts` |

**Why not CSS Modules:** CSS Modules remain a valid choice, but Tailwind v4's `@tailwindcss/vite` plugin integrates with zero configuration. The game UI has no complex design system that would benefit from the separation CSS Modules provide. For game-specific SVG styling (board lines, pieces), CSS Modules or inline SVG attributes remain appropriate — Tailwind is for the surrounding shell UI only.

**Why not CSS-in-JS (styled-components/emotion):** Runtime overhead conflicts with the `<1MB bundle` constraint. Eliminated.

**Important:** SVG element styling (board lines, node circles, piece paths) should use **SVG presentation attributes and CSS custom properties** — not Tailwind classes. Tailwind applies to the React shell (screens, menus, buttons, layout).

---

### State Management

**Recommendation: React hooks + Context first; Zustand 5 as escape hatch**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Context + useReducer | built-in | Game state | Sufficient for a single-game-at-a-time SPA; no extra dependency |
| zustand | 5.0.x | Global state (if needed) | 20M weekly downloads; v5 drops React <18, uses native `useSyncExternalStore`; add when Context causes re-render problems |

**Decision rule:** Start with `useReducer` + Context for game state (`GameState`, `currentScreen`, `settings`). Promote to Zustand when:
- A state slice is needed in 4+ unrelated component subtrees, OR
- Profiling shows context re-renders causing frame drops during animation

Zustand v5's devtools middleware integrates cleanly with Redux DevTools — useful for debugging AI move sequences.

---

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vitest | 4.x | Unit + integration tests | Current stable (4.0.18); native ESM, Vite-aligned config, 10-20x faster than Jest; engine tests run without a DOM |
| @testing-library/react | 16.3.x | React component tests | v16+ explicitly supports React 19; use for Board/Piece/Screen component tests |
| @playwright/test | 1.58.x | E2E tests | Current stable (1.58.2); test full game flows in real Chromium/Firefox/WebKit |

**Test layer mapping:**
```
src/engine/**     → Vitest only (pure functions, no DOM needed)
src/components/** → Vitest + @testing-library/react
Full game flows   → Playwright (placement → movement → win condition)
AI worker         → Vitest with fake timers (stub postMessage)
```

**Why not Jest:** Vite-based project, native ESM. Vitest shares the Vite config — no separate Babel transform, no `moduleNameMapper` hacks. Jest is eliminated.

---

### Web Workers (AI computation)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Native Worker API (Vite) | built-in | AI thread | Vite natively supports `new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' })`; no plugin needed |
| comlink | 4.4.2 | Worker RPC | Wraps postMessage in an async/await proxy; eliminates message-switch boilerplate; 1.1KB gzipped; from Google Chrome Labs |

**Pattern:**
```typescript
// src/engine/ai/ai.worker.ts
import { expose } from 'comlink';
import { chooseMove } from './index';
expose({ chooseMove });

// src/hooks/useAI.ts
import { wrap } from 'comlink';
const worker = new Worker(new URL('../engine/ai/ai.worker.ts', import.meta.url), { type: 'module' });
const ai = wrap<{ chooseMove: typeof chooseMove }>(worker);
// Usage: const move = await ai.chooseMove(gameState, difficulty);
```

**Why Comlink over raw postMessage:** The message-switch pattern (`if (e.data.type === 'CHOOSE_MOVE')`) creates implicit contracts that break silently with TypeScript. Comlink makes the worker a typed async interface — the TypeScript compiler catches call-site mismatches.

**Note:** `vite-plugin-comlink` exists but adds a build-system dependency for something Vite handles natively. Use Comlink directly with Vite's native worker import.

---

### WebRTC / P2P Multiplayer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| peerjs | 1.5.5 | P2P data channels | Wraps WebRTC in a sane API; 13K+ GitHub stars; last published June 2025; supports data channels sufficient for game state sync |

**Architecture note:** PeerJS requires a signaling server for initial connection handshake (STUN/TURN). PeerJS provides a free hosted PeerServer (`peerjs.com`). For a GitHub Pages deployment with zero-server constraint, this is acceptable — the PeerServer is only used during handshake (seconds), not during gameplay. Game state never passes through it.

**Manual offer/answer fallback:** The TECH-SPEC describes a manual Base64 offer/answer exchange that bypasses the PeerServer entirely. This is a good fallback and should be implemented as the primary UX, using PeerJS's `peer.connect()` with manual SDP strings.

**Why not simple-peer:** `feross/simple-peer` is more minimal but requires more boilerplate for data channel management. PeerJS's higher-level API maps better to the invite-code UX pattern described in the spec. Also, simple-peer's last release was 2021 — maintenance risk.

**Signaling dependency:** Flag for phase-specific research when building multiplayer. The `peer` (PeerServer) npm package was last published 2 years ago — self-hosting the signaling server has maintenance risk. Rely on PeerJS's hosted server for v1.

---

### Animation (SVG)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| motion (framer-motion) | 12.x | SVG piece animations | 30M monthly downloads; hybrid Web Animations API + JS engine; supports `motion.circle`, `motion.g` for SVG elements; timeline control for sequence animations (place → capture → phase change) |

**Why Motion over React Spring:** Motion's `animate` + `variants` system maps well to board game event sequences emitted from the engine (`GameEvent[]`). React Spring's physics model is elegant but adds complexity for deterministic board-state transitions. Motion's `useAnimate()` hook lets you drive animations imperatively from the event list.

**Why not pure CSS transitions:** Sufficient for simple piece slides, but cannot sequence multi-event turns (chain-hop: jump → capture → jump → capture → win). Motion's sequencing API handles this cleanly.

**Bundle note:** `motion` (the new package name, formerly `framer-motion`) is tree-shakeable. Import only `motion`, `animate`, `useAnimate`. Estimated contribution: ~30-40KB gzipped — acceptable within the `<1MB` constraint.

**Install:** `motion` is the current package name. `framer-motion` is a re-export shim kept for backward compatibility.

---

### Sound

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| howler | 2.2.4 | Sound effects | Web Audio API with HTML5 Audio fallback; audio sprites reduce network requests; battle-tested in web games; 7KB gzipped |

**Maintenance caveat (MEDIUM confidence):** Howler 2.2.4 was last published ~March 2024 — no updates in 2 years. The library is stable and complete for the use case (discrete sound effects: piece placement, capture, win/lose stings). Monitor for browser API breakage; if issues emerge, the raw Web Audio API is a viable replacement given the simple sound requirements.

**Why not `use-sound`:** `use-sound` is a thin React wrapper over Howler — it adds React coupling to what is naturally a non-React concern. Use Howler directly; wrap it in a `useSoundEffects()` custom hook in the project.

**Audio sprites:** Compile all game sounds into a single sprite file. Reduces to 1 network request for all audio.

---

### PWA / Offline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vite-plugin-pwa | 1.2.x | Service worker + manifest | Vite 7-compatible (added in v1.0.1); zero-config precaching via Workbox; generates web app manifest; auto-registers service worker |

**Configuration needed:**
```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,ogg}'],
    // Include audio assets in precache for full offline play
  },
  manifest: {
    name: 'Pulijoodam',
    short_name: 'Pulijoodam',
    display: 'standalone',
    background_color: '#1a1a1a',
  }
})
```

**Audio offline:** Sound files must be explicitly included in `globPatterns` — they are not JS/CSS and Workbox won't auto-include them.

---

### Linting / DX

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | 9.x | Linting | Flat config (default in Vite-generated projects since ESLint 9); use `eslint-plugin-react-hooks` for exhaustive-deps enforcement |
| Prettier | 3.x | Formatting | Pair with ESLint; no style debates |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Styling | Tailwind CSS v4 | CSS Modules | Both valid; Tailwind chosen for speed and zero-config Vite plugin. CSS Modules remain appropriate inside SVG components |
| State | Context + useReducer (+ Zustand if needed) | Redux Toolkit | RTK is overkill for a single-player game with one active game state; Zustand is the upgrade path |
| Testing (unit) | Vitest | Jest | Jest requires separate Babel transform for ESM/TypeScript in Vite projects; Vitest is native |
| Worker RPC | Comlink | Raw postMessage | Raw postMessage has no TypeScript contract enforcement; Comlink adds 1.1KB for meaningful type safety |
| Animation | Motion (framer-motion) | React Spring | React Spring's physics model adds complexity for deterministic board sequences; Motion's timeline API is a better fit |
| Animation | Motion (framer-motion) | CSS transitions | CSS transitions cannot sequence multi-event turns (chain-hops) |
| P2P | PeerJS | simple-peer | simple-peer last released 2021; PeerJS actively maintained through June 2025 |
| P2P | PeerJS | raw WebRTC | Raw WebRTC requires significant boilerplate for data channels and connection management |
| Audio | Howler | Tone.js | Tone.js is for synthesis/music — overkill for discrete SFX; ~100KB heavier |
| Audio | Howler | Raw Web Audio API | Howler's audio sprite + cross-browser support saves ~200 lines of boilerplate |
| Build | Vite 7 | Vite 6 | Vite 7 is the current stable; no reason to pin to v6 |

---

## Installation

```bash
# Core
npm create vite@latest pulijoodam -- --template react-ts
npm install

# Styling
npm install tailwindcss @tailwindcss/vite

# State (add later if needed)
npm install zustand

# Animation
npm install motion

# Audio
npm install howler
npm install -D @types/howler

# Web Worker / AI
npm install comlink

# P2P Multiplayer
npm install peerjs

# PWA
npm install -D vite-plugin-pwa

# Testing
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install -D @playwright/test
npx playwright install
```

**vite.config.ts (complete):**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({ registerType: 'autoUpdate' }),
  ],
  worker: {
    format: 'es', // Required for Comlink + type: 'module' workers
  },
  test: {
    environment: 'jsdom',        // for component tests
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**'],
  },
});
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core framework (React 19, Vite 7, TypeScript 5.9) | HIGH | Versions verified via npm search results (March 2026) |
| Tailwind CSS v4 + @tailwindcss/vite | HIGH | v4.2.1 current; first-party Vite plugin confirmed released |
| Zustand v5 | HIGH | v5.0.11 confirmed; 20M weekly downloads |
| Vitest v4 | HIGH | v4.0.18 confirmed; Vite 7 compatible |
| @testing-library/react v16 | HIGH | v16.3.0 confirmed React 19 compatible |
| Playwright v1.58 | HIGH | v1.58.2 confirmed |
| Motion/framer-motion v12 | HIGH | v12.34.5 confirmed; actively maintained (published daily) |
| Comlink v4.4.2 | MEDIUM | Stable but last published ~1 year ago; functionality complete for use case |
| PeerJS v1.5.5 | MEDIUM | Last published June 2025; active but infrequent releases; signaling dependency on hosted PeerServer |
| Howler v2.2.4 | MEDIUM | Last published March 2024; stable but unmaintained; monitor for browser compatibility issues |
| vite-plugin-pwa v1.2 | HIGH | Vite 7 support confirmed in v1.0.1 |

---

## Sources

- [Vite Releases](https://vite.dev/releases) — Vite 7 is current stable
- [React v19.2 Blog Post](https://react.dev/blog/2025/10/01/react-19-2) — React 19.2 release
- [Zustand v5 Announcement](https://pmnd.rs/blog/announcing-zustand-v5) — v5 changelog
- [Vitest 3.0 Release](https://vitest.dev/blog/vitest-3) — Vitest major version history
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4) — v4 release notes and Vite plugin
- [Motion for React docs](https://motion.dev/docs/react) — SVG animation support
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa) — Vite 7 compatibility
- [PeerJS GitHub](https://github.com/peers/peerjs) — release history
- [Comlink GitHub](https://github.com/GoogleChromeLabs/comlink) — Google Chrome Labs
- [Web Workers + Comlink + Vite](https://johnnyreilly.com/web-workers-comlink-vite-tanstack-query) — integration pattern
- [howler.js npm](https://www.npmjs.com/package/howler) — version and maintenance status
- [Vitest vs Jest 2025](https://vitest.dev/guide/comparisons) — official comparison
- [State Management 2026](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b) — community consensus
