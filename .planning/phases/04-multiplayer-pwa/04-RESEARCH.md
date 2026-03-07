# Phase 4: Multiplayer + PWA - Research

**Researched:** 2026-03-07
**Domain:** WebRTC P2P, PWA/Service Workers, SVG Drag Interaction, Accessibility, CI/CD
**Confidence:** HIGH

## Summary

Phase 4 covers two major domains: P2P multiplayer via WebRTC data channels with manual SDP exchange, and production hardening (PWA, drag-to-move, accessibility, performance, CI/CD). The project is in excellent shape for this phase -- the current bundle is only ~249KB JS + 18KB CSS (gzipped: ~80KB total), well under the 1MB target. GameState is already JSON-serializable by design (noted in engine types.ts), making WebRTC relay straightforward. The existing hook architecture (useGame, useAIGame) provides a clear pattern for a useP2PGame hook.

The WebRTC implementation uses browser-native RTCPeerConnection with no library dependencies. The manual SDP exchange (copy-paste Base64 codes) avoids signaling server complexity but requires careful UX to guide users through the two-code flow. For PWA, vite-plugin-pwa provides zero-config service worker generation with Workbox, handling precaching of the Vite build output automatically. Drag-to-move uses SVG pointer events with setPointerCapture for cross-device (mouse + touch) support, with coordinate transformation via getScreenCTM().inverse() to map screen coordinates to SVG viewBox space.

**Primary recommendation:** Build in this order: (1) drag-to-move (purely local, testable), (2) WebRTC multiplayer (new game mode), (3) PWA/service worker + accessibility, (4) CI/CD enhancement + bundle audit. Each layer is independently shippable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Two-screen manual SDP exchange: host creates game and gets a Base64 invite code, guest pastes code and generates response code, host pastes response to connect
- Copy buttons on both code fields for easy sharing via any messaging app
- No PeerJS or signaling server dependency -- pure WebRTC with STUN only
- Known limitation: STUN-only fails for ~20-30% of users on symmetric NAT -- document in UI
- "Play Online" button on setup screen alongside existing "vs AI" and "Local 2P"
- Host picks their role (Tiger or Goat) when creating the game; guest gets the other role
- Undo disabled in P2P games (MP-08)
- Non-blocking toast/banner: "Opponent disconnected" with [Continue vs AI] and [End Game] buttons
- Game board stays visible on disconnect so player can see the position
- If "Continue vs AI", AI takes over the disconnected player's role at current difficulty
- Connection status indicator visible during P2P games (connected/reconnecting/disconnected)
- Both drag and tap-tap always active simultaneously -- no toggle, no device detection
- Drag works for movement phase only; goat placement stays tap-only
- Drag works for tiger captures: drag tiger to landing node, engine infers capture. For chain-hops, after landing, legal destinations glow and user can drag again or tap
- Visual feedback: piece lifts (scale ~1.2x) with drop shadow while dragging, valid destination nodes glow/pulse, snap to nearest valid node on release, animate back to origin on invalid drop
- Everything works offline except P2P multiplayer
- Service worker caches all assets on first load (cache-first strategy)
- Silent update: new SW installs in background, activates on next page load -- no notification
- Install prompt: subtle dismissible banner on second visit, shown once, remembered in localStorage
- PWA icon: tiger silhouette on warm sandstone/terracotta background
- Theme color matches user's active visual theme

### Claude's Discretion
- Accessibility implementation specifics (screen reader patterns, color-blind design choices, ARIA structure)
- Performance optimization targets and memoization strategy (PROD-06)
- Responsive design audit approach (PROD-07)
- GitHub Actions CI/CD pipeline configuration (PROD-09)
- Bundle size optimization approach to stay under 1MB (PROD-10)
- WebRTC ICE configuration (STUN server selection)
- Service worker caching strategy details (precache manifest vs runtime caching)
- PWA manifest details beyond icon and theme color

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MP-01 | WebRTC data channel integration for P2P connection | WebRTC native API research: RTCPeerConnection + RTCDataChannel with STUN-only ICE config |
| MP-02 | Invite code generation (Base64-encoded SDP offer) | Full ICE gathering before encoding -- wait for iceGatheringState "complete", then btoa(JSON.stringify(localDescription)) |
| MP-03 | Join flow: paste offer, generate answer, copy back | Symmetric to MP-02: setRemoteDescription(offer), createAnswer, gather ICE, encode answer |
| MP-04 | Two-code exchange UX with copy buttons and paste fields | Host/Join screen components with textarea + copy/paste buttons, guided instruction text |
| MP-05 | Game synchronization via command relay over data channel | Send Move objects as JSON over reliable ordered data channel; receiver applies via applyMove |
| MP-06 | Connection status indicator | RTCPeerConnection.connectionState event listener; small dot/icon overlay on game screen |
| MP-07 | Disconnect handling | connectionState "disconnected"/"failed" triggers toast with Continue vs AI / End Game options |
| MP-08 | Undo disabled in P2P games | useP2PGame hook omits undo/redo dispatch; GameBoard hides undo buttons when isP2P=true |
| PROD-01 | Service worker for full offline support | vite-plugin-pwa with generateSW strategy and registerType: 'autoUpdate' |
| PROD-02 | Drag-to-move interaction | SVG pointer events (onPointerDown/Move/Up) with setPointerCapture and getScreenCTM coordinate transform |
| PROD-03 | Screen reader move announcements | ARIA live region (aria-live="polite") for move/capture/game-over announcements |
| PROD-04 | Color-blind safe piece design | Tigers use diamond/rhombus shape (already distinct from goat circles); add texture/pattern fill as secondary identifier |
| PROD-05 | ARIA labels on interactive elements | aria-label on board nodes ("Node 5, empty" / "Node 3, tiger"), role="button" already exists on BoardNode |
| PROD-06 | Performance: memoization and lazy loading | React.memo on Board, piece components; useMemo for legalMoves sets; lazy() for Tutorial/History/Replay screens |
| PROD-07 | Responsive design audit | Test at 320px, 375px, 768px, 1024px breakpoints; verify touch targets >= 44px; SVG viewBox auto-scales |
| PROD-08 | PWA manifest for mobile installability | Web app manifest via vite-plugin-pwa: name, icons (192px + 512px), display: standalone, start_url, theme_color |
| PROD-09 | GitHub Pages deployment via GitHub Actions CI | Existing deploy.yml needs: test step before build, upload-pages-artifact@v4 (deprecation notice), lint step |
| PROD-10 | Total bundle size < 1MB | Current: 267KB uncompressed, 80KB gzipped -- already well under target. Add rollup-plugin-visualizer for monitoring |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| RTCPeerConnection (browser API) | native | WebRTC peer connection | Zero dependency; browser-native API available in all modern browsers |
| RTCDataChannel (browser API) | native | Bidirectional data relay | Built into WebRTC; reliable ordered mode for game state sync |
| vite-plugin-pwa | ^0.21 | Service worker + manifest generation | Zero-config Workbox integration for Vite; standard for Vite PWA projects |
| Pointer Events API (browser API) | native | Drag interaction | Cross-device (mouse + touch + pen) without separate handlers; setPointerCapture for reliable drag tracking |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| rollup-plugin-visualizer | ^5.12 | Bundle size analysis | Dev-only; verify < 1MB target after adding new dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native WebRTC | PeerJS | PeerJS abstracts signaling but adds ~45KB and depends on peerjs.com server -- violates no-server constraint |
| vite-plugin-pwa | Manual service worker | Much more code to write; Workbox handles cache versioning, precache manifests, cleanup automatically |
| Pointer Events | HTML Drag and Drop API | HTML DnD doesn't work inside SVG; pointer events give precise SVG coordinate control |
| Pointer Events | @use-gesture/react | Would add ~12KB for functionality achievable in ~80 lines of custom code |

**Installation:**
```bash
npm install -D vite-plugin-pwa rollup-plugin-visualizer
```

Note: No runtime dependencies added. vite-plugin-pwa is build-time only. WebRTC and Pointer Events are browser-native.

## Architecture Patterns

### Recommended Project Structure
```
src/
  multiplayer/
    useP2PGame.ts          # P2P game hook (parallel to useAIGame)
    webrtc.ts              # RTCPeerConnection wrapper (create/join/send/close)
    protocol.ts            # Message types for data channel (Move, GameSync, etc.)
    HostScreen.tsx          # Host game UI (create offer, show code, paste answer)
    JoinScreen.tsx          # Join game UI (paste offer, show answer code)
    ConnectionStatus.tsx    # Small status indicator (dot + label)
    DisconnectBanner.tsx    # "Opponent disconnected" toast with action buttons
  components/
    Board/
      DraggablePiece.tsx    # Wrapper adding drag behavior to Tiger/GoatPiece
      Board.tsx             # Updated with drag handlers + ARIA labels
    GameScreen/
      P2PGameScreen.tsx     # New screen component for P2P games
  pwa/
    install-prompt.tsx      # "Install Pulijoodam" banner component
```

### Pattern 1: WebRTC Connection Manager
**What:** Encapsulate RTCPeerConnection lifecycle in a pure-TS module (no React) with async methods for createOffer/joinWithOffer/connect.
**When to use:** Always for WebRTC -- keeps connection logic testable and separate from React rendering.
**Example:**
```typescript
// src/multiplayer/webrtc.ts

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export interface P2PConnection {
  send: (msg: string) => void;
  close: () => void;
  onMessage: (handler: (msg: string) => void) => void;
  onStateChange: (handler: (state: RTCPeerConnectionState) => void) => void;
}

export async function createOffer(): Promise<{
  offerCode: string;
  applyAnswer: (answerCode: string) => Promise<P2PConnection>;
}> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const channel = pc.createDataChannel('game', { ordered: true });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // Wait for ICE gathering to complete (full SDP, not trickle)
  await new Promise<void>(resolve => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') resolve();
    };
  });

  const offerCode = btoa(JSON.stringify(pc.localDescription));

  return {
    offerCode,
    applyAnswer: async (answerCode: string) => {
      const answer = JSON.parse(atob(answerCode));
      await pc.setRemoteDescription(answer);
      // Return wrapped connection
      return wrapChannel(pc, channel);
    },
  };
}

export async function joinWithOffer(offerCode: string): Promise<{
  answerCode: string;
  connection: P2PConnection;
}> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  const offer = JSON.parse(atob(offerCode));
  await pc.setRemoteDescription(offer);

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  // Wait for ICE gathering
  await new Promise<void>(resolve => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') resolve();
    };
  });

  const answerCode = btoa(JSON.stringify(pc.localDescription));

  // Wait for data channel from host
  const channel = await new Promise<RTCDataChannel>(resolve => {
    pc.ondatachannel = (e) => resolve(e.channel);
  });

  return { answerCode, connection: wrapChannel(pc, channel) };
}
```

### Pattern 2: P2P Game Hook (useP2PGame)
**What:** A React hook mirroring useAIGame's interface but using WebRTC data channel for move relay instead of AI worker.
**When to use:** P2P game mode -- the hook manages game state, sends local moves over data channel, and applies remote moves received from opponent.
**Example:**
```typescript
// src/multiplayer/useP2PGame.ts
// Follows exact same return shape as useGame/useAIGame:
// { gameState, selectedNode, legalMoves, lastEvents, status,
//   canUndo: false, canRedo: false, onNodeTap, onEndChain, ... }

// Key differences from useAIGame:
// 1. No undo/redo (MP-08)
// 2. On local move: send Move via data channel, then apply locally
// 3. On remote message: apply received Move locally
// 4. Connection state tracked for status indicator
// 5. On disconnect: offer "Continue vs AI" (swap to useAIGame state)
```

### Pattern 3: SVG Drag with Pointer Events
**What:** Add drag interaction to game pieces using native Pointer Events API within SVG, with coordinate transformation.
**When to use:** Movement phase for all pieces, capture phase for tigers.
**Example:**
```typescript
// Drag handler pattern for SVG pieces
function handlePointerDown(e: React.PointerEvent<SVGElement>) {
  const svg = svgRef.current!;
  (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);

  // Convert screen coords to SVG coords
  const ctm = svg.getScreenCTM()!.inverse();
  const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm);

  setDragState({ pieceNodeId, startX: point.x, startY: point.y, active: true });
}

function handlePointerMove(e: React.PointerEvent<SVGElement>) {
  if (!dragState.active) return;
  const svg = svgRef.current!;
  const ctm = svg.getScreenCTM()!.inverse();
  const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm);

  setDragState(prev => ({ ...prev, currentX: point.x, currentY: point.y }));
}

function handlePointerUp(e: React.PointerEvent<SVGElement>) {
  if (!dragState.active) return;
  // Find nearest valid node within snap radius
  const nearestNode = findNearestNode(dragState.currentX, dragState.currentY, NODES);
  const isValid = legalMoves.some(lm => lm.from === dragState.pieceNodeId && lm.to === nearestNode?.id);

  if (isValid && nearestNode) {
    onNodeTap(dragState.pieceNodeId); // select
    onNodeTap(nearestNode.id);        // move
  }
  // else: animate back to origin (CSS transition handles this)
  setDragState({ active: false });
}
```

### Pattern 4: ARIA Live Region for Move Announcements
**What:** A visually-hidden live region that announces game events to screen readers.
**When to use:** Every move, capture, and game status change.
**Example:**
```typescript
// Hidden live region component
function ScreenReaderAnnouncer({ lastEvents, gameState }: Props) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const messages = lastEvents.map(event => {
      switch (event.type) {
        case 'GOAT_PLACED': return `Goat placed at position ${event.at}`;
        case 'PIECE_MOVED': return `${event.piece} moved from ${event.from} to ${event.to}`;
        case 'GOAT_CAPTURED': return `Tiger captured goat at position ${event.over}`;
        case 'GAME_OVER': return formatGameOver(event.status);
        default: return '';
      }
    }).filter(Boolean);
    if (messages.length) setAnnouncement(messages.join('. '));
  }, [lastEvents]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Trickle ICE with manual exchange:** Do NOT use trickle ICE -- it requires multiple round-trips of candidate exchange. Wait for full ICE gathering (iceGatheringState === 'complete') before encoding the SDP, so the entire connection setup is a single code exchange.
- **Separate mouse/touch handlers for drag:** Do NOT write separate onMouseDown/onTouchStart handlers. Pointer Events API unifies mouse, touch, and pen input in a single handler set.
- **Using HTML Drag and Drop API in SVG:** The HTML DnD API (draggable, ondragstart, ondrop) does not work inside SVG elements. Must use Pointer Events.
- **Storing full GameState in data channel messages:** Send only Move objects. Both peers have the same engine and can independently compute the resulting state. This keeps messages tiny and validates correctness on both sides.
- **Using aria-live="assertive" for moves:** Use "polite" -- assertive interrupts the user and is inappropriate for non-urgent game events.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker precaching | Custom SW with manual cache API | vite-plugin-pwa (generateSW) | Cache versioning, stale asset cleanup, navigation fallback, and Workbox runtime caching are all handled automatically |
| PWA manifest generation | Manual manifest.webmanifest | vite-plugin-pwa manifest config | Auto-generates manifest with correct paths, hashes, and icons; integrates with Vite base path |
| Bundle size monitoring | Manual size checks | rollup-plugin-visualizer | Visual treemap shows exactly what's in the bundle; catches unexpected size regressions |
| Clipboard copy | Manual document.execCommand | navigator.clipboard.writeText() | Modern async clipboard API with proper error handling; falls back gracefully |

**Key insight:** This phase adds zero runtime dependencies. WebRTC, Pointer Events, Service Workers, and Clipboard API are all browser-native. The only new dependencies (vite-plugin-pwa, rollup-plugin-visualizer) are dev/build-time only, keeping the bundle unchanged.

## Common Pitfalls

### Pitfall 1: ICE Gathering Never Completes
**What goes wrong:** The promise waiting for iceGatheringState === 'complete' hangs indefinitely.
**Why it happens:** Some networks block STUN, or STUN responses are lost. No timeout means the UI freezes.
**How to avoid:** Add a timeout (e.g., 15 seconds) to the ICE gathering promise. If it times out, use whatever candidates have been gathered so far (the local description will still have partial candidates). Show a user-facing error if zero candidates are gathered.
**Warning signs:** UI stays on "Generating invite code..." for more than 10 seconds.

### Pitfall 2: Data Channel Opens Before ondatachannel Fires
**What goes wrong:** On the joiner side, the data channel opens before the ondatachannel event handler is registered.
**Why it happens:** If setRemoteDescription and the answer are processed very quickly, the channel may be negotiated before the handler is attached.
**How to avoid:** Register the ondatachannel handler BEFORE calling setRemoteDescription. This ensures no events are missed.
**Warning signs:** Connection shows "connected" but no messages are received on the joiner side.

### Pitfall 3: SVG Coordinate Mismatch During Drag
**What goes wrong:** Dragged piece appears offset from the cursor/finger position.
**Why it happens:** The SVG has a viewBox (0 0 600 380) but renders at a different pixel size. Screen coordinates (clientX/Y) must be transformed to SVG coordinates using getScreenCTM().inverse().
**How to avoid:** Always use `svg.getScreenCTM()!.inverse()` with `DOMPoint.matrixTransform()` for coordinate conversion. Never use raw clientX/Y as SVG coordinates.
**Warning signs:** Piece jumps to wrong position on pointer down, or drag offset grows with distance from SVG origin.

### Pitfall 4: Pointer Events Lost During Fast Drag
**What goes wrong:** Dragging a piece quickly causes it to "stick" or lose tracking.
**Why it happens:** Without pointer capture, the pointer leaves the element boundary and events stop firing.
**How to avoid:** Call `(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)` in onPointerDown. This ensures all subsequent pointer events are directed to the captured element regardless of cursor position.
**Warning signs:** Drag works slowly but fails with fast movements.

### Pitfall 5: Service Worker Caches Stale HTML on SPA
**What goes wrong:** After deploying a new version, users see the old app even after refresh.
**Why it happens:** Cache-first strategy serves the cached index.html, which references old JS/CSS hashes.
**How to avoid:** Use vite-plugin-pwa with registerType: 'autoUpdate' -- it automatically sets skipWaiting and clientsClaim, so the new SW takes over on next page load. Vite's content-hashed filenames ensure assets are never stale.
**Warning signs:** Users report seeing old version after deployment; hard refresh (Ctrl+Shift+R) fixes it.

### Pitfall 6: Base64 SDP Too Long for Messaging Apps
**What goes wrong:** The invite code is thousands of characters, too long for SMS or some chat apps.
**Why it happens:** Full SDP with ICE candidates can be 2-4KB, which Base64 encodes to 3-5KB of text.
**How to avoid:** This is a known limitation of the manual SDP approach. Mitigate by: (1) providing a "Copy" button so users can paste it rather than retyping, (2) mentioning in the UI that the code is long and to use a messaging app rather than SMS. The code is typically ~2000-4000 characters.
**Warning signs:** Users report the code is too long to share. This is expected and documented.

### Pitfall 7: Drag Conflicts with Tap-Tap Selection
**What goes wrong:** A tap intended to select a piece triggers a drag, or a very short drag is treated as a tap.
**Why it happens:** Both systems listen for pointer events on the same elements.
**How to avoid:** Use a drag threshold: only enter drag mode if the pointer moves > 5px from the initial down position. If the pointer is released within the threshold, treat it as a tap (existing onNodeTap logic). This naturally differentiates intent.
**Warning signs:** Users can't select pieces with a quick tap, or pieces jump slightly on selection.

## Code Examples

### WebRTC Data Channel Message Protocol
```typescript
// src/multiplayer/protocol.ts
import type { Move, Role } from '../engine';

// Messages sent over the data channel
export type P2PMessage =
  | { type: 'MOVE'; move: Move }              // A move was made
  | { type: 'GAME_SYNC'; moveHistory: Move[] } // Full state sync (on connect)
  | { type: 'END_CHAIN' }                      // Tiger ended chain-hop
  | { type: 'PING' }                           // Keepalive
  | { type: 'PONG' };                          // Keepalive response

export function encodeMessage(msg: P2PMessage): string {
  return JSON.stringify(msg);
}

export function decodeMessage(data: string): P2PMessage {
  return JSON.parse(data) as P2PMessage;
}
```

### Clipboard Copy with Fallback
```typescript
// Copy-to-clipboard with fallback for older browsers
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: create textarea, select, copy
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(ta);
    }
  }
}
```

### PWA Configuration (vite-plugin-pwa)
```typescript
// vite.config.ts additions
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/pulijoodam/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      manifest: {
        name: 'Pulijoodam - Tiger vs Goat',
        short_name: 'Pulijoodam',
        description: 'Classic South Indian board game of strategy',
        theme_color: '#1c1917',
        background_color: '#1c1917',
        display: 'standalone',
        start_url: '/pulijoodam/',
        scope: '/pulijoodam/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
```

### Drag Threshold Implementation
```typescript
const DRAG_THRESHOLD = 5; // pixels in SVG space

function handlePointerMove(e: React.PointerEvent<SVGElement>) {
  if (!pointerDown) return;
  const svgPoint = screenToSVG(e);

  const dx = svgPoint.x - startPoint.x;
  const dy = svgPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (!isDragging && distance > DRAG_THRESHOLD) {
    setIsDragging(true); // Cross threshold: enter drag mode
  }

  if (isDragging) {
    setDragPos({ x: svgPoint.x, y: svgPoint.y });
  }
}

function handlePointerUp(e: React.PointerEvent<SVGElement>) {
  if (isDragging) {
    // Snap to nearest valid node or animate back
    handleDrop(dragPos);
  } else {
    // Below threshold: treat as tap
    onNodeTap(pieceNodeId);
  }
  resetDragState();
}
```

### Find Nearest Valid Node (Snap Logic)
```typescript
const SNAP_RADIUS = 30; // SVG units

function findNearestValidNode(
  x: number, y: number,
  nodes: NodeDef[],
  validNodeIds: Set<number>
): number | null {
  let nearest: number | null = null;
  let minDist = SNAP_RADIUS;

  for (const node of nodes) {
    if (!validNodeIds.has(node.id)) continue;
    const dx = node.x - x;
    const dy = node.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = node.id;
    }
  }
  return nearest;
}
```

### Color-Blind Safe Piece Enhancement
```typescript
// Add pattern fills for tigers -- diamond shape already distinct from goat circles,
// but add inner marking as tertiary identifier
// Tiger: diamond + inner cross-hatch lines
// Goat: circle + inner dot pattern

// In TigerPiece.tsx, add a small inner symbol:
<polygon /* existing diamond */ />
<line x1={-4} y1={0} x2={4} y2={0}
  stroke="var(--tiger-stroke)" strokeWidth={1.5}
  transform={`translate(${x}, ${y})`}
  style={{ pointerEvents: 'none' }}
/>

// In GoatPiece.tsx, add inner dot:
<circle cx={x} cy={y} r={3}
  fill="var(--goat-stroke)"
  style={{ pointerEvents: 'none' }}
/>
```

### Install Prompt Banner
```typescript
// Show subtle banner on second visit, remember dismissal
function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if dismissed before or already installed
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10) + 1;
    localStorage.setItem('pwa_visit_count', String(visitCount));

    if (dismissed || visitCount < 2) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto rounded-lg p-4 z-50"
      style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      <p className="text-sm mb-2">Install Pulijoodam for quick access?</p>
      <div className="flex gap-2">
        <button onClick={handleInstall} className="text-sm px-3 py-1 rounded"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-primary)' }}>
          Install
        </button>
        <button onClick={handleDismiss} className="text-sm px-3 py-1"
          style={{ color: 'var(--text-secondary)' }}>
          Not now
        </button>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PeerJS/Socket.io for WebRTC signaling | Native RTCPeerConnection + manual SDP | Ongoing | Zero dependencies; PeerJS still works but adds unnecessary abstraction for simple data channel use |
| Mouse + Touch event handlers | Pointer Events API | 2020+ (full browser support) | Single event handler set for all input devices; setPointerCapture eliminates lost-drag bugs |
| Manual service worker + cache API | vite-plugin-pwa + Workbox | Workbox v7 (2023) | Automatic precache manifest, cache versioning, cleanup; much less error-prone |
| actions/upload-pages-artifact@v3 | actions/upload-pages-artifact@v4 | Dec 2024 (deprecation notice) | v3 deprecated on GitHub.com; must use v4 for GitHub Pages deployment |
| react-beautiful-dnd | @dnd-kit or Pointer Events | 2023 (unmaintained) | rbd is dead; for SVG contexts, raw Pointer Events are more appropriate than any library |

**Deprecated/outdated:**
- `actions/upload-pages-artifact@v3`: GitHub deprecation notice from Dec 2024 requires v4. The existing deploy.yml uses v3 and must be updated.
- `document.execCommand('copy')`: Deprecated but needed as fallback for clipboard in HTTP contexts. Primary should be `navigator.clipboard.writeText()`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | vite.config.ts (test section) |
| Quick run command | `npx vitest run --testPathPattern` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MP-01 | WebRTC data channel creation | unit | `npx vitest run src/multiplayer/webrtc.test.ts -x` | Wave 0 |
| MP-02 | Base64 SDP offer encoding | unit | `npx vitest run src/multiplayer/webrtc.test.ts -x` | Wave 0 |
| MP-03 | Join flow answer generation | unit | `npx vitest run src/multiplayer/webrtc.test.ts -x` | Wave 0 |
| MP-04 | Host/Join UX copy/paste | component | `npx vitest run src/multiplayer/HostScreen.test.tsx -x` | Wave 0 |
| MP-05 | Game sync via data channel | unit | `npx vitest run src/multiplayer/protocol.test.ts -x` | Wave 0 |
| MP-06 | Connection status display | component | `npx vitest run src/multiplayer/ConnectionStatus.test.tsx -x` | Wave 0 |
| MP-07 | Disconnect handling UI | component | `npx vitest run src/multiplayer/DisconnectBanner.test.tsx -x` | Wave 0 |
| MP-08 | Undo disabled in P2P | unit | `npx vitest run src/multiplayer/useP2PGame.test.ts -x` | Wave 0 |
| PROD-01 | Offline support | manual-only | Manual: disconnect network, verify app loads | N/A |
| PROD-02 | Drag-to-move | component | `npx vitest run src/components/Board/DraggablePiece.test.tsx -x` | Wave 0 |
| PROD-03 | Screen reader announcements | component | `npx vitest run src/components/ScreenReaderAnnouncer.test.tsx -x` | Wave 0 |
| PROD-04 | Color-blind safe pieces | manual-only | Visual inspection with colorblind simulator | N/A |
| PROD-05 | ARIA labels | component | `npx vitest run src/components/Board/Board.test.tsx -x` | Existing (extend) |
| PROD-06 | Performance memoization | unit | `npx vitest run src/components/Board/Board.test.tsx -x` | Existing (extend) |
| PROD-07 | Responsive design | manual-only | Browser DevTools responsive mode audit | N/A |
| PROD-08 | PWA manifest | manual-only | Lighthouse PWA audit in Chrome DevTools | N/A |
| PROD-09 | CI/CD pipeline | integration | Push to branch; verify Actions run and deploy | N/A |
| PROD-10 | Bundle < 1MB | unit | `npm run build && check dist size` | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run` (full suite, ~80s)
- **Per wave merge:** Full suite + manual PWA/responsive checks
- **Phase gate:** Full suite green + Lighthouse PWA score + bundle size check

### Wave 0 Gaps
- [ ] `src/multiplayer/webrtc.test.ts` -- WebRTC connection mocking (RTCPeerConnection needs mock)
- [ ] `src/multiplayer/protocol.test.ts` -- Message encode/decode
- [ ] `src/multiplayer/useP2PGame.test.ts` -- P2P hook with mocked connection
- [ ] `src/components/Board/DraggablePiece.test.tsx` -- Drag interaction with pointer events
- [ ] `src/components/ScreenReaderAnnouncer.test.tsx` -- ARIA live region content
- [ ] Note: WebRTC tests require mocking RTCPeerConnection (not available in Node/happy-dom). Use a minimal mock that simulates the API surface.

## Open Questions

1. **WebRTC in Vitest (Node environment)**
   - What we know: RTCPeerConnection is a browser API not available in Node or happy-dom
   - What's unclear: Best practice for mocking the full RTCPeerConnection API for unit tests
   - Recommendation: Create a minimal RTCPeerConnection mock that simulates createOffer/createAnswer/setLocalDescription/setRemoteDescription/onicecandidate. Test the webrtc.ts wrapper against this mock. Integration testing requires a real browser (manual or Playwright, out of scope for v1).

2. **SDP code length**
   - What we know: Full SDP with ICE candidates can be 2000-4000 Base64 characters
   - What's unclear: Exact size variation across different browsers and network configurations
   - Recommendation: Accept the length as a trade-off of the no-server approach. The copy button makes sharing practical via messaging apps. Consider future SDP compression (e.g., SDP munging to remove unnecessary lines) but defer to v2.

3. **PWA Icons**
   - What we know: Need 192x192 and 512x512 PNG icons with tiger silhouette on terracotta background
   - What's unclear: Whether to generate programmatically or create manually
   - Recommendation: Create simple SVG icon, export to PNG at both sizes. Can use a minimal tiger silhouette from the existing theme colors.

## Sources

### Primary (HIGH confidence)
- [MDN: RTCPeerConnection](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection) - createOffer/createAnswer/SDP lifecycle
- [MDN: Simple RTCDataChannel sample](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample) - data channel usage patterns
- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) - screen reader announcement patterns
- [MDN: Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) - drag interaction API
- [Vite: Static Deploy Guide](https://vite.dev/guide/static-deploy) - GitHub Pages deployment workflow
- [vite-plugin-pwa Guide](https://vite-pwa-org.netlify.app/guide/) - PWA configuration for Vite
- [GitHub: actions/upload-pages-artifact](https://github.com/actions/upload-pages-artifact) - v4 requirement
- [GitHub: Deprecation notice for Pages actions](https://github.blog/changelog/2024-12-05-deprecation-notice-github-pages-actions-to-require-artifacts-actions-v4-on-github-com/) - v3 deprecated

### Secondary (MEDIUM confidence)
- [WebRTC.org: Peer Connections](https://webrtc.org/getting-started/peer-connections) - ICE gathering patterns
- [DEV: Manual SDP Exchange](https://dev.to/hexshift/building-a-minimal-webrtc-peer-without-a-signaling-server-using-only-manual-sdp-exchange-mck) - no-signaling-server pattern
- [Peter Collingridge: Draggable SVG](https://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/) - getScreenCTM coordinate transform
- [DEV: Dragging SVGs with React](https://dev.to/tvanantwerp/dragging-svgs-with-react-38h6) - React SVG drag hooks
- [Calliope Games: Color Blind Board Games](https://calliopegames.com/9699/accomodations-for-color-blind-players/) - shape + pattern differentiation
- [Google STUN servers](https://www.videosdk.live/developer-hub/stun-turn-server/google-stun-server) - free public STUN server list

### Tertiary (LOW confidence)
- SDP code length estimates (2000-4000 chars) -- based on general WebRTC community reports, not measured in this specific context

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all browser-native APIs with excellent MDN documentation; vite-plugin-pwa is well-established
- Architecture: HIGH - patterns directly mirror existing codebase (useAIGame parallel for useP2PGame; SVG pointer events match existing SVG rendering approach)
- WebRTC flow: HIGH - MDN documentation is comprehensive; manual SDP exchange is a well-documented pattern
- Drag interaction: HIGH - Pointer Events API is mature; SVG coordinate transform via getScreenCTM is standard
- Accessibility: MEDIUM - ARIA live regions are well-documented but board game-specific patterns are less established
- PWA: HIGH - vite-plugin-pwa is standard for Vite projects with extensive documentation
- Pitfalls: HIGH - drawn from documented WebRTC/SVG/PWA common issues

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (stable browser APIs; vite-plugin-pwa API unlikely to change)
