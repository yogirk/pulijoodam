import { useEffect, useRef, useState } from 'react';
import type { GameState, GameStatus, Move, Role } from '../engine';
import { createGame, applyMove } from '../engine';
import type { AIDifficulty } from '../engine/ai/types';
import type { SavedGame } from './types';
import {
  saveCurrentGame,
  loadCurrentGame,
  clearCurrentGame,
  saveToHistory,
} from './storage';

// ─── Auto-save hook ─────────────────────────────────────────────────────────

interface AutoSaveMeta {
  humanRole: Role;
  opponent: 'ai' | 'local';
  difficulty?: AIDifficulty;
}

/**
 * Auto-saves the current game to localStorage on every gameState change.
 * On game completion, saves to history and clears the current game.
 */
export function useAutoSave(
  gameState: GameState,
  status: GameStatus,
  meta: AutoSaveMeta
): void {
  const gameIdRef = useRef<string>(Date.now().toString(36));
  const startedAtRef = useRef<string>(new Date().toISOString());
  const prevStatusRef = useRef<GameStatus>('ongoing');

  // Reset game ID on new game (detected by moveHistory going back to empty)
  useEffect(() => {
    if (gameState.moveHistory.length === 0) {
      gameIdRef.current = Date.now().toString(36);
      startedAtRef.current = new Date().toISOString();
      prevStatusRef.current = 'ongoing';
    }
  }, [gameState.moveHistory.length]);

  // Auto-save on every state change
  useEffect(() => {
    const saved: SavedGame = {
      id: gameIdRef.current,
      startedAt: startedAtRef.current,
      lastPlayedAt: new Date().toISOString(),
      moveHistory: gameState.moveHistory,
      humanRole: meta.humanRole,
      opponent: meta.opponent,
      difficulty: meta.difficulty,
    };

    if (status === 'ongoing') {
      saveCurrentGame(saved);
    } else if (prevStatusRef.current === 'ongoing') {
      // Game just ended — save to history and clear current
      saveToHistory(saved, status);
      clearCurrentGame();
      prevStatusRef.current = status;
    }
  }, [gameState, status, meta.humanRole, meta.opponent, meta.difficulty]);
}

// ─── Game resume hook ────────────────────────────────────────────────────────

/**
 * Reconstructs a GameState by replaying a move history through the engine.
 */
export function replayMoves(moves: Move[]): GameState {
  let state = createGame();
  for (const move of moves) {
    const result = applyMove(state, move);
    if (!result.error) {
      state = result.state;
    }
  }
  return state;
}

/**
 * On mount, checks localStorage for a saved game and returns it if present.
 */
export function useGameResume(): {
  savedGame: SavedGame | null;
  clearSavedGame: () => void;
} {
  const [savedGame, setSavedGame] = useState<SavedGame | null>(() => {
    return loadCurrentGame();
  });

  const clearSavedGame = () => {
    clearCurrentGame();
    setSavedGame(null);
  };

  return { savedGame, clearSavedGame };
}
