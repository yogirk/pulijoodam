import { useSettings } from '../../hooks/useSettings';

type BrandSize = 'sm' | 'md' | 'lg';

interface BrandProps {
  size?: BrandSize;
  /** Render the italic subtitle below the wordmark. Only meaningful at md/lg. */
  showSubtitle?: boolean;
}

const ROMAN_SIZES: Record<BrandSize, { wordmark: number; subtitle: number }> = {
  sm: { wordmark: 22, subtitle: 12 },
  md: { wordmark: 40, subtitle: 16 },
  lg: { wordmark: 96, subtitle: 22 },
};

const TELUGU_SIZES: Record<BrandSize, { wordmark: number; subtitle: number }> = {
  sm: { wordmark: 20, subtitle: 12 },
  md: { wordmark: 36, subtitle: 16 },
  lg: { wordmark: 84, subtitle: 22 },
};

/**
 * "Pulijoodam" wordmark with EN/TE switching.
 *
 * EN: Cormorant Garamond regular "Puli" + italic ochre-deep "joodam".
 * TE: Noto Serif Telugu "పులిజూదం" — no split, single weight.
 *
 * The optional subtitle is rendered as italic display ("The Tiger–Goat Hunt"
 * in EN, "పులీ–మేకా వేట" in TE).
 */
export function Brand({ size = 'md', showSubtitle = false }: BrandProps) {
  const { lang, t } = useSettings();
  const sizes = lang === 'te' ? TELUGU_SIZES[size] : ROMAN_SIZES[size];
  const subtitle = showSubtitle ? (
    <div
      className={lang === 'te' ? 't-telugu' : 't-display-italic'}
      style={{
        fontSize: sizes.subtitle,
        color: 'var(--ink-soft)',
        marginTop: 6,
        lineHeight: 1.25,
      }}
    >
      {t.app.subtitle}
    </div>
  ) : null;

  if (lang === 'te') {
    return (
      <div>
        <div
          className="t-telugu"
          style={{
            fontSize: sizes.wordmark,
            fontWeight: 600,
            color: 'var(--ink)',
            lineHeight: 1.0,
          }}
        >
          {t.app.name}
        </div>
        {subtitle}
      </div>
    );
  }

  // EN — split "Puli" / "joodam" with italic ochre tail
  return (
    <div>
      <div
        className="t-display"
        style={{
          fontSize: sizes.wordmark,
          color: 'var(--ink)',
          lineHeight: 0.95,
          letterSpacing: '-0.01em',
        }}
      >
        Puli
        <span
          className="t-display-italic"
          style={{ color: 'var(--ochre-deep)', fontStyle: 'italic' }}
        >
          joodam
        </span>
      </div>
      {subtitle}
    </div>
  );
}
