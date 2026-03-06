import type { GameRecord } from './types';
import { loadHistory } from './storage';

interface HistoryScreenProps {
  onSelectGame: (record: GameRecord) => void;
  onBackToMenu: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getOpponentLabel(record: GameRecord): string {
  if (record.opponent === 'local') return 'Local';
  const diff = record.difficulty
    ? record.difficulty.charAt(0).toUpperCase() + record.difficulty.slice(1)
    : 'AI';
  return `AI (${diff})`;
}

function getResultLabel(record: GameRecord): string {
  const { result, humanRole } = record;
  if (result === 'draw-repetition' || result === 'draw-50moves') return 'Draw';
  // For local games, goat perspective by convention
  const isWin =
    (humanRole === 'goat' && result === 'goat-wins') ||
    (humanRole === 'tiger' && result === 'tiger-wins');
  return isWin ? 'Won' : 'Lost';
}

function getResultColor(label: string): string {
  switch (label) {
    case 'Won': return 'text-green-400';
    case 'Lost': return 'text-red-400';
    default: return 'text-yellow-400';
  }
}

export function HistoryScreen({ onSelectGame, onBackToMenu }: HistoryScreenProps) {
  const history = loadHistory();

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-lg flex items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="px-3 py-1 text-stone-400 hover:text-stone-200 text-sm transition-colors"
          data-testid="history-back-btn"
        >
          &larr; Menu
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold text-amber-400">
          Game History
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      {history.length === 0 ? (
        <p className="text-stone-400 mt-12">No games played yet</p>
      ) : (
        <div className="w-full max-w-lg flex flex-col gap-2">
          {history.map((record, i) => {
            const resultLabel = getResultLabel(record);
            return (
              <button
                key={record.id}
                data-testid={`history-entry-${i}`}
                onClick={() => onSelectGame(record)}
                className="w-full p-3 bg-stone-800 hover:bg-stone-700 rounded-lg text-left transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-stone-300 text-sm">
                    {formatDate(record.startedAt)}
                  </span>
                  <span className={`font-semibold ${getResultColor(resultLabel)}`}>
                    {resultLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-stone-400 text-sm">
                    {getOpponentLabel(record)}
                    {' \u00B7 '}
                    Played as {record.humanRole === 'tiger' ? 'Tiger' : 'Goat'}
                  </span>
                  <span className="text-stone-500 text-xs">
                    {formatDuration(record.duration)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
