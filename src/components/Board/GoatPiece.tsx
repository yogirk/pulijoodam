import { memo } from 'react';
import { useSettings } from '../../hooks/useSettings';

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

/** Classic circular coin shape */
function ClassicGoat() {
  return (
    <>
      <circle r={11} fill="var(--goat-stroke)" />
      <circle r={8.5} fill="var(--goat-fill)" />
      <path d="M -7 -3 A 7.5 7.5 0 0 1 7 -3 A 8.5 8.5 0 0 0 -7 -3 Z" fill="rgba(255,255,255,0.4)" />
      <circle r={2.5} fill="var(--goat-stroke)" />
    </>
  );
}

/** Style D: Rounded goat face with horns, ears, eyes, snout, and mouth */
function CharacterGoat() {
  return (
    <g transform="translate(0,1)">
      {/* Horns */}
      <path d="M-5,-9 Q-8,-15 -10,-14" stroke="var(--goat-stroke)" strokeWidth={2} fill="none" strokeLinecap="round" />
      <path d="M5,-9 Q8,-15 10,-14" stroke="var(--goat-stroke)" strokeWidth={2} fill="none" strokeLinecap="round" />
      {/* Round head */}
      <ellipse cx={0} cy={0} rx={10} ry={11} fill="var(--goat-fill)" stroke="var(--goat-stroke)" strokeWidth={1.2} />
      {/* Ears */}
      <ellipse cx={-10} cy={-2} rx={4} ry={2} transform="rotate(-15, -10, -2)" fill="var(--goat-fill)" stroke="var(--goat-stroke)" strokeWidth={0.8} />
      <ellipse cx={10} cy={-2} rx={4} ry={2} transform="rotate(15, 10, -2)" fill="var(--goat-fill)" stroke="var(--goat-stroke)" strokeWidth={0.8} />
      {/* Eyes with horizontal pupils (like real goats) */}
      <ellipse cx={-3.5} cy={-2} rx={2} ry={1.8} fill="var(--bg-primary, #111827)" />
      <ellipse cx={-3.5} cy={-2} rx={1.5} ry={0.6} fill="var(--goat-fill)" />
      <ellipse cx={3.5} cy={-2} rx={2} ry={1.8} fill="var(--bg-primary, #111827)" />
      <ellipse cx={3.5} cy={-2} rx={1.5} ry={0.6} fill="var(--goat-fill)" />
      {/* Snout */}
      <ellipse cx={0} cy={5} rx={4} ry={3} fill="var(--goat-stroke)" opacity={0.3} stroke="var(--goat-stroke)" strokeWidth={0.6} />
      {/* Nostrils */}
      <ellipse cx={-1.5} cy={5.5} rx={0.8} ry={0.6} fill="var(--goat-stroke)" />
      <ellipse cx={1.5} cy={5.5} rx={0.8} ry={0.6} fill="var(--goat-stroke)" />
      {/* Mouth */}
      <path d="M-2,7.5 Q0,9 2,7.5" stroke="var(--goat-stroke)" strokeWidth={0.6} fill="none" strokeLinecap="round" />
    </g>
  );
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
  const { pieceStyle } = useSettings();

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
        {pieceStyle === 'character' ? <CharacterGoat /> : <ClassicGoat />}
      </g>
    </g>
  );
});
