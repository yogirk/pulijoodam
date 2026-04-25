// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { GameEvent } from '../engine/types';
import { useAnimationQueue } from './useAnimationQueue';

// Mock AudioEngine
vi.mock('../audio/AudioEngine', () => ({
  audioEngine: {
    playPlace: vi.fn(),
    playSlide: vi.fn(),
    playCapture: vi.fn(),
    playWin: vi.fn(),
    playLoss: vi.fn(),
    playIllegal: vi.fn(),
  },
}));

// Import the mocked audioEngine to assert on it
import { audioEngine } from '../audio/AudioEngine';

/** Advance fake timers in small steps, flushing microtasks between each,
 *  so chained async/await delay() calls resolve correctly. */
async function advanceTimers(ms: number, step = 50) {
  let remaining = ms;
  while (remaining > 0) {
    const chunk = Math.min(step, remaining);
    await act(async () => {
      vi.advanceTimersByTime(chunk);
    });
    remaining -= chunk;
  }
}

describe('useAnimationQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with isAnimating=false and empty state', () => {
    const { result } = renderHook(() =>
      useAnimationQueue([], true, 'light')
    );
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.animatingPieces.size).toBe(0);
    expect(result.current.fadingGoat).toBeNull();
    expect(result.current.placingGoat).toBeNull();
    expect(result.current.gameOverGlow).toBeNull();
  });

  it('sets isAnimating=true when events are provided', () => {
    const events: GameEvent[] = [
      { type: 'GOAT_PLACED', at: 5 },
    ];
    const { result } = renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );
    // Should be animating immediately
    expect(result.current.isAnimating).toBe(true);
  });

  it('processes GOAT_PLACED event and resolves after timing', async () => {
    const events: GameEvent[] = [
      { type: 'GOAT_PLACED', at: 5 },
    ];
    const { result } = renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.placingGoat).toBe(5);
    expect(audioEngine.playPlace).toHaveBeenCalledWith('light');

    // Advance past placement duration
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.placingGoat).toBeNull();
  });

  it('processes PIECE_MOVED event with slide sound', async () => {
    const events: GameEvent[] = [
      { type: 'PIECE_MOVED', from: 0, to: 2, piece: 'tiger' },
    ];
    const { result } = renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );

    expect(result.current.isAnimating).toBe(true);
    expect(audioEngine.playSlide).toHaveBeenCalledWith('light');
    expect(result.current.animatingPieces.size).toBeGreaterThan(0);

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current.isAnimating).toBe(false);
  });

  it('processes multiple GOAT_CAPTURED events sequentially', async () => {
    const events: GameEvent[] = [
      { type: 'PIECE_MOVED', from: 0, to: 8, piece: 'tiger' },
      { type: 'GOAT_CAPTURED', over: 2, landedAt: 8 },
      { type: 'PIECE_MOVED', from: 8, to: 15, piece: 'tiger' },
      { type: 'GOAT_CAPTURED', over: 9, landedAt: 15 },
    ];
    const { result } = renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );

    expect(result.current.isAnimating).toBe(true);

    // After first PIECE_MOVED (350ms), should still be animating
    await advanceTimers(400);
    expect(result.current.isAnimating).toBe(true);

    // Advance through GOAT_CAPTURED (400ms arc + 200ms fade + 150ms pause)
    await advanceTimers(800);
    expect(result.current.isAnimating).toBe(true);

    // Advance through second PIECE_MOVED (350ms)
    await advanceTimers(400);
    expect(result.current.isAnimating).toBe(true);

    // Advance through second GOAT_CAPTURED (400ms + 200ms + 150ms)
    await advanceTimers(800);
    expect(result.current.isAnimating).toBe(false);
  });

  it('increments chainIndex for consecutive GOAT_CAPTURED events', async () => {
    const events: GameEvent[] = [
      { type: 'PIECE_MOVED', from: 0, to: 8, piece: 'tiger' },
      { type: 'GOAT_CAPTURED', over: 2, landedAt: 8 },
      { type: 'PIECE_MOVED', from: 8, to: 15, piece: 'tiger' },
      { type: 'GOAT_CAPTURED', over: 9, landedAt: 15 },
    ];
    renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );

    // First capture: chainIndex 0
    // Advance through PIECE_MOVED (350ms) to trigger GOAT_CAPTURED
    await advanceTimers(400);
    expect(audioEngine.playCapture).toHaveBeenCalledWith('light', 0);

    // Advance through first capture (400+200+150) + second PIECE_MOVED (350) to trigger second capture
    await advanceTimers(1200);
    expect(audioEngine.playCapture).toHaveBeenCalledWith('light', 1);
  });

  it('does not play sound when soundEnabled=false', () => {
    const events: GameEvent[] = [
      { type: 'GOAT_PLACED', at: 5 },
    ];
    renderHook(() =>
      useAnimationQueue(events, false, 'light')
    );

    expect(audioEngine.playPlace).not.toHaveBeenCalled();
    expect(audioEngine.playSlide).not.toHaveBeenCalled();
    expect(audioEngine.playCapture).not.toHaveBeenCalled();
  });

  it('cancels in-progress animation on unmount', async () => {
    const events: GameEvent[] = [
      { type: 'PIECE_MOVED', from: 0, to: 2, piece: 'tiger' },
    ];
    const { result, unmount } = renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );

    expect(result.current.isAnimating).toBe(true);
    unmount();

    // Advancing time should not cause errors
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
  });

  it('processes GAME_OVER event with glow', async () => {
    const events: GameEvent[] = [
      { type: 'GAME_OVER', status: 'tiger-wins' },
    ];
    const { result } = renderHook(() =>
      useAnimationQueue(events, true, 'light')
    );

    expect(result.current.isAnimating).toBe(true);
    expect(result.current.gameOverGlow).toBe('tiger-wins');
    expect(audioEngine.playWin).toHaveBeenCalledWith('light');

    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.gameOverGlow).toBeNull();
  });

  it('does not re-process the same events array', async () => {
    const events: GameEvent[] = [
      { type: 'GOAT_PLACED', at: 5 },
    ];
    const { result, rerender } = renderHook(
      ({ ev }) => useAnimationQueue(ev, true, 'light'),
      { initialProps: { ev: events } }
    );

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isAnimating).toBe(false);

    // Re-render with the same array reference should not restart animation
    rerender({ ev: events });
    expect(result.current.isAnimating).toBe(false);
    expect(audioEngine.playPlace).toHaveBeenCalledTimes(1);
  });
});
