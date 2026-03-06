import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { SavedGame, GameRecord } from './types';
import {
  CURRENT_GAME_KEY,
  GAME_HISTORY_KEY,
  MAX_HISTORY,
} from './types';

function makeSavedGame(overrides: Partial<SavedGame> = {}): SavedGame {
  return {
    id: 'test-id-1',
    startedAt: '2026-03-07T10:00:00Z',
    lastPlayedAt: '2026-03-07T10:05:00Z',
    moveHistory: [{ type: 'PLACE', to: 5 }],
    humanRole: 'goat',
    opponent: 'ai',
    difficulty: 'medium',
    ...overrides,
  };
}

// Create a proper localStorage mock that works regardless of Node version
function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() { return store.size; },
    key: vi.fn((_index: number) => null),
  } as unknown as Storage;
}

describe('storage', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Dynamically import so it picks up the stubbed localStorage
  async function getStorage() {
    // Clear module cache to get fresh imports that use our mock
    const mod = await import('./storage');
    return mod;
  }

  describe('saveCurrentGame', () => {
    it('writes to the correct localStorage key', async () => {
      const { saveCurrentGame } = await getStorage();
      const game = makeSavedGame();
      saveCurrentGame(game);

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        CURRENT_GAME_KEY,
        JSON.stringify(game)
      );
      const stored = mockStorage.getItem(CURRENT_GAME_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(game);
    });
  });

  describe('loadCurrentGame', () => {
    it('returns null when no data stored', async () => {
      const { loadCurrentGame } = await getStorage();
      expect(loadCurrentGame()).toBeNull();
    });

    it('returns parsed SavedGame when valid data exists', async () => {
      const { loadCurrentGame } = await getStorage();
      const game = makeSavedGame();
      mockStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(game));

      const loaded = loadCurrentGame();
      expect(loaded).toEqual(game);
    });

    it('returns null on corrupt JSON', async () => {
      const { loadCurrentGame } = await getStorage();
      mockStorage.setItem(CURRENT_GAME_KEY, '{not valid json!!!');
      expect(loadCurrentGame()).toBeNull();
    });
  });

  describe('clearCurrentGame', () => {
    it('removes the key from localStorage', async () => {
      const { clearCurrentGame } = await getStorage();
      mockStorage.setItem(CURRENT_GAME_KEY, 'something');
      clearCurrentGame();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(CURRENT_GAME_KEY);
    });
  });

  describe('saveToHistory', () => {
    it('prepends a completed game to the history array', async () => {
      const { saveToHistory } = await getStorage();
      const game = makeSavedGame();
      saveToHistory(game, 'tiger-wins');

      const stored = mockStorage.getItem(GAME_HISTORY_KEY);
      const history = JSON.parse(stored!) as GameRecord[];
      expect(history).toHaveLength(1);
      expect(history[0].result).toBe('tiger-wins');
      expect(history[0].id).toBe('test-id-1');
      // Duration should be 300 seconds (5 minutes)
      expect(history[0].duration).toBe(300);
    });

    it('caps history at MAX_HISTORY entries', async () => {
      const { saveToHistory } = await getStorage();
      // Pre-populate with MAX_HISTORY entries
      const existing: GameRecord[] = Array.from({ length: MAX_HISTORY }, (_, i) => ({
        ...makeSavedGame({ id: `old-${i}` }),
        result: 'goat-wins' as const,
        duration: 100,
      }));
      mockStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(existing));

      // Add one more
      saveToHistory(makeSavedGame({ id: 'newest' }), 'tiger-wins');

      const stored = mockStorage.getItem(GAME_HISTORY_KEY);
      const history = JSON.parse(stored!) as GameRecord[];
      expect(history).toHaveLength(MAX_HISTORY);
      expect(history[0].id).toBe('newest');
      // Oldest entry should be dropped
      expect(history[MAX_HISTORY - 1].id).toBe(`old-${MAX_HISTORY - 2}`);
    });
  });

  describe('loadHistory', () => {
    it('returns empty array when no data stored', async () => {
      const { loadHistory } = await getStorage();
      expect(loadHistory()).toEqual([]);
    });

    it('returns empty array on corrupt JSON', async () => {
      const { loadHistory } = await getStorage();
      mockStorage.setItem(GAME_HISTORY_KEY, 'broken');
      expect(loadHistory()).toEqual([]);
    });

    it('returns parsed GameRecord array', async () => {
      const { loadHistory } = await getStorage();
      const records: GameRecord[] = [
        { ...makeSavedGame(), result: 'tiger-wins', duration: 300 },
      ];
      mockStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(records));
      expect(loadHistory()).toEqual(records);
    });
  });
});
