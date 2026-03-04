interface TigerPieceProps {
  x: number;
  y: number;
  isSelected: boolean;
}

export function TigerPiece({ x, y, isSelected }: TigerPieceProps) {
  return (
    <polygon
      transform={`translate(${x}, ${y}) rotate(45)`}
      points="-10,-10 10,-10 10,10 -10,10"
      fill="#dc2626"
      stroke={isSelected ? '#f59e0b' : '#991b1b'}
      strokeWidth={isSelected ? 3 : 1.5}
      data-testid="tiger-piece"
    />
  );
}
