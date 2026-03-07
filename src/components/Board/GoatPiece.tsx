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
      <circle
        cx={x}
        cy={y}
        r={9}
        fill="var(--goat-fill)"
        stroke={isSelected ? 'var(--select-stroke)' : 'var(--goat-stroke)'}
        strokeWidth={2}
        style={{
          pointerEvents: 'none',
          transition: isBeingDragged
            ? 'none'
            : 'cx 350ms ease-in-out, cy 350ms ease-in-out, opacity 200ms ease-out',
          opacity: isFading ? 0 : 1,
          transform: isBeingDragged ? 'scale(1.2)' : undefined,
          transformOrigin: `${x}px ${y}px`,
          filter: isBeingDragged
            ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
            : isGlowing
              ? 'drop-shadow(0 0 6px var(--goat-fill))'
              : undefined,
          animation: isPlacing
            ? 'goat-scale-in 200ms ease-out'
            : isGlowing
              ? 'piece-glow 500ms ease-in-out'
              : undefined,
        }}
        data-testid="goat-piece"
      />
      {/* Color-blind inner marker: filled dot */}
      <circle
        cx={x}
        cy={y}
        r={3}
        fill="var(--goat-stroke)"
        style={{
          pointerEvents: 'none',
          opacity: isFading ? 0 : 1,
          transition: isBeingDragged
            ? 'none'
            : 'cx 350ms ease-in-out, cy 350ms ease-in-out, opacity 200ms ease-out',
        }}
      />
    </g>
  );
});
