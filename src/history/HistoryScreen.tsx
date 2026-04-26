import type { GameRecord } from './types';
import { loadHistory } from './storage';
import { useT } from '../hooks/useSettings';
import { Eyebrow } from '../components/atoms/Eyebrow';
import { CornerOrnament } from '../components/atoms/CornerOrnament';

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
  const isWin =
    (humanRole === 'goat' && result === 'goat-wins') ||
    (humanRole === 'tiger' && result === 'tiger-wins');
  return isWin ? 'Won' : 'Lost';
}

function getResultColor(label: string): string {
  switch (label) {
    case 'Won': return 'var(--jade)';
    case 'Lost': return 'var(--kumkum)';
    default: return 'var(--ink-mute)';
  }
}

export function HistoryScreen({ onSelectGame, onBackToMenu }: HistoryScreenProps) {
  const t = useT();
  const history = loadHistory();
  const isEmpty = history.length === 0;

  return (
    <div
      className="min-h-screen-safe stone-bg flex flex-col items-center"
      style={{
        backgroundColor: 'var(--paper)',
        color: 'var(--ink)',
        padding: '32px 16px 64px',
      }}
    >
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center" style={{ marginBottom: 32 }}>
        <button
          onClick={onBackToMenu}
          className="btn btn-quiet"
          style={{ padding: '10px 14px', fontSize: 13 }}
          data-testid="history-back-btn"
        >
          ← {t.common.back}
        </button>
        <div className="flex-1" />
      </div>

      {/* Title block */}
      <div
        className="w-full max-w-2xl text-center relative"
        style={{ marginBottom: 40 }}
      >
        <Eyebrow>{t.app.eyebrow}</Eyebrow>
        <h1
          className="t-display"
          style={{
            fontSize: 'clamp(32px, 4vw, 44px)',
            margin: '12px 0 0',
            color: 'var(--ink)',
          }}
        >
          {t.history.title}
        </h1>
        <p
          className="t-display-italic"
          style={{
            fontSize: 16,
            color: 'var(--ink-soft)',
            marginTop: 8,
            maxWidth: 520,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5,
          }}
        >
          {t.history.notationHint}
        </p>
      </div>

      <hr className="rule-h" style={{ width: '100%', maxWidth: 640, marginBottom: 32 }} />

      {/* Content */}
      {isEmpty ? (
        <EmptyState onStart={onBackToMenu} />
      ) : (
        <div
          className="w-full flex flex-col"
          style={{ maxWidth: 640, gap: 8 }}
        >
          {history.map((record, i) => {
            const resultLabel = getResultLabel(record);
            return (
              <button
                key={record.id}
                data-testid={`history-entry-${i}`}
                onClick={() => onSelectGame(record)}
                className="card text-left transition-colors"
                style={{
                  padding: '14px 16px',
                  background: 'var(--paper-2)',
                  borderColor: 'var(--rule-soft)',
                  cursor: 'pointer',
                  minHeight: 60,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ochre)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--rule-soft)'; }}
              >
                <div className="flex justify-between items-baseline">
                  <span
                    className="t-display"
                    style={{ fontSize: 16, color: 'var(--ink)' }}
                  >
                    {formatDate(record.startedAt)}
                  </span>
                  <span
                    className="t-eyebrow"
                    style={{ color: getResultColor(resultLabel), letterSpacing: '0.18em' }}
                  >
                    {resultLabel}
                  </span>
                </div>
                <div
                  className="flex justify-between items-center"
                  style={{ marginTop: 6, fontSize: 13 }}
                >
                  <span style={{ color: 'var(--ink-soft)' }}>
                    {getOpponentLabel(record)}
                    {' · '}
                    Played as {record.humanRole === 'tiger' ? t.common.tigers : t.common.goats}
                  </span>
                  <span
                    className="t-mono-ui"
                    style={{ color: 'var(--ink-mute)', fontSize: 12 }}
                  >
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

function EmptyState({ onStart }: { onStart: () => void }) {
  const t = useT();
  return (
    <div
      className="card-elev stone-texture relative w-full text-center"
      style={{
        maxWidth: 540,
        padding: '56px 32px',
      }}
    >
      <div style={{ position: 'absolute', top: 14, left: 14 }}>
        <CornerOrnament size={22} corner="tl" />
      </div>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <CornerOrnament size={22} corner="tr" />
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
        <CornerOrnament size={22} corner="bl" />
      </div>
      <div style={{ position: 'absolute', bottom: 14, right: 14 }}>
        <CornerOrnament size={22} corner="br" />
      </div>

      <p
        className="t-display"
        style={{
          fontSize: 24,
          color: 'var(--ink)',
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {t.history.empty}
      </p>
      <p
        className="t-display-italic"
        style={{
          fontSize: 16,
          color: 'var(--ink-soft)',
          marginTop: 10,
          marginBottom: 28,
          maxWidth: 380,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.55,
        }}
      >
        {t.history.notationHint}
      </p>
      <button
        onClick={onStart}
        className="btn btn-primary"
        data-testid="history-empty-cta"
      >
        {t.history.emptyCta}
      </button>
    </div>
  );
}
