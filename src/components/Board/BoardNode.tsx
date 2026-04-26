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

/**
 * Visual + a11y wrapper for a single intersection.
 *
 * Hit-testing is NOT done here. The SVG-level pointer handler in `useDrag`
 * resolves taps to the nearest node by Voronoi/Euclidean distance, so this
 * `<g>` is intentionally pointer-transparent (no overlapping rects, no
 * locked-out neighbors in dense rows). Keyboard activation still works:
 * tabbing focuses the `<g>`; Enter/Space invokes `onClick`.
 */
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
      onKeyDown={handleKeyDown}
      onFocus={(e) => setIsFocusVisible(e.target === e.currentTarget && !e.currentTarget.matches?.(':focus:not(:focus-visible)'))}
      onBlur={() => setIsFocusVisible(false)}
      tabIndex={0}
      role="button"
      aria-label={buildAriaLabel(node.id, piece, isSelected, isLegalMove)}
      aria-pressed={isSelected}
      style={{ outline: 'none', pointerEvents: 'none' }}
    >
      {/* Keyboard focus ring (SVG outline fallback) */}
      {isFocusVisible && (
        <circle r={20} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.9} />
      )}
      {/* Visual node socket: Bevel / indent edge */}
      <circle r={14} fill="rgba(255,255,255,0.03)" transform="translate(0, 1)" />
      <circle r={13} fill="rgba(0,0,0,0.5)" />

      {/* Deep pocket (inner shadow illusion) */}
      <circle r={11} fill="var(--bg-primary)" stroke="rgba(0,0,0,0.8)" strokeWidth={2} />

      {/* Inner active/empty fill with subtle glow for legal moves */}
      <circle
        r={8}
        fill={isSelected ? 'var(--node-selected)' : isLegalMove ? 'rgba(0, 180, 160, 0.6)' : 'rgba(0,0,0,0.4)'}
        className={isLegalMove && !isSelected ? 'animate-pulse' : ''}
        style={{ transition: 'fill 300ms ease, opacity 300ms ease' }}
      />
      {/* Inner Highlight for Depth */}
      <circle r={7} fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
    </g>
  );
});
