import type { GameStatus } from '../engine';
import type { SavedGame, GameRecord } from './types';
import {
  CURRENT_GAME_KEY,
  GAME_HISTORY_KEY,
  MAX_HISTORY,
} from './types';

// ─── Current game persistence ────────────────────────────────────────────────

export function saveCurrentGame(game: SavedGame): void {
  try {
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(game));
  } catch {
    // QuotaExceededError or other — fail silently
  }
}

export function loadCurrentGame(): SavedGame | null {
  try {
    const raw = localStorage.getItem(CURRENT_GAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedGame;
  } catch {
    return null;
  }
}

export function clearCurrentGame(): void {
  try {
    localStorage.removeItem(CURRENT_GAME_KEY);
  } catch {
    // fail silently
  }
}

// ─── Game history ────────────────────────────────────────────────────────────

export function saveToHistory(game: SavedGame, result: GameStatus): void {
  try {
    const existing = loadHistory();
    const startMs = new Date(game.startedAt).getTime();
    const endMs = new Date(game.lastPlayedAt).getTime();
    const duration = Math.round((endMs - startMs) / 1000);

    const record: GameRecord = {
      ...game,
      result,
      duration: Math.max(0, duration),
    };

    const updated = [record, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // QuotaExceededError or other — fail silently
  }
}

export function loadHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(GAME_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GameRecord[];
  } catch {
    return [];
  }
}
