import { describe, it, expect } from 'vitest';
import { encodeMessage, decodeMessage } from './protocol';
import type { P2PMessage } from './protocol';

describe('protocol', () => {
  it('encodeMessage serializes a MOVE message to JSON string', () => {
    const msg: P2PMessage = { type: 'MOVE', move: { type: 'PLACE', to: 5 } };
    const encoded = encodeMessage(msg);
    expect(typeof encoded).toBe('string');
    const parsed = JSON.parse(encoded);
    expect(parsed.type).toBe('MOVE');
    expect(parsed.move).toEqual({ type: 'PLACE', to: 5 });
  });

  it('decodeMessage parses a JSON string back to P2PMessage', () => {
    const json = '{"type":"PING"}';
    const msg = decodeMessage(json);
    expect(msg.type).toBe('PING');
  });

  it('roundtrips encodeMessage/decodeMessage for all message types', () => {
    const messages: P2PMessage[] = [
      { type: 'MOVE', move: { type: 'PLACE', to: 3 } },
      { type: 'MOVE', move: { type: 'MOVE', from: 1, to: 2 } },
      { type: 'MOVE', move: { type: 'CAPTURE', from: 0, over: 1, to: 2 } },
      { type: 'GAME_SYNC', moveHistory: [{ type: 'PLACE', to: 5 }, { type: 'PLACE', to: 6 }] },
      { type: 'END_CHAIN' },
      { type: 'PING' },
      { type: 'PONG' },
    ];

    for (const msg of messages) {
      const decoded = decodeMessage(encodeMessage(msg));
      expect(decoded).toEqual(msg);
    }
  });
});
