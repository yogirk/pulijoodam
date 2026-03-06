// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryScreen } from './HistoryScreen';
import type { GameRecord } from './types';
import * as storage from './storage';

function makeRecord(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    id: 'rec-1',
    startedAt: '2026-03-07T10:00:00Z',
    lastPlayedAt: '2026-03-07T10:05:32Z',
    moveHistory: [{ type: 'PLACE' as const, to: 5 }],
    humanRole: 'goat',
    opponent: 'ai',
    difficulty: 'hard',
    result: 'tiger-wins',
    duration: 332,
    ...overrides,
  };
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    vi.spyOn(storage, 'loadHistory');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "No games played yet" when history is empty', () => {
    vi.mocked(storage.loadHistory).mockReturnValue([]);
    render(
      <HistoryScreen onSelectGame={() => {}} onBackToMenu={() => {}} />
    );
    expect(screen.getByText(/no games played yet/i)).toBeTruthy();
  });

  it('renders game entries with correct opponent and result', () => {
    vi.mocked(storage.loadHistory).mockReturnValue([
      makeRecord({ id: 'r1', opponent: 'ai', difficulty: 'hard', result: 'tiger-wins', humanRole: 'goat' }),
      makeRecord({ id: 'r2', opponent: 'local', result: 'goat-wins', humanRole: 'goat' }),
    ]);
    render(
      <HistoryScreen onSelectGame={() => {}} onBackToMenu={() => {}} />
    );
    // AI game with loss
    expect(screen.getByText(/AI \(Hard\)/)).toBeTruthy();
    expect(screen.getByText(/Lost/)).toBeTruthy();
    // Local game with win
    expect(screen.getByText(/Local/)).toBeTruthy();
    expect(screen.getByText(/Won/)).toBeTruthy();
  });

  it('clicking entry calls onSelectGame with correct record', () => {
    const record = makeRecord({ id: 'clickable-1' });
    vi.mocked(storage.loadHistory).mockReturnValue([record]);
    const onSelectGame = vi.fn();
    render(
      <HistoryScreen onSelectGame={onSelectGame} onBackToMenu={() => {}} />
    );
    // Click the game entry
    const entry = screen.getByTestId('history-entry-0');
    fireEvent.click(entry);
    expect(onSelectGame).toHaveBeenCalledWith(record);
  });
});
