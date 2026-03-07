import type { Move } from '../engine';

export type P2PMessage =
  | { type: 'MOVE'; move: Move }
  | { type: 'GAME_SYNC'; moveHistory: Move[] }
  | { type: 'END_CHAIN' }
  | { type: 'PING' }
  | { type: 'PONG' };

export function encodeMessage(msg: P2PMessage): string {
  return JSON.stringify(msg);
}

export function decodeMessage(data: string): P2PMessage {
  return JSON.parse(data) as P2PMessage;
}
