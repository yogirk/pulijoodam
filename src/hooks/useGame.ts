import { useReducer } from 'react';
import {
  createGame,
  applyMove,
  getLegalMoves,
  getGameStatus,
} from '../engine';
import type { GameState, LegalMove, GameEvent } from '../engine';

// ─── State shape ─────────────────────────────────────────────────────────────

interface UIState {
  gameState: GameState;
  history: GameState[];   // full state snapshots for undo (index 0 = initial)
  redoStack: GameState[]; // redo stack
  selectedNode: number | null;
  legalMoves: LegalMove[];
  lastEvents: GameEvent[];
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type UIAction =
  | { type: 'NODE_TAPPED'; nodeId: number }
  | { type: 'NEW_GAME' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'END_CHAIN' };

// ─── Initial state ────────────────────────────────────────────────────────────

function makeInitialUIState(): UIState {
  const gameState = createGame();
  return {
    gameState,
    history: [gameState],
    redoStack: [],
    selectedNode: null,
    legalMoves: getLegalMoves(gameState),
    lastEvents: [],
  };
}

const initialUIState: UIState = makeInitialUIState();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Apply a move and return the new UIState, or null if the move failed. */
function tryApplyMove(
  state: UIState,
  legalMove: LegalMove
): UIState | null {
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

// ─── Reducer ─────────────────────────────────────────────────────────────────

function gameReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {

    case 'NODE_TAPPED': {
      const { nodeId } = action;
      const { gameState, selectedNode, legalMoves } = state;

      // If game is over, ignore all taps
      if (getGameStatus(gameState) !== 'ongoing') {
        return state;
      }

      // ── Mid chain-hop: only the chain tiger can act ───────────────────────
      if (gameState.chainJumpInProgress !== null) {
        const chainTiger = gameState.chainJumpInProgress;
        if (nodeId === chainTiger) return state;

        const captureMove = legalMoves.find(
          lm => lm.move.type === 'CAPTURE' && lm.to === nodeId
        );
        if (!captureMove) return state;
        return tryApplyMove(state, captureMove) ?? state;
      }

      // ── Placement phase ─────────────────────────────────────────────────
      if (gameState.phase === 'placement') {
        // Goat placement: tap empty node → place goat
        if (gameState.currentTurn === 'goat') {
          const placeMove = legalMoves.find(
            lm => lm.move.type === 'PLACE' && lm.to === nodeId
          );
          if (!placeMove) return state;
          return tryApplyMove(state, placeMove) ?? state;
        }

        // Tiger's turn during placement: select-and-move behavior
        if (gameState.currentTurn === 'tiger') {
          if (selectedNode === null) {
            if (gameState.board[nodeId] !== 'tiger') return state;
            const movesFromNode = legalMoves.filter(lm => lm.from === nodeId);
            if (movesFromNode.length === 0) return state;
            return { ...state, selectedNode: nodeId };
          }

          // Tiger already selected
          if (nodeId === selectedNode) {
            return { ...state, selectedNode: null };
          }

          const moveToNode = legalMoves.find(
            lm => lm.from === selectedNode && lm.to === nodeId
          );
          if (moveToNode) {
            return tryApplyMove(state, moveToNode) ?? state;
          }

          // Switch selection to another tiger
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

      // ── Movement phase ────────────────────────────────────────────────────
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

        // Switch selection to another own piece
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
      const { history, redoStack, gameState } = state;
      if (history.length <= 1) return state;

      const prevState = history[history.length - 2];
      const newHistory = history.slice(0, -1);

      return {
        ...state,
        gameState: prevState,
        history: newHistory,
        redoStack: [gameState, ...redoStack],
        selectedNode: null,
        legalMoves: getLegalMoves(prevState),
        lastEvents: [],
      };
    }

    case 'REDO': {
      const { history, redoStack } = state;
      if (redoStack.length === 0) return state;

      const [nextState, ...remainingRedo] = redoStack;
      return {
        ...state,
        gameState: nextState,
        history: [...history, nextState],
        redoStack: remainingRedo,
        selectedNode: null,
        legalMoves: getLegalMoves(nextState),
        lastEvents: [],
      };
    }

    case 'NEW_GAME': {
      return makeInitialUIState();
    }

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialUIState);

  return {
    gameState: state.gameState,
    selectedNode: state.selectedNode,
    legalMoves: state.legalMoves,
    lastEvents: state.lastEvents,
    status: getGameStatus(state.gameState),
    canUndo: state.history.length > 1,
    canRedo: state.redoStack.length > 0,
    onNodeTap: (nodeId: number) => dispatch({ type: 'NODE_TAPPED', nodeId }),
    onEndChain: () => dispatch({ type: 'END_CHAIN' }),
    onUndo: () => dispatch({ type: 'UNDO' }),
    onRedo: () => dispatch({ type: 'REDO' }),
    onNewGame: () => dispatch({ type: 'NEW_GAME' }),
  };
}
