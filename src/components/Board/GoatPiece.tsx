interface GoatPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
  isFading?: boolean;
  isPlacing?: boolean;
  isGlowing?: boolean;
}

export function GoatPiece({ x, y, isSelected, isFading, isPlacing, isGlowing }: GoatPieceProps) {
  return (
    <circle
      cx={x}
      cy={y}
      r={9}
      fill="var(--goat-fill)"
      stroke={isSelected ? 'var(--select-stroke)' : 'var(--goat-stroke)'}
      strokeWidth={2}
      style={{
        pointerEvents: 'none',
        transition: 'cx 350ms ease-in-out, cy 350ms ease-in-out, opacity 200ms ease-out',
        opacity: isFading ? 0 : 1,
        animation: isPlacing
          ? 'goat-scale-in 200ms ease-out'
          : isGlowing
            ? 'piece-glow 500ms ease-in-out'
            : undefined,
        filter: isGlowing ? 'drop-shadow(0 0 6px var(--goat-fill))' : undefined,
      }}
      data-testid="goat-piece"
    />
  );
}
