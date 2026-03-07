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
    case 'Won': return 'var(--status-success)';
    case 'Lost': return 'var(--status-error)';
    default: return 'var(--status-warning)';
  }
}

export function HistoryScreen({ onSelectGame, onBackToMenu }: HistoryScreenProps) {
  const history = loadHistory();

  return (
    <div
      className="min-h-screen-safe flex flex-col items-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div className="w-full max-w-lg flex items-center mb-6">
        <button
          onClick={onBackToMenu}
          className="px-3 py-1 text-sm rounded-lg transition-colors min-h-[44px]"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          data-testid="history-back-btn"
        >
          &larr; Menu
        </button>
        <h1
          className="flex-1 text-center text-2xl font-bold"
          style={{ color: 'var(--accent)' }}
        >
          Game History
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      {history.length === 0 ? (
        <p className="mt-12" style={{ color: 'var(--text-secondary)' }}>No games played yet</p>
      ) : (
        <div className="w-full max-w-lg flex flex-col gap-2">
          {history.map((record, i) => {
            const resultLabel = getResultLabel(record);
            return (
              <button
                key={record.id}
                data-testid={`history-entry-${i}`}
                onClick={() => onSelectGame(record)}
                className="w-full p-3 rounded-lg text-left transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(record.startedAt)}
                  </span>
                  <span className="font-semibold" style={{ color: getResultColor(resultLabel) }}>
                    {resultLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {getOpponentLabel(record)}
                    {' \u00B7 '}
                    Played as {record.humanRole === 'tiger' ? 'Tiger' : 'Goat'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
