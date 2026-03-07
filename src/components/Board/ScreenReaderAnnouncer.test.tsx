// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScreenReaderAnnouncer } from './ScreenReaderAnnouncer';
import type { GameEvent, GameState } from '../../engine/types';
import { createGame } from '../../engine';

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame(), ...overrides };
}

describe('ScreenReaderAnnouncer', () => {
  it('GOAT_PLACED event produces announcement "Goat placed at position {N}"', () => {
    const events: GameEvent[] = [{ type: 'GOAT_PLACED', at: 5 }];
    const state = makeGameState({ currentTurn: 'tiger' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Goat placed at position 5');
  });

  it('PIECE_MOVED event produces announcement "{Piece} moved from position {from} to position {to}"', () => {
    const events: GameEvent[] = [
      { type: 'PIECE_MOVED', from: 3, to: 9, piece: 'tiger' },
    ];
    const state = makeGameState({ currentTurn: 'goat' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Tiger moved from position 3 to position 9');
  });

  it('GOAT_CAPTURED event produces announcement "Tiger captured goat at position {over}"', () => {
    const events: GameEvent[] = [
      { type: 'GOAT_CAPTURED', over: 8, landedAt: 14 },
    ];
    const state = makeGameState({ currentTurn: 'goat' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Tiger captured goat at position 8');
  });

  it('GAME_OVER tiger-wins produces announcement "Game over. Tigers win!"', () => {
    const events: GameEvent[] = [
      { type: 'GAME_OVER', status: 'tiger-wins' },
    ];
    const state = makeGameState();
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Game over. Tigers win!');
  });

  it('GAME_OVER goat-wins produces announcement "Game over. Goats win!"', () => {
    const events: GameEvent[] = [
      { type: 'GAME_OVER', status: 'goat-wins' },
    ];
    const state = makeGameState();
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Game over. Goats win!');
  });

  it('Multiple events in one batch join with ". " separator', () => {
    const events: GameEvent[] = [
      { type: 'GOAT_PLACED', at: 7 },
      { type: 'PHASE_CHANGED', newPhase: 'movement' },
    ];
    const state = makeGameState({ currentTurn: 'tiger' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    const text = el.textContent!;
    expect(text).toContain('Goat placed at position 7');
    expect(text).toContain('Movement phase begins');
    // Verify separator
    expect(text).toMatch(/position 7\. Movement/);
  });

  it('Announcer div has aria-live="polite" and aria-atomic="true"', () => {
    const state = makeGameState();
    render(<ScreenReaderAnnouncer lastEvents={[]} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
  });

  it('Announcer div has sr-only class (visually hidden)', () => {
    const state = makeGameState();
    render(<ScreenReaderAnnouncer lastEvents={[]} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('sr-only');
  });

  it('Includes turn announcement after move events', () => {
    const events: GameEvent[] = [
      { type: 'PIECE_MOVED', from: 0, to: 2, piece: 'tiger' },
    ];
    const state = makeGameState({ currentTurn: 'goat' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain("It is now goat's turn");
  });

  it('Does not include turn announcement for GAME_OVER events', () => {
    const events: GameEvent[] = [
      { type: 'GAME_OVER', status: 'tiger-wins' },
    ];
    const state = makeGameState({ currentTurn: 'goat' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).not.toContain('turn');
  });

  it('CHAIN_JUMP_AVAILABLE produces "Chain capture available"', () => {
    const events: GameEvent[] = [
      { type: 'CHAIN_JUMP_AVAILABLE', tigerAt: 10 },
    ];
    const state = makeGameState({ currentTurn: 'tiger' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Chain capture available');
  });

  it('CHAIN_JUMP_ENDED produces "Chain capture ended"', () => {
    const events: GameEvent[] = [
      { type: 'CHAIN_JUMP_ENDED', tigerAt: 10 },
    ];
    const state = makeGameState({ currentTurn: 'goat' });
    render(<ScreenReaderAnnouncer lastEvents={events} gameState={state} />);
    const el = screen.getByRole('status');
    expect(el.textContent).toContain('Chain capture ended');
  });
});
