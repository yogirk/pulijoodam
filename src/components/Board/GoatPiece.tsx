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

/**
 * Carved Stone — premium default.
 * Goat disk is intentionally smaller than tiger (asymmetric hierarchy:
 * tiger looms, goat is one of many). Embossed mark is a single curved
 * horn crescent — iconic, not symmetric/decorative.
 */
function StoneGoat() {
  return (
    <>
      {/* Cast shadow */}
      <ellipse cx={0} cy={11} rx={8.5} ry={2} fill="rgba(0,0,0,0.18)" />
      {/* Outer rim */}
      <circle r={10.5} fill="var(--goat-stroke)" opacity={0.7} />
      {/* Main disk */}
      <circle r={9.8} fill="var(--goat-fill)" />
      {/* Top-left highlight */}
      <circle cx={-2} cy={-2} r={8} fill="#ffffff" opacity={0.18} />
      {/* Bottom-right inner shadow */}
      <circle cx={2} cy={2} r={8} fill="var(--goat-stroke)" opacity={0.10} />
      {/* Inner carved ring */}
      <circle r={7.8} fill="none" stroke="var(--goat-stroke)" strokeWidth={0.5} opacity={0.45} />
      {/* Embossed horn crescent + dot */}
      <path
        d="M -3.5 -3 Q -5 0 -3 3 Q 0 4.5 3 3 Q 5 0 3.5 -3"
        fill="none"
        stroke="var(--goat-mark)"
        strokeWidth={1.6}
        strokeLinecap="round"
        opacity={0.85}
      />
      <circle cx={0} cy={-1} r={0.9} fill="var(--goat-mark)" opacity={0.7} />
    </>
  );
}

/**
 * Animal Heads — geometric goat silhouette.
 * Rounded skull narrowing toward a snout, two curled horns sweeping
 * back, one dark slit eye, tiny nose dot.
 */
function HeadGoat() {
  return (
    <>
      {/* Cast shadow */}
      <ellipse cx={0} cy={11} rx={8} ry={1.8} fill="rgba(0,0,0,0.18)" />
      {/* Curled horns — sweep back over head */}
      <path
        d="M -5 -7 Q -9 -10 -10.5 -7 Q -10 -4 -8 -4"
        fill="none"
        stroke="var(--goat-stroke)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M  5 -7 Q  9 -10  10.5 -7 Q  10 -4  8 -4"
        fill="none"
        stroke="var(--goat-stroke)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      {/* Skull — rounded, narrows toward snout */}
      <path
        d="M -7 -5
           Q -8 4  -4 9
           Q  0 11  4 9
           Q  8 4   7 -5
           Q  4 -8  0 -8
           Q -4 -8 -7 -5 Z"
        fill="var(--goat-fill)"
        stroke="var(--goat-stroke)"
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Ears — small, side-flared */}
      <ellipse cx={-7.5} cy={-2.5} rx={2.6} ry={1.3} transform="rotate(-18, -7.5, -2.5)" fill="var(--goat-fill)" stroke="var(--goat-stroke)" strokeWidth={0.7} />
      <ellipse cx={ 7.5} cy={-2.5} rx={2.6} ry={1.3} transform="rotate( 18,  7.5, -2.5)" fill="var(--goat-fill)" stroke="var(--goat-stroke)" strokeWidth={0.7} />
      {/* Eye — single horizontal slit (goat anatomy) */}
      <ellipse cx={0} cy={-0.5} rx={2.4} ry={0.7} fill="var(--goat-mark)" />
      {/* Nose dot */}
      <ellipse cx={0} cy={6.5} rx={1.4} ry={0.9} fill="var(--goat-stroke)" opacity={0.85} />
    </>
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
            ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))'
            : isGlowing
              ? 'drop-shadow(0 0 10px var(--goat-fill))'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.22))',
          animation: isPlacing
            ? 'goat-scale-in 250ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : isGlowing
              ? 'piece-glow 500ms ease-in-out'
              : undefined,
        }}
        data-testid="goat-piece"
      >
        {/* Selection ring — static, dashed ochre */}
        {isSelected && (
          <circle
            r={14}
            fill="none"
            stroke="var(--select-stroke)"
            strokeWidth={1.5}
            strokeDasharray="2 3"
            opacity={0.85}
          />
        )}
        {pieceStyle === 'heads' ? <HeadGoat /> : <StoneGoat />}
      </g>
    </g>
  );
});
