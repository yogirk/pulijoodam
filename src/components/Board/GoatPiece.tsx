import { memo } from 'react';

interface GoatPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
  isFading?: boolean;
  isPlacing?: boolean;
  isGlowing?: boolean;
  draggable?: boolean;
  isBeingDragged?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const GoatPiece = memo(function GoatPiece({
  x,
  y,
  isSelected,
  isFading,
  isPlacing,
  isGlowing,
  draggable,
  isBeingDragged,
  onPointerDown,
}: GoatPieceProps) {
  return (
    <g
      style={{
        pointerEvents: draggable ? 'auto' : 'none',
        touchAction: draggable ? 'none' : undefined,
      }}
      onPointerDown={onPointerDown}
    >
      <g
        style={{
          pointerEvents: 'none',
          transition: isBeingDragged
            ? 'none'
            : 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease-out',
          opacity: isFading ? 0 : 1,
          transform: isBeingDragged
            ? `translate(${x}px, ${y}px) scale(1.2)`
            : `translate(${x}px, ${y}px)`,
          filter: isBeingDragged
            ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))'
            : isGlowing
              ? 'drop-shadow(0 0 10px var(--goat-fill))'
              : 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))',
          animation: isPlacing
            ? 'goat-scale-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : isGlowing
              ? 'piece-glow 500ms ease-in-out'
              : undefined,
        }}
        data-testid="goat-piece"
      >
        {/* Selection Glow */}
        {isSelected && (
          <circle r={14} fill="var(--select-stroke)" opacity={0.3} className="animate-pulse" />
        )}
        {/* Outer Coin rim */}
        <circle r={11} fill="var(--goat-stroke)" />
        {/* Inner Coin face */}
        <circle r={8.5} fill="var(--goat-fill)" />
        {/* Top Highlight for 3D glassy edge */}
        <path d="M -7 -3 A 7.5 7.5 0 0 1 7 -3 A 8.5 8.5 0 0 0 -7 -3 Z" fill="rgba(255,255,255,0.4)" />

        {/* Color-blind inner marker: small filled dot */}
        <circle r={2.5} fill="var(--goat-stroke)" />
      </g>
    </g>
  );
});
