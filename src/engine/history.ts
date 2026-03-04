import type { GameState } from './types';

/**
 * Undo the last move.
 * The history stack lives in the UI layer (useGame hook).
 * Engine undo/redo are pure utilities that operate on the stack.
 *
 * @param state - current state (last entry in history)
 * @param history - full history stack (minimum length 1)
 * @returns previous state and trimmed history
 */
export function undo(
  _state: GameState,
  history: GameState[]
): { state: GameState; history: GameState[] } {
  if (history.length <= 1) {
    // Nothing to undo — return oldest state unchanged
    return { state: history[0], history };
  }
  const newHistory = history.slice(0, -1);
  const prevState = newHistory[newHistory.length - 1];
  return { state: prevState, history: newHistory };
}

/**
 * Redo a previously undone move.
 *
 * @param redoStack - stack of states that were undone (most recent at end)
 * @param history - current history stack
 * @returns next state, updated history, updated redoStack
 */
export function redo(
  redoStack: GameState[],
  history: GameState[]
): { state: GameState; history: GameState[]; redoStack: GameState[] } {
  if (redoStack.length === 0) {
    // Nothing to redo
    const current = history[history.length - 1];
    return { state: current, history, redoStack };
  }
  const nextState = redoStack[redoStack.length - 1];
  const newRedoStack = redoStack.slice(0, -1);
  const newHistory = [...history, nextState];
  return { state: nextState, history: newHistory, redoStack: newRedoStack };
}
