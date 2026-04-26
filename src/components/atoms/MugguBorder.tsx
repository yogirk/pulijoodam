interface MugguBorderProps {
  side: 'left' | 'right';
  /** Strip width in pixels (default 32). */
  width?: number;
  /** Tile height — one lotus per tile (default 120). */
  tileHeight?: number;
  /** Stroke width in px (default 1). */
  strokeWidth?: number;
  /** Opacity 0–1 (default 0.45). */
  opacity?: number;
}

/**
 * Vertical lotus-vine muggu border. A central hairline vine with a
 * five-petal lotus medallion every tile, repeating top to bottom.
 *
 * Andhra muggulu are drawn at thresholds with rice flour at sunrise to
 * mark a sanctified entry. Pinned to the viewport edges, this becomes
 * the page's framing — the user is inside the temple. Hidden below md
 * where horizontal space is scarce. Pointer-transparent and aria-hidden
 * so it never interferes with interaction or assistive tech.
 */
export function MugguBorder({
  side,
  width = 32,
  tileHeight = 120,
  strokeWidth = 1,
  opacity = 0.45,
}: MugguBorderProps) {
  const cx = width / 2;
  const cy = tileHeight / 2;
  const r = Math.min(width * 0.35, 9);
  const petalPath = `M 0 0 Q ${(r * 0.45).toFixed(2)} ${(-r * 0.55).toFixed(2)} 0 ${-r} Q ${(-r * 0.45).toFixed(2)} ${(-r * 0.55).toFixed(2)} 0 0 Z`;
  const patternId = `muggu-lotus-${side}`;

  return (
    <svg
      aria-hidden="true"
      className="muggu-strip"
      data-side={side}
      style={{
        position: 'fixed',
        top: 0,
        [side]: 0,
        width,
        height: '100dvh',
        pointerEvents: 'none',
        zIndex: 5,
        display: 'block',
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={patternId}
          x={0}
          y={0}
          width={width}
          height={tileHeight}
          patternUnits="userSpaceOnUse"
        >
          <g
            stroke="var(--rule)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={opacity}
          >
            {/* Vine — top half, stopping above the lotus */}
            <line x1={cx} y1={0} x2={cx} y2={cy - r - 1} />
            {/* Vine — bottom half, resuming below the lotus */}
            <line x1={cx} y1={cy + r + 1} x2={cx} y2={tileHeight} />
            {/* Lotus medallion: 5 petals + centre dot */}
            <g transform={`translate(${cx}, ${cy})`}>
              {[0, 72, 144, 216, 288].map((rot) => (
                <path key={rot} d={petalPath} transform={`rotate(${rot})`} />
              ))}
              <circle r={1.1} fill="var(--rule)" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
