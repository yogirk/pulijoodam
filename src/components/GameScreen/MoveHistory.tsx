import { useRef, useEffect, useMemo } from 'react';
import type { Move } from '../../engine/types';
import { movesToTurnTokens } from '../../notation';

interface MoveToken {
  num: number;
  goat: string;
  tiger: string | null;
}

function pairTokens(tokens: string[]): MoveToken[] {
  const pairs: MoveToken[] = [];
  for (let t = 0; t < tokens.length; t += 2) {
    pairs.push({
      num: Math.floor(t / 2) + 1,
      goat: tokens[t],
      tiger: t + 1 < tokens.length ? tokens[t + 1] : null,
    });
  }
  return pairs;
}

const EVEN_ROW_STYLE = { backgroundColor: 'rgba(255,255,255,0.02)' };
const ODD_ROW_STYLE = { backgroundColor: 'transparent' };

interface MoveHistoryProps {
  moveHistory: Move[];
}

export function MoveHistory({ moveHistory }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tokens = useMemo(() => pairTokens(movesToTurnTokens(moveHistory)), [moveHistory]);

  // Auto-scroll to bottom on new moves
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [tokens.length]);

  if (tokens.length === 0) {
    return (
      <p
        className="text-xs text-center opacity-50 italic mt-8"
        style={{ color: 'var(--text-secondary)' }}
      >
        No moves yet
      </p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-px overflow-y-auto scrollbar-hide max-h-full"
    >
      {tokens.map((t) => (
        <div
          key={t.num}
          className="flex items-center gap-2 px-2 py-1 rounded text-sm font-mono"
          style={t.num % 2 === 0 ? EVEN_ROW_STYLE : ODD_ROW_STYLE}
        >
          <span
            className="w-6 text-right text-xs shrink-0"
            style={{ color: 'var(--text-secondary)', opacity: 0.5 }}
          >
            {t.num}.
          </span>
          <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
            {t.goat}
          </span>
          <span
            className="flex-1 truncate"
            style={{ color: t.tiger ? 'var(--text-primary)' : 'transparent' }}
          >
            {t.tiger ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}
