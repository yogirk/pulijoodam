interface GoatPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
}

export function GoatPiece({ x, y, isSelected }: GoatPieceProps) {
  return (
    <circle
      transform={`translate(${x}, ${y})`}
      r={9}
      fill="#d4a76a"
      stroke={isSelected ? '#f59e0b' : '#92400e'}
      strokeWidth={2}
      data-testid="goat-piece"
    />
  );
}
