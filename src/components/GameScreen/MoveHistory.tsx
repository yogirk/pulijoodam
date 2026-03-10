import { useRef, useEffect } from 'react';
import type { Move } from '../../engine/types';
import { nodeToName } from '../../notation';

const CAPTURE_SYMBOL = '\u00D7'; // ×

interface MoveToken {
  num: number;
  goat: string;
  tiger: string | null;
}

/** Build structured move pairs from a flat move list. */
function buildMoveTokens(moves: Move[]): MoveToken[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < moves.length) {
    const move = moves[i];

    if (move.type === 'CAPTURE') {
      let chain = nodeToName(move.from) + CAPTURE_SYMBOL + nodeToName(move.to);
      let lastTo = move.to;
      i++;
      while (i < moves.length) {
        const next = moves[i];
        if (next.type === 'CAPTURE' && next.from === lastTo) {
          chain += CAPTURE_SYMBOL + nodeToName(next.to);
          lastTo = next.to;
          i++;
        } else if (next.type === 'END_CHAIN') {
          i++;
          break;
        } else {
          break;
        }
      }
      tokens.push(chain);
    } else if (move.type === 'END_CHAIN') {
      i++;
    } else if (move.type === 'PLACE') {
      tokens.push(nodeToName(move.to));
      i++;
    } else {
      tokens.push(`${nodeToName(move.from)}-${nodeToName(move.to)}`);
      i++;
    }
  }

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const tokens = buildMoveTokens(moveHistory);

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
          style={{ backgroundColor: t.num % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
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
