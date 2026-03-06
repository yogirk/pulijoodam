import type { GameStatus } from '../../engine';

interface GameOverOverlayProps {
  status: GameStatus;
  onNewGame: () => void;
}

function getResultText(status: GameStatus): string {
  switch (status) {
    case 'tiger-wins':
      return 'Tigers Win! 10 goats captured.';
    case 'goat-wins':
      return 'Goats Win! All tigers trapped.';
    case 'draw-repetition':
      return 'Draw — Threefold repetition.';
    case 'draw-50moves':
      return 'Draw — 50 captureless moves.';
    default:
      return '';
  }
}

export function GameOverOverlay({ status, onNewGame }: GameOverOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      data-testid="game-over-overlay"
    >
      <div
        className="rounded-xl p-8 text-center shadow-2xl max-w-sm w-full mx-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
        }}
      >
        <div className="text-2xl font-bold mb-4" data-testid="game-over-text">
          {getResultText(status)}
        </div>
        <button
          onClick={onNewGame}
          className="px-6 py-3 font-semibold rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-primary)',
          }}
          data-testid="new-game-button"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
