import { useRef, useEffect, useMemo } from 'react';
import type { Move } from '../../engine/types';
import { movesToTurnTokens } from '../../notation';
import { useT } from '../../hooks/useSettings';

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

interface MoveHistoryProps {
  moveHistory: Move[];
}

export function MoveHistory({ moveHistory }: MoveHistoryProps) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const tokens = useMemo(() => pairTokens(movesToTurnTokens(moveHistory)), [moveHistory]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [tokens.length]);

  if (tokens.length === 0) {
    return (
      <p
        className="t-caption text-center"
        style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 12 }}
      >
        {t.game.movesEmpty}
      </p>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col overflow-y-auto"
      style={{ maxHeight: 220 }}
    >
      {tokens.map((tok, idx) => (
        <div
          key={tok.num}
          className="flex items-center gap-2 px-1 py-1"
          style={{
            fontSize: 13,
            backgroundColor: idx % 2 === 0 ? 'transparent' : 'color-mix(in oklch, var(--paper-3) 30%, transparent)',
            borderRadius: 4,
          }}
        >
          <span
            className="t-mono-ui shrink-0 text-right"
            style={{ width: 22, color: 'var(--ink-faint)' }}
          >
            {tok.num}.
          </span>
          <span className="t-mono-ui flex-1 truncate" style={{ color: 'var(--ink)' }}>
            {tok.goat}
          </span>
          <span
            className="t-mono-ui flex-1 truncate"
            style={{ color: tok.tiger ? 'var(--ink)' : 'transparent' }}
          >
            {tok.tiger ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
}
