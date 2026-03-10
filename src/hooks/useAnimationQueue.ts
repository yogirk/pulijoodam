import { useState, useEffect, useRef } from 'react';
import type { GameEvent, GameStatus } from '../engine/types';
import type { ThemeName } from '../theme/theme';
import { NODES } from '../engine/board';
import { audioEngine } from '../audio/AudioEngine';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnimatingPiece {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface AnimationState {
  isAnimating: boolean;
  animatingPieces: Map<number, AnimatingPiece>;
  fadingGoat: number | null;
  placingGoat: number | null;
  gameOverGlow: GameStatus | null;
  shaking: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Timing constants ───────────────────────────────────────────────────────

const SLIDE_MS = 350;
const CAPTURE_ARC_MS = 400;
const FADE_MS = 200;
const PLACE_MS = 250;
const GLOW_MS = 500;
const CHAIN_PAUSE_MS = 150;

// ─── Hook ───────────────────────────────────────────────────────────────────

export const IDLE_ANIMATION: AnimationState = {
  isAnimating: false,
  animatingPieces: new Map(),
  fadingGoat: null,
  placingGoat: null,
  gameOverGlow: null,
  shaking: false,
};

export function useAnimationQueue(
  lastEvents: GameEvent[],
  soundEnabled: boolean,
  theme: ThemeName
): AnimationState {
  const [state, setState] = useState<AnimationState>(IDLE_ANIMATION);
  const processedRef = useRef<GameEvent[]>([]);
  const cancelledRef = useRef(false);

  // Keep sound/theme as refs so the async processor uses latest values
  const soundRef = useRef(soundEnabled);
  const themeRef = useRef(theme);
  soundRef.current = soundEnabled;
  themeRef.current = theme;

  useEffect(() => {
    // Same array reference or empty -- skip
    if (lastEvents === processedRef.current || lastEvents.length === 0) {
      return;
    }
    processedRef.current = lastEvents;

    // New events to process
    cancelledRef.current = false;

    const processEvents = async () => {
      setState(prev => ({ ...prev, isAnimating: true }));

      let chainIndex = 0;

      for (const event of lastEvents) {
        if (cancelledRef.current) return;

        switch (event.type) {
          case 'GOAT_PLACED': {
            if (soundRef.current) {
              audioEngine.playPlace(themeRef.current);
            }
            setState(prev => ({
              ...prev,
              placingGoat: event.at,
            }));
            await delay(PLACE_MS);
            if (cancelledRef.current) return;
            setState(prev => ({
              ...prev,
              placingGoat: null,
            }));
            break;
          }

          case 'PIECE_MOVED': {
            if (soundRef.current) {
              audioEngine.playSlide(themeRef.current);
            }
            const fromNode = NODES[event.from];
            const toNode = NODES[event.to];
            setState(prev => {
              const newPieces = new Map(prev.animatingPieces);
              newPieces.set(event.to, {
                fromX: fromNode.x,
                fromY: fromNode.y,
                toX: toNode.x,
                toY: toNode.y,
              });
              return { ...prev, animatingPieces: newPieces };
            });
            await delay(SLIDE_MS);
            if (cancelledRef.current) return;
            setState(prev => {
              const newPieces = new Map(prev.animatingPieces);
              newPieces.delete(event.to);
              return { ...prev, animatingPieces: newPieces };
            });
            break;
          }

          case 'GOAT_CAPTURED': {
            if (soundRef.current) {
              audioEngine.playCapture(themeRef.current, chainIndex);
            }
            // Tiger arc animation (from -> over goat -> landing)
            const overNode = NODES[event.over];
            const landNode = NODES[event.landedAt];
            setState(prev => {
              const newPieces = new Map(prev.animatingPieces);
              newPieces.set(event.landedAt, {
                fromX: overNode.x,
                fromY: overNode.y - 30, // arc apex above midpoint
                toX: landNode.x,
                toY: landNode.y,
              });
              return { ...prev, animatingPieces: newPieces };
            });
            await delay(CAPTURE_ARC_MS);
            if (cancelledRef.current) return;
            setState(prev => {
              const newPieces = new Map(prev.animatingPieces);
              newPieces.delete(event.landedAt);
              return { ...prev, animatingPieces: newPieces, fadingGoat: event.over, shaking: true };
            });
            await delay(FADE_MS);
            if (cancelledRef.current) return;
            setState(prev => ({
              ...prev,
              fadingGoat: null,
              shaking: false,
            }));
            chainIndex++;

            // Pause between chain hops
            await delay(CHAIN_PAUSE_MS);
            if (cancelledRef.current) return;
            break;
          }

          case 'GAME_OVER': {
            if (soundRef.current) {
              if (event.status === 'tiger-wins' || event.status === 'goat-wins') {
                audioEngine.playWin(themeRef.current);
              }
            }
            setState(prev => ({
              ...prev,
              gameOverGlow: event.status,
            }));
            await delay(GLOW_MS);
            if (cancelledRef.current) return;
            setState(prev => ({
              ...prev,
              gameOverGlow: null,
            }));
            break;
          }

          // Other events (PHASE_CHANGED, CHAIN_JUMP_AVAILABLE, CHAIN_JUMP_ENDED)
          // don't require visual animation -- skip them
          default:
            break;
        }
      }

      if (!cancelledRef.current) {
        setState(IDLE_ANIMATION);
      }
    };

    processEvents();

    return () => {
      cancelledRef.current = true;
    };
  }, [lastEvents]);

  return state;
}
