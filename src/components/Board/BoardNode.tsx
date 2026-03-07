import { memo, useState } from 'react';
import type { Piece } from '../../engine/types';

interface BoardNodeProps {
  node: { id: number; x: number; y: number };
  piece?: Piece | null;
  isSelected: boolean;
  isLegalMove: boolean;
  onClick: () => void;
}

function buildAriaLabel(
  nodeId: number,
  piece: Piece | null | undefined,
  isSelected: boolean,
  isLegalMove: boolean,
): string {
  const parts: string[] = [`Node ${nodeId}`];

  if (piece) {
    parts.push(piece);
  } else {
    parts.push('empty');
  }

  if (isSelected) {
    parts.push('selected');
  }

  if (isLegalMove) {
    parts.push('legal move');
  }

  return parts.join(', ');
}

export const BoardNode = memo(function BoardNode({ node, piece, isSelected, isLegalMove, onClick }: BoardNodeProps) {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onFocus={(e) => setIsFocusVisible(e.target === e.currentTarget && !e.currentTarget.matches?.(':focus:not(:focus-visible)'))}
      onBlur={() => setIsFocusVisible(false)}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={buildAriaLabel(node.id, piece, isSelected, isLegalMove)}
      aria-pressed={isSelected}
    >
      {/* Keyboard focus ring (SVG outline fallback) */}
      {isFocusVisible && (
        <circle r={20} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.9} />
      )}
      {/* Visual node socket: Outer shadow/rim */}
      <circle r={10} fill="rgba(0,0,0,0.3)" transform="translate(0, 2)" />
      {/* Inner socket base */}
      <circle r={9} fill="var(--board-line)" opacity={0.5} />
      {/* Inner active/empty fill with subtle glow for legal moves */}
      <circle
        r={7}
        fill={isSelected ? 'var(--node-selected)' : isLegalMove ? 'rgba(0, 180, 160, 0.4)' : 'var(--node-fill)'}
        className={isLegalMove && !isSelected ? 'animate-pulse' : ''}
        style={{ transition: 'fill 300ms ease, opacity 300ms ease' }}
      />
      {/* Highlight ring for depth */}
      <circle r={6} fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />

      {/* MANDATORY 44x44 hit area -- MUST be last (top z-order) to capture clicks */}
      <rect
        x={-22}
        y={-22}
        width={44}
        height={44}
        fill="transparent"
        data-testid={`node-hitarea-${node.id}`}
      />
    </g>
  );
});
