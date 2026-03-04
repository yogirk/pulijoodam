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

// ─── Reducer ─────────────────────────────────────────────────────────────────

function gameReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {

    case 'NODE_TAPPED': {
      const { nodeId } = action;
      const { gameState, selectedNode, history, legalMoves } = state;

      // If game is over, ignore all taps
      if (getGameStatus(gameState) !== 'ongoing') {
        return state;
      }

      // ── Mid chain-hop: only the chain tiger can act ───────────────────────
      if (gameState.chainJumpInProgress !== null) {
        const chainTiger = gameState.chainJumpInProgress;

        // Tap on the tiger itself → no-op
        if (nodeId === chainTiger) return state;

        // Check if tapped node is a valid capture destination
        const captureMove = legalMoves.find(
          lm => lm.move.type === 'CAPTURE' && lm.to === nodeId
        );

        if (!captureMove) return state; // not a legal capture target — ignore

        const result = applyMove(gameState, captureMove.move);
        if (result.error) return state;

        const newLegalMoves = getLegalMoves(result.state);
        return {
          ...state,
          gameState: result.state,
          history: [...history, result.state],
          redoStack: [],
          selectedNode: null,
          legalMoves: newLegalMoves,
          lastEvents: result.events,
        };
      }

      // ── Placement phase (goat's turn) ─────────────────────────────────────
      if (gameState.phase === 'placement' && gameState.currentTurn === 'goat') {
        // Attempt a PLACE move at the tapped node
        const placeMove = legalMoves.find(
          lm => lm.move.type === 'PLACE' && lm.to === nodeId
        );

        if (!placeMove) return state; // not a valid placement node

        const result = applyMove(gameState, placeMove.move);
        if (result.error) return state;

        const newLegalMoves = getLegalMoves(result.state);
        return {
          ...state,
          gameState: result.state,
          history: [...history, result.state],
          redoStack: [],
          selectedNode: null,
          legalMoves: newLegalMoves,
          lastEvents: result.events,
        };
      }

      // ── Tiger placement phase (tiger's turn) ─────────────────────────────
      if (gameState.phase === 'placement' && gameState.currentTurn === 'tiger') {
        // If nothing selected: select a tiger piece if it has legal moves
        if (selectedNode === null) {
          if (gameState.board[nodeId] !== 'tiger') return state;

          // Find legal moves from this tiger
          const movesFromNode = legalMoves.filter(
            lm => lm.from === nodeId
          );

          if (movesFromNode.length === 0) return state; // no legal moves from this tiger

          return {
            ...state,
            selectedNode: nodeId,
            // Keep full legalMoves so destinations can be highlighted
          };
        }

        // Tiger already selected
        if (selectedNode !== null) {
          // Tapping the same tiger deselects
          if (nodeId === selectedNode) {
            return { ...state, selectedNode: null };
          }

          // Check if tapped node is a legal destination from selectedNode
          const moveToNode = legalMoves.find(
            lm => lm.from === selectedNode && lm.to === nodeId
          );

          if (moveToNode) {
            const result = applyMove(gameState, moveToNode.move);
            if (result.error) return state;

            const newLegalMoves = getLegalMoves(result.state);
            return {
              ...state,
              gameState: result.state,
              history: [...history, result.state],
              redoStack: [],
              selectedNode: null,
              legalMoves: newLegalMoves,
              lastEvents: result.events,
            };
          }

          // Tapped a different tiger — switch selection
          if (gameState.board[nodeId] === 'tiger') {
            const movesFromNew = legalMoves.filter(lm => lm.from === nodeId);
            if (movesFromNew.length > 0) {
              return { ...state, selectedNode: nodeId };
            }
          }

          // Tapped elsewhere (non-destination, non-tiger) → deselect
          return { ...state, selectedNode: null };
        }

        return state;
      }

      // ── Movement phase ────────────────────────────────────────────────────
      if (gameState.phase === 'movement') {
        const currentPiece = gameState.currentTurn; // 'tiger' | 'goat'

        if (selectedNode === null) {
          // Select a piece if it belongs to current player and has legal moves
          if (gameState.board[nodeId] !== currentPiece) return state;

          const movesFromNode = legalMoves.filter(lm => lm.from === nodeId);
          if (movesFromNode.length === 0) return state;

          return { ...state, selectedNode: nodeId };
        }

        // A piece is selected
        if (nodeId === selectedNode) {
          // Deselect on second tap
          return { ...state, selectedNode: null };
        }

        // Check if tapped node is a legal destination from selectedNode
        const moveToNode = legalMoves.find(
          lm => lm.from === selectedNode && lm.to === nodeId
        );

        if (moveToNode) {
          const result = applyMove(gameState, moveToNode.move);
          if (result.error) return state;

          const newLegalMoves = getLegalMoves(result.state);
          return {
            ...state,
            gameState: result.state,
            history: [...history, result.state],
            redoStack: [],
            selectedNode: null,
            legalMoves: newLegalMoves,
            lastEvents: result.events,
          };
        }

        // Tapped a different piece of the same color → switch selection
        if (gameState.board[nodeId] === currentPiece) {
          const movesFromNew = legalMoves.filter(lm => lm.from === nodeId);
          if (movesFromNew.length > 0) {
            return { ...state, selectedNode: nodeId };
          }
        }

        // Non-destination, non-own-piece → deselect
        return { ...state, selectedNode: null };
      }

      return state;
    }

    case 'END_CHAIN': {
      const { gameState, history } = state;
      if (gameState.chainJumpInProgress === null) return state;

      const result = applyMove(gameState, { type: 'END_CHAIN' });
      if (result.error) return state;

      const newLegalMoves = getLegalMoves(result.state);
      return {
        ...state,
        gameState: result.state,
        history: [...history, result.state],
        redoStack: [],
        selectedNode: null,
        legalMoves: newLegalMoves,
        lastEvents: result.events,
      };
    }

    case 'UNDO': {
      const { history, redoStack, gameState } = state;
      // Need at least 2 states in history to undo (index 0 = initial)
      if (history.length <= 1) return state;

      const prevState = history[history.length - 2];
      const newHistory = history.slice(0, -1);

      const newLegalMoves = getLegalMoves(prevState);
      return {
        ...state,
        gameState: prevState,
        history: newHistory,
        redoStack: [gameState, ...redoStack],
        selectedNode: null,
        legalMoves: newLegalMoves,
        lastEvents: [],
      };
    }

    case 'REDO': {
      const { history, redoStack } = state;
      if (redoStack.length === 0) return state;

      const [nextState, ...remainingRedo] = redoStack;
      const newLegalMoves = getLegalMoves(nextState);
      return {
        ...state,
        gameState: nextState,
        history: [...history, nextState],
        redoStack: remainingRedo,
        selectedNode: null,
        legalMoves: newLegalMoves,
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
