// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SettingsProvider } from '../hooks/useSettings';
import { ReplayScreen } from './ReplayScreen';
import type { GameRecord } from './types';
import type { Move } from '../engine';

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

// Build a small valid game sequence:
// Tigers start at [0, 3, 4]. Goat places first, then tiger moves.
const testMoves: Move[] = [
  { type: 'PLACE', to: 1 },                   // goat places at node 1
  { type: 'MOVE', from: 0, to: 2 },           // tiger at 0 moves to 2 (adj)
  { type: 'PLACE', to: 5 },                   // goat places at node 5
];

function makeReplayRecord(moves: Move[] = testMoves): GameRecord {
  return {
    id: 'replay-1',
    startedAt: '2026-03-07T10:00:00Z',
    lastPlayedAt: '2026-03-07T10:05:00Z',
    moveHistory: moves,
    humanRole: 'goat',
    opponent: 'ai',
    difficulty: 'medium',
    result: 'tiger-wins',
    duration: 300,
  };
}

describe('ReplayScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders board at initial state (moveIndex 0)', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    // Should show move counter at 0
    expect(screen.getByText(/move 0/i)).toBeTruthy();
  });

  it('step forward advances to next state', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    const nextBtn = screen.getByTestId('replay-next');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/move 1/i)).toBeTruthy();
  });

  it('step backward goes to previous state', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    const nextBtn = screen.getByTestId('replay-next');
    const prevBtn = screen.getByTestId('replay-prev');
    // Go forward then back
    fireEvent.click(nextBtn);
    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
    expect(screen.getByText(/move 1/i)).toBeTruthy();
  });

  it('scrubber sets moveIndex directly', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    const scrubber = screen.getByTestId('replay-scrubber') as HTMLInputElement;
    fireEvent.change(scrubber, { target: { value: '2' } });
    expect(screen.getByText(/move 2/i)).toBeTruthy();
  });

  it('auto-play increments moveIndex at 1s intervals', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    const playBtn = screen.getByTestId('replay-play');
    fireEvent.click(playBtn);

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/move 1/i)).toBeTruthy();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/move 2/i)).toBeTruthy();
  });

  it('auto-play stops at last move', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    const playBtn = screen.getByTestId('replay-play');
    fireEvent.click(playBtn);

    // Advance past all moves (3 moves, so 3 seconds should reach end)
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText(/move 3/i)).toBeTruthy();
    // Should not go beyond max
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText(/move 3/i)).toBeTruthy();
  });

  it('play/pause toggle works', () => {
    renderWithProviders(
      <ReplayScreen game={makeReplayRecord()} onBack={() => {}} />
    );
    const playBtn = screen.getByTestId('replay-play');
    // Start playing
    fireEvent.click(playBtn);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText(/move 1/i)).toBeTruthy();

    // Pause
    fireEvent.click(screen.getByTestId('replay-play'));
    act(() => { vi.advanceTimersByTime(3000); });
    // Should still be at move 1
    expect(screen.getByText(/move 1/i)).toBeTruthy();
  });
});
