import { memo, useState } from 'react';
import type { Piece } from '../../engine/types';

interface BoardNodeProps {
  node: { id: number; label: string; x: number; y: number };
  piece?: Piece | null;
  isSelected: boolean;
  isLegalMove: boolean;
  onClick: () => void;
}

function buildAriaLabel(
  label: string,
  piece: Piece | null | undefined,
  isSelected: boolean,
  isLegalMove: boolean,
): string {
  const parts: string[] = [label];
  parts.push(piece ?? 'empty');
  if (isSelected) parts.push('selected');
  if (isLegalMove) parts.push('legal move');
  return parts.join(', ');
}

/**
 * Visual + a11y wrapper for a single intersection.
 *
 * Hit-testing is NOT done here. The SVG-level pointer handler in `useDrag`
 * resolves taps to the nearest node by Voronoi/Euclidean distance, so this
 * `<g>` is intentionally pointer-transparent. Keyboard activation still
 * works: tabbing focuses the `<g>`; Enter/Space invokes `onClick`.
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
      aria-label={buildAriaLabel(node.label, piece, isSelected, isLegalMove)}
      aria-pressed={isSelected}
      style={{ outline: 'none', pointerEvents: 'none' }}
    >
      {/* Keyboard focus ring — ochre dashed circle */}
      {isFocusVisible && (
        <circle
          r={18}
          fill="none"
          stroke="var(--ochre)"
          strokeWidth={1.4}
          strokeDasharray="2 3"
          opacity={0.9}
        />
      )}

      {/* Legal-move halo — jade soft fill + dashed jade ring (under socket) */}
      {isLegalMove && !isSelected && (
        <>
          <circle r={14} fill="var(--jade-soft)" />
          <circle
            r={14}
            fill="none"
            stroke="var(--jade)"
            strokeWidth={1.2}
            strokeDasharray="2 3"
            opacity={0.85}
          />
        </>
      )}

      {/* Selected ring — ochre dashed (drawn behind socket so the piece reads on top) */}
      {isSelected && (
        <circle
          r={20}
          fill="none"
          stroke="var(--ochre)"
          strokeWidth={1.4}
          strokeDasharray="2 3"
          opacity={0.95}
        />
      )}

      {/* Carved divot — paper-3 socket with rule outline + small ink dot */}
      <circle
        r={4.5}
        fill="var(--paper-3)"
        stroke="var(--rule)"
        strokeWidth={0.7}
        opacity={0.85}
      />
      <circle r={1.6} fill="var(--rule)" opacity={0.55} />
    </g>
  );
});
