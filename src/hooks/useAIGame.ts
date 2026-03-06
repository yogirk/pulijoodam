// AI game hook — wraps game state management with Web Worker integration,
// minimum AI delay, undo pairing, and stale response discarding.

import { useReducer, useEffect, useRef, useCallback } from 'react';
import {
  createGame,
  applyMove,
  getLegalMoves,
  getGameStatus,
} from '../engine';
import type { GameState, LegalMove, GameEvent, GameStatus, Move, Role } from '../engine';
import type { AIDifficulty } from '../engine/ai/types';
import { DIFFICULTY_CONFIGS } from '../engine/ai/types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MIN_AI_DELAY_MS = 400;

// ─── State shape ──────────────────────────────────────────────────────────────

export interface AIUIState {
  gameState: GameState;
  history: GameState[];
  redoStack: GameState[];
  selectedNode: number | null;
  legalMoves: LegalMove[];
  lastEvents: GameEvent[];
  isAIThinking: boolean;
  requestId: number;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type AIAction =
  | { type: 'NODE_TAPPED'; nodeId: number }
  | { type: 'NEW_GAME' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'END_CHAIN' }
  | { type: 'AI_THINKING' }
  | { type: 'AI_MOVE_RECEIVED'; move: Move; requestId: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInitialAIState(): AIUIState {
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

/** Apply a move and return the new state, or null if the move failed. */
function tryApplyMove(
  state: AIUIState,
  legalMove: LegalMove
): AIUIState | null {
  const result = applyMove(state.gameState, legalMove.move);
  if (result.error) return null;
  return {
    ...state,
    gameState: result.state,
    history: [...state.history, result.state],
    redoStack: [],
    selectedNode: null,
    legalMoves: getLegalMoves(result.state),
    lastEvents: result.events,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function aiGameReducer(state: AIUIState, action: AIAction): AIUIState {
  switch (action.type) {
    case 'NODE_TAPPED': {
      const { nodeId } = action;
      const { gameState, selectedNode, legalMoves } = state;

      // If game is over or AI is thinking, ignore taps
      if (getGameStatus(gameState) !== 'ongoing' || state.isAIThinking) {
        return state;
      }

      // ── Mid chain-hop: only the chain tiger can act ──────────────────
      if (gameState.chainJumpInProgress !== null) {
        const chainTiger = gameState.chainJumpInProgress;
        if (nodeId === chainTiger) return state;

        const captureMove = legalMoves.find(
          lm => lm.move.type === 'CAPTURE' && lm.to === nodeId
        );
        if (!captureMove) return state;
        return tryApplyMove(state, captureMove) ?? state;
      }

      // ── Placement phase ──────────────────────────────────────────────
      if (gameState.phase === 'placement') {
        if (gameState.currentTurn === 'goat') {
          const placeMove = legalMoves.find(
            lm => lm.move.type === 'PLACE' && lm.to === nodeId
          );
          if (!placeMove) return state;
          return tryApplyMove(state, placeMove) ?? state;
        }

        if (gameState.currentTurn === 'tiger') {
          if (selectedNode === null) {
            if (gameState.board[nodeId] !== 'tiger') return state;
            const movesFromNode = legalMoves.filter(lm => lm.from === nodeId);
            if (movesFromNode.length === 0) return state;
            return { ...state, selectedNode: nodeId };
          }

          if (nodeId === selectedNode) {
            return { ...state, selectedNode: null };
          }

          const moveToNode = legalMoves.find(
            lm => lm.from === selectedNode && lm.to === nodeId
          );
          if (moveToNode) {
            return tryApplyMove(state, moveToNode) ?? state;
          }

          if (gameState.board[nodeId] === 'tiger') {
            const movesFromNew = legalMoves.filter(lm => lm.from === nodeId);
            if (movesFromNew.length > 0) {
              return { ...state, selectedNode: nodeId };
            }
          }

          return { ...state, selectedNode: null };
        }

        return state;
      }

      // ── Movement phase ───────────────────────────────────────────────
      if (gameState.phase === 'movement') {
        const currentPiece = gameState.currentTurn;

        if (selectedNode === null) {
          if (gameState.board[nodeId] !== currentPiece) return state;
          const movesFromNode = legalMoves.filter(lm => lm.from === nodeId);
          if (movesFromNode.length === 0) return state;
          return { ...state, selectedNode: nodeId };
        }

        if (nodeId === selectedNode) {
          return { ...state, selectedNode: null };
        }

        const moveToNode = legalMoves.find(
          lm => lm.from === selectedNode && lm.to === nodeId
        );
        if (moveToNode) {
          return tryApplyMove(state, moveToNode) ?? state;
        }

        if (gameState.board[nodeId] === currentPiece) {
          const movesFromNew = legalMoves.filter(lm => lm.from === nodeId);
          if (movesFromNew.length > 0) {
            return { ...state, selectedNode: nodeId };
          }
        }

        return { ...state, selectedNode: null };
      }

      return state;
    }

    case 'END_CHAIN': {
      const { gameState, history } = state;
      if (gameState.chainJumpInProgress === null) return state;

      const result = applyMove(gameState, { type: 'END_CHAIN' });
      if (result.error) return state;

      return {
        ...state,
        gameState: result.state,
        history: [...history, result.state],
        redoStack: [],
        selectedNode: null,
        legalMoves: getLegalMoves(result.state),
        lastEvents: result.events,
      };
    }

    case 'UNDO': {
      const { history, gameState } = state;
      if (history.length <= 1) return state;

      // Paired undo: step back 2 if we have at least 3 history entries
      // (initial + human move + AI move). Step back 1 if only 2 entries
      // (initial + AI first move when human plays tiger).
      const stepsBack = history.length >= 3 ? 2 : 1;
      const newHistory = history.slice(0, -stepsBack);
      const prevState = newHistory[newHistory.length - 1];
      const removedStates = history.slice(-stepsBack);

      return {
        ...state,
        gameState: prevState,
        history: newHistory,
        redoStack: [...removedStates, ...state.redoStack],
        selectedNode: null,
        legalMoves: getLegalMoves(prevState),
        lastEvents: [],
        isAIThinking: false,
        requestId: state.requestId + 1, // cancel in-flight AI
      };
    }

    case 'REDO': {
      const { history, redoStack } = state;
      if (redoStack.length === 0) return state;

      // Redo the paired amount (up to 2, or whatever is available)
      const stepsForward = Math.min(2, redoStack.length);
      const restoredStates = redoStack.slice(0, stepsForward);
      const nextState = restoredStates[restoredStates.length - 1];

      return {
        ...state,
        gameState: nextState,
        history: [...history, ...restoredStates],
        redoStack: redoStack.slice(stepsForward),
        selectedNode: null,
        legalMoves: getLegalMoves(nextState),
        lastEvents: [],
      };
    }

    case 'NEW_GAME': {
      const fresh = makeInitialAIState();
      return {
        ...fresh,
        requestId: state.requestId + 1, // cancel in-flight AI
      };
    }

    case 'AI_THINKING': {
      return { ...state, isAIThinking: true };
    }

    case 'AI_MOVE_RECEIVED': {
      // Discard stale responses
      if (action.requestId !== state.requestId) {
        return state;
      }

      const result = applyMove(state.gameState, action.move);
      if (result.error) {
        // AI produced invalid move — should not happen, but handle gracefully
        return { ...state, isAIThinking: false };
      }

      return {
        ...state,
        gameState: result.state,
        history: [...state.history, result.state],
        redoStack: [],
        selectedNode: null,
        legalMoves: getLegalMoves(result.state),
        lastEvents: result.events,
        isAIThinking: false,
      };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAIGame(config: { humanRole: Role; difficulty: AIDifficulty }) {
  const [state, dispatch] = useReducer(aiGameReducer, undefined, makeInitialAIState);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(state.requestId);

  // Keep requestIdRef in sync
  requestIdRef.current = state.requestId;

  // Worker lifecycle: create on mount, terminate on unmount
  useEffect(() => {
    const worker = new Worker(
      new URL('../engine/ai/worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { type: string; move: Move; thinkTimeMs: number };
      if (data.type !== 'MOVE_COMPUTED') return;

      const currentReqId = requestIdRef.current;
      const remainingDelay = Math.max(0, MIN_AI_DELAY_MS - data.thinkTimeMs);

      if (remainingDelay > 0) {
        setTimeout(() => {
          dispatch({
            type: 'AI_MOVE_RECEIVED',
            move: data.move,
            requestId: currentReqId,
          });
        }, remainingDelay);
      } else {
        dispatch({
          type: 'AI_MOVE_RECEIVED',
          move: data.move,
          requestId: currentReqId,
        });
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // AI turn trigger: fire when it's the AI's turn
  useEffect(() => {
    const { gameState, isAIThinking } = state;
    const status = getGameStatus(gameState);
    if (status !== 'ongoing') return;
    if (isAIThinking) return;
    if (gameState.chainJumpInProgress !== null) return;

    const isAITurn = gameState.currentTurn !== config.humanRole;
    if (!isAITurn) return;

    dispatch({ type: 'AI_THINKING' });

    const aiConfig = DIFFICULTY_CONFIGS[config.difficulty];
    workerRef.current?.postMessage({
      type: 'COMPUTE_MOVE',
      state: gameState,
      config: aiConfig,
    });
  }, [state.gameState, state.isAIThinking, config.humanRole, config.difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const status: GameStatus = getGameStatus(state.gameState);

  return {
    gameState: state.gameState,
    selectedNode: state.selectedNode,
    legalMoves: state.legalMoves,
    lastEvents: state.lastEvents,
    status,
    canUndo: state.history.length > 1,
    canRedo: state.redoStack.length > 0,
    isAIThinking: state.isAIThinking,
    onNodeTap: useCallback((nodeId: number) => dispatch({ type: 'NODE_TAPPED', nodeId }), []),
    onEndChain: useCallback(() => dispatch({ type: 'END_CHAIN' }), []),
    onUndo: useCallback(() => dispatch({ type: 'UNDO' }), []),
    onRedo: useCallback(() => dispatch({ type: 'REDO' }), []),
    onNewGame: useCallback(() => dispatch({ type: 'NEW_GAME' }), []),
  };
}
