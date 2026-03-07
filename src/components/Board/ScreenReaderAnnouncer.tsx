import { useMemo } from 'react';
import type { GameEvent, GameState, GameStatus } from '../../engine/types';

interface ScreenReaderAnnouncerProps {
  lastEvents: GameEvent[];
  gameState: GameState;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusText(status: GameStatus): string {
  switch (status) {
    case 'tiger-wins':
      return 'Tigers win!';
    case 'goat-wins':
      return 'Goats win!';
    case 'draw-repetition':
      return 'Draw by repetition!';
    case 'draw-50moves':
      return 'Draw by 50-move rule!';
    default:
      return '';
  }
}

function eventToAnnouncement(event: GameEvent): string {
  switch (event.type) {
    case 'GOAT_PLACED':
      return `Goat placed at position ${event.at}`;
    case 'PIECE_MOVED':
      return `${capitalize(event.piece)} moved from position ${event.from} to position ${event.to}`;
    case 'GOAT_CAPTURED':
      return `Tiger captured goat at position ${event.over}`;
    case 'GAME_OVER':
      return `Game over. ${statusText(event.status)}`;
    case 'PHASE_CHANGED':
      return 'Movement phase begins';
    case 'CHAIN_JUMP_AVAILABLE':
      return 'Chain capture available';
    case 'CHAIN_JUMP_ENDED':
      return 'Chain capture ended';
    default:
      return '';
  }
}

export function ScreenReaderAnnouncer({ lastEvents, gameState }: ScreenReaderAnnouncerProps) {
  const announcement = useMemo(() => {
    if (lastEvents.length === 0) return '';

    const messages = lastEvents
      .map(eventToAnnouncement)
      .filter(msg => msg.length > 0);

    // Add turn announcement unless game ended
    const hasGameOver = lastEvents.some(e => e.type === 'GAME_OVER');
    if (!hasGameOver && messages.length > 0) {
      messages.push(`It is now ${gameState.currentTurn}'s turn`);
    }

    return messages.join('. ');
  }, [lastEvents, gameState.currentTurn]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
