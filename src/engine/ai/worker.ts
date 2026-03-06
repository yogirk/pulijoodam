// Web Worker entry point for AI computation
// Runs off the main thread to prevent UI blocking.

import { chooseMove } from './index';
import type { AIRequest, AIResponse } from './types';

self.onmessage = (e: MessageEvent<AIRequest>) => {
  const { state, config } = e.data;
  const startTime = performance.now();
  const move = chooseMove(state, config);
  const elapsed = performance.now() - startTime;
  self.postMessage({
    type: 'MOVE_COMPUTED',
    move,
    thinkTimeMs: elapsed,
  } satisfies AIResponse);
};
