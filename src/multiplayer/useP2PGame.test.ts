import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useP2PGame } from './useP2PGame';
import type { P2PConnection } from './webrtc';
import { encodeMessage } from './protocol';

// ─── Mock P2PConnection ──────────────────────────────────────────────────────

function createMockConnection(): P2PConnection & {
  _messageCallbacks: ((data: string) => void)[];
  _stateCallbacks: ((state: string) => void)[];
} {
  const _messageCallbacks: ((data: string) => void)[] = [];
  const _stateCallbacks: ((state: string) => void)[] = [];

  return {
    send: vi.fn(),
    close: vi.fn(),
    onMessage(cb: (data: string) => void) {
      _messageCallbacks.push(cb);
    },
    onStateChange(cb: (state: string) => void) {
      _stateCallbacks.push(cb);
    },
    _testTriggerMessage(data: string) {
      for (const cb of _messageCallbacks) cb(data);
    },
    _testTriggerStateChange(state: string) {
      for (const cb of _stateCallbacks) cb(state);
    },
    _messageCallbacks,
    _stateCallbacks,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useP2PGame', () => {
  let conn: ReturnType<typeof createMockConnection>;

  beforeEach(() => {
    conn = createMockConnection();
  });

  it('returns canUndo: false and canRedo: false always (MP-08)', () => {
    const { result } = renderHook(() =>
      useP2PGame({ localRole: 'goat', connection: conn })
    );
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('calls connection.send with MOVE message when local player makes a move on their turn', () => {
    // Goat goes first, so localRole='goat' means it's our turn
    const { result } = renderHook(() =>
      useP2PGame({ localRole: 'goat', connection: conn })
    );

    // Goat placement: tap an empty node (e.g., node 1)
    act(() => {
      result.current.onNodeTap(1);
    });

    // Should have sent a MOVE message over the connection
    expect(conn.send).toHaveBeenCalledTimes(1);
    const sentMsg = (conn.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(sentMsg.type).toBe('MOVE');
    expect(sentMsg.move.type).toBe('PLACE');
  });

  it('applies received MOVE message to local game state', () => {
    // localRole='tiger' means goat goes first -- it's opponent's turn initially
    const { result } = renderHook(() =>
      useP2PGame({ localRole: 'tiger', connection: conn })
    );

    const initialGoatsInPool = result.current.gameState.goatsInPool;

    // Simulate opponent (goat) sending a move
    act(() => {
      conn._testTriggerMessage(encodeMessage({ type: 'MOVE', move: { type: 'PLACE', to: 5 } }));
    });

    // Goat should have been placed, reducing pool by 1
    expect(result.current.gameState.goatsInPool).toBe(initialGoatsInPool - 1);
    expect(result.current.gameState.board[5]).toBe('goat');
  });

  it('ignores moves when it is the local player\'s turn (prevents out-of-turn opponent moves)', () => {
    // localRole='goat', goat goes first -- it's our turn
    const { result } = renderHook(() =>
      useP2PGame({ localRole: 'goat', connection: conn })
    );

    const stateBefore = result.current.gameState;

    // Simulate opponent sending a move during our turn -- should be ignored
    act(() => {
      conn._testTriggerMessage(encodeMessage({ type: 'MOVE', move: { type: 'PLACE', to: 5 } }));
    });

    // State should be unchanged
    expect(result.current.gameState).toBe(stateBefore);
  });

  it('detects disconnect and sets isDisconnected: true', () => {
    const { result } = renderHook(() =>
      useP2PGame({ localRole: 'goat', connection: conn })
    );

    expect(result.current.isDisconnected).toBe(false);

    act(() => {
      conn._testTriggerStateChange('disconnected');
    });

    expect(result.current.isDisconnected).toBe(true);
  });

  it('detects failed connection and sets isDisconnected: true', () => {
    const { result } = renderHook(() =>
      useP2PGame({ localRole: 'goat', connection: conn })
    );

    act(() => {
      conn._testTriggerStateChange('failed');
    });

    expect(result.current.isDisconnected).toBe(true);
  });
});
