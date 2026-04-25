import type { ReactNode } from 'react';
import type { Role } from '../../engine';
import { useT } from '../../hooks/useSettings';
import { PieceGlyph } from '../atoms/PieceGlyph';

interface Stat {
  label: string;
  value: string | number;
  /** Render the value in kumkum (capture warning). */
  warning?: boolean;
  testId?: string;
}

interface SidePanelProps {
  side: Role;
  /** When true, render a "YOUR TURN •" ribbon and a thicker accent border. */
  isTurn: boolean;
  /** When true, the panel labels itself "You". When false, "Opponent" or
   *  no label (local 2-player). When undefined → no relational label. */
  isYou?: boolean;
  stats: Stat[];
  /** Optional content slot (e.g., accordions for rules / move history). */
  children?: ReactNode;
  testId?: string;
}

export function SidePanel({ side, isTurn, isYou, stats, children, testId }: SidePanelProps) {
  const t = useT();
  const sideLabel = side === 'tiger' ? t.common.tigers : t.common.goats;
  const relationLabel = isYou === true
    ? t.common.you
    : isYou === false
      ? t.common.opponent
      : null;

  return (
    <aside
      className="card flex flex-col relative"
      data-testid={testId}
      aria-label={sideLabel}
      style={{
        padding: 20,
        borderColor: isTurn ? 'var(--ochre)' : 'var(--rule-soft)',
        boxShadow: isTurn
          ? '0 0 0 1px var(--ochre), var(--shadow-md)'
          : 'var(--shadow-sm)',
        transition: 'border-color 240ms ease, box-shadow 240ms ease',
      }}
    >
      {/* "YOUR TURN •" ribbon — appears at top-left when active */}
      {isTurn && (
        <div
          className="absolute"
          data-testid="turn-ribbon"
          style={{
            top: -10,
            left: 16,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: 999,
          }}
        >
          {t.turn.yours} •
        </div>
      )}

      {/* Identity row */}
      <div className="flex items-center gap-3 mb-4">
        <PieceGlyph type={side} size={36} />
        <div>
          <div className="t-display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>
            {sideLabel}
          </div>
          {relationLabel && (
            <div className="t-eyebrow" style={{ fontSize: 10, marginTop: 2 }}>
              {relationLabel}
            </div>
          )}
        </div>
      </div>

      <hr className="rule-h-solid" style={{ marginBottom: 16 }} />

      {/* Stats — large display number paired with a quiet eyebrow label */}
      <div className="flex flex-col gap-3.5">
        {stats.map(s => (
          <div key={s.label} className="flex items-baseline justify-between gap-3" data-testid={s.testId}>
            <span
              style={{
                fontSize: 12,
                color: 'var(--ink-mute)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.04em',
              }}
            >
              {s.label}
            </span>
            <span
              className="t-display"
              style={{
                fontSize: 28,
                lineHeight: 1,
                color: s.warning ? 'var(--kumkum)' : 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Optional accordion / extra content slot */}
      {children && (
        <div className="mt-5 flex flex-col gap-3" style={{ minHeight: 0 }}>
          {children}
        </div>
      )}
    </aside>
  );
}

interface RailDetailsProps {
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Disclosure pattern for rail accordions (Rules, Move history). Uses
 * native <details> for keyboard + AT support; styled with new tokens.
 */
export function RailDetails({ summary, defaultOpen = false, children }: RailDetailsProps) {
  return (
    <details
      open={defaultOpen}
      style={{
        borderTop: '1px solid var(--rule-soft)',
        paddingTop: 12,
      }}
    >
      <summary
        className="t-eyebrow flex items-center justify-between cursor-pointer"
        style={{ listStyle: 'none', userSelect: 'none', padding: '4px 0', minHeight: 32 }}
      >
        <span>{summary}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" style={{ transition: 'transform 200ms ease' }}>
          <path d="M 2 4 L 5 7 L 8 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
  );
}
