interface CornerOrnamentProps {
  size?: number;
  opacity?: number;
  /** Visual rotation: 'tl' (default), 'tr', 'bl', 'br'. */
  corner?: 'tl' | 'tr' | 'bl' | 'br';
}

const TRANSFORMS: Record<NonNullable<CornerOrnamentProps['corner']>, string> = {
  tl: '',
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

/**
 * Single-stroke temple-style corner motif. Used at corners of board cards,
 * overlays, and the setup brand row. One small ornament at a time, never
 * a full filigree frame.
 */
export function CornerOrnament({ size = 28, opacity = 0.55, corner = 'tl' }: CornerOrnamentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      style={{ opacity, display: 'block', transform: TRANSFORMS[corner] }}
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="var(--rule)" fill="none" strokeWidth="0.8" strokeLinecap="round">
        <path d="M 4 18 Q 4 4, 18 4" />
        <path d="M 8 18 Q 8 8, 18 8" opacity="0.5" />
        <circle cx="6" cy="6" r="1.2" fill="var(--rule)" />
        <circle cx="14" cy="14" r="0.8" fill="var(--rule)" />
      </g>
    </svg>
  );
}
