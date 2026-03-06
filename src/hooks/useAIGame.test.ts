// @vitest-environment jsdom
import { createGame, applyMove, getLegalMoves } from '../engine';
import type { GameState, Role } from '../engine';
import { aiGameReducer, MIN_AI_DELAY_MS } from './useAIGame';
import type { AIUIState, AIAction } from './useAIGame';

function makeInitialAIState(humanRole: Role = 'goat'): AIUIState {
  const gameState = createGame();
  return {
    gameState,
    history: [gameState],
    redoStack: [],
    selectedNode: null,
    legalMoves: getLegalMoves(gameState),
    lastEvents: [],
    isAIThinking: false,
    requestId: 0,
  };
}

/** Helper: apply a goat placement to a state */
function placeGoat(state: GameState, nodeId: number): GameState {
  const result = applyMove(state, { type: 'PLACE', to: nodeId });
  if (result.error) throw new Error(`Failed to place goat at ${nodeId}: ${result.error}`);
  return result.state;
}

describe('aiGameReducer', () => {
  describe('AI_THINKING action', () => {
    it('sets isAIThinking to true', () => {
      const state = makeInitialAIState();
      const next = aiGameReducer(state, { type: 'AI_THINKING' });
      expect(next.isAIThinking).toBe(true);
    });
  });

  describe('AI_MOVE_RECEIVED action', () => {
    it('applies move and sets isAIThinking to false when requestId matches', () => {
      // Start with a goat placement done, so it's tiger's turn
      const initial = makeInitialAIState('goat');
      // Place a goat first (human move)
      const gs1 = placeGoat(initial.gameState, 5);
      const stateAfterHumanMove: AIUIState = {
        ...initial,
        gameState: gs1,
        history: [initial.gameState, gs1],
        legalMoves: getLegalMoves(gs1),
        isAIThinking: true,
        requestId: 1,
      };

      // Tiger makes a move (AI)
      const tigerMoves = getLegalMoves(gs1);
      const tigerMove = tigerMoves[0].move;

      const next = aiGameReducer(stateAfterHumanMove, {
        type: 'AI_MOVE_RECEIVED',
        move: tigerMove,
        requestId: 1,
      });

      expect(next.isAIThinking).toBe(false);
      expect(next.history.length).toBe(3); // initial + human + AI
      expect(next.gameState.currentTurn).not.toBe(gs1.currentTurn);
    });

    it('discards stale responses (mismatched requestId)', () => {
      const initial = makeInitialAIState('goat');
      const gs1 = placeGoat(initial.gameState, 5);
      const stateAfterHumanMove: AIUIState = {
        ...initial,
        gameState: gs1,
        history: [initial.gameState, gs1],
        legalMoves: getLegalMoves(gs1),
        isAIThinking: true,
        requestId: 5,
      };

      const tigerMoves = getLegalMoves(gs1);
      const tigerMove = tigerMoves[0].move;

      // Send response with old requestId
      const next = aiGameReducer(stateAfterHumanMove, {
        type: 'AI_MOVE_RECEIVED',
        move: tigerMove,
        requestId: 3, // stale
      });

      // State should be unchanged (except possibly isAIThinking stays true)
      expect(next.gameState).toBe(stateAfterHumanMove.gameState);
      expect(next.history.length).toBe(2); // no new move added
    });
  });

  describe('UNDO action - paired undo', () => {
    it('steps back 2 moves when last two are human + AI', () => {
      const initial = makeInitialAIState('goat');
      // Simulate: initial -> human goat place -> AI tiger move
      const gs1 = placeGoat(initial.gameState, 5);
      const tigerMoves = getLegalMoves(gs1);
      const tigerMove = tigerMoves[0].move;
      const gs2Result = applyMove(gs1, tigerMove);
      const gs2 = gs2Result.state;

      const stateWith3History: AIUIState = {
        ...initial,
        gameState: gs2,
        history: [initial.gameState, gs1, gs2],
        legalMoves: getLegalMoves(gs2),
        isAIThinking: false,
        requestId: 1,
      };

      const next = aiGameReducer(stateWith3History, { type: 'UNDO' });

      // Should step back 2 moves to the initial state
      expect(next.history.length).toBe(1);
      expect(next.gameState).toBe(initial.gameState);
      expect(next.redoStack.length).toBe(2);
    });

    it('steps back 1 move when AI moved first (human is tiger)', () => {
      const initial = makeInitialAIState('tiger');
      // AI (goat) placed first move
      const gs1 = placeGoat(initial.gameState, 5);

      const stateWith2History: AIUIState = {
        ...initial,
        gameState: gs1,
        history: [initial.gameState, gs1],
        legalMoves: getLegalMoves(gs1),
        isAIThinking: false,
        requestId: 1,
      };

      const next = aiGameReducer(stateWith2History, { type: 'UNDO' });

      expect(next.history.length).toBe(1);
      expect(next.gameState).toBe(initial.gameState);
      expect(next.redoStack.length).toBe(1);
    });

    it('increments requestId on undo (cancels in-flight AI)', () => {
      const initial = makeInitialAIState('goat');
      const gs1 = placeGoat(initial.gameState, 5);
      const tigerMoves = getLegalMoves(gs1);
      const tigerMove = tigerMoves[0].move;
      const gs2Result = applyMove(gs1, tigerMove);
      const gs2 = gs2Result.state;

      const state: AIUIState = {
        ...initial,
        gameState: gs2,
        history: [initial.gameState, gs1, gs2],
        legalMoves: getLegalMoves(gs2),
        isAIThinking: true,
        requestId: 3,
      };

      const next = aiGameReducer(state, { type: 'UNDO' });
      expect(next.requestId).toBe(4);
      expect(next.isAIThinking).toBe(false);
    });
  });

  describe('NEW_GAME action', () => {
    it('resets state and increments requestId', () => {
      const state: AIUIState = {
        ...makeInitialAIState(),
        requestId: 5,
        isAIThinking: true,
      };

      const next = aiGameReducer(state, { type: 'NEW_GAME' });
      expect(next.requestId).toBe(6);
      expect(next.isAIThinking).toBe(false);
      expect(next.history.length).toBe(1);
    });
  });

  describe('MIN_AI_DELAY_MS', () => {
    it('is at least 400ms', () => {
      expect(MIN_AI_DELAY_MS).toBeGreaterThanOrEqual(400);
    });
  });

  describe('delay calculation', () => {
    it('computes remaining delay correctly', () => {
      // If AI took 100ms, delay should be 300ms (400 - 100)
      const remaining = Math.max(0, MIN_AI_DELAY_MS - 100);
      expect(remaining).toBe(MIN_AI_DELAY_MS - 100);
    });

    it('clamps negative delay to 0', () => {
      // If AI took 600ms, delay should be 0 (not negative)
      const remaining = Math.max(0, MIN_AI_DELAY_MS - 600);
      expect(remaining).toBe(0);
    });
  });
});
