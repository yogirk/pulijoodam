import { useSettings } from '../../hooks/useSettings';

/* ──────────────────────────────────────────────────────────────────────
   Shared sizing for header toggles. Sized to fit comfortably inside a
   48-56px utility bar with breathing room.
   ────────────────────────────────────────────────────────────────────── */
const PILL_HEIGHT = 34;
const ICON_BTN_SIZE = 36;

/* ──────────────────────────────────────────────────────────────────────
   LanguageToggle — 2-button radio pill (EN / తె)
   ────────────────────────────────────────────────────────────────────── */
export function LanguageToggle() {
  const { lang, setLang, t } = useSettings();
  return (
    <div
      className="flex items-center"
      role="radiogroup"
      aria-label={t.settings.language}
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--rule-soft)',
        borderRadius: 999,
        padding: 2,
      }}
    >
      {(['en', 'te'] as const).map((id) => {
        const active = lang === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`lang-${id}`}
            onClick={() => setLang(id)}
            style={{
              background: active ? 'var(--ink)' : 'transparent',
              color: active ? 'var(--paper)' : 'var(--ink-mute)',
              border: 0,
              padding: '0 12px',
              height: PILL_HEIGHT - 4,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              fontFamily: id === 'te' ? 'var(--font-telugu)' : 'inherit',
            }}
          >
            {id === 'en' ? 'EN' : 'తె'}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   PiecesToggle — 2-button radio pill with mini stone / heads glyphs.
   ────────────────────────────────────────────────────────────────────── */
function StoneIcon() {
  return (
    <svg width="16" height="16" viewBox="-9 -9 18 18" aria-hidden="true">
      <circle r="7.5" fill="var(--tiger-stroke)" opacity={0.85} />
      <circle r="7" fill="var(--tiger-fill)" />
      <ellipse cx="-2.4" cy="-1.6" rx="0.9" ry="1.1" fill="var(--tiger-mark)" />
      <ellipse cx="2.4" cy="-1.6" rx="0.9" ry="1.1" fill="var(--tiger-mark)" />
      <path
        d="M -2 1.2 Q -2.6 3.6 0 4 Q 2.6 3.6 2 1.2 Q 1.2 0 0 0 Q -1.2 0 -2 1.2 Z"
        fill="var(--tiger-mark)"
      />
    </svg>
  );
}

function HeadsIcon() {
  return (
    <svg width="16" height="16" viewBox="-9 -9 18 18" aria-hidden="true">
      <path d="M -5.5 -3 L -4.5 -7 L -2.5 -4.5 Z" fill="var(--tiger-stroke)" />
      <path d="M 5.5 -3 L 4.5 -7 L 2.5 -4.5 Z" fill="var(--tiger-stroke)" />
      <path
        d="M -5.5 -2 Q -6 4 -3.5 5.5 Q 0 6.5 3.5 5.5 Q 6 4 5.5 -2 Q 3.5 -4.5 0 -4.5 Q -3.5 -4.5 -5.5 -2 Z"
        fill="var(--tiger-fill)"
        stroke="var(--tiger-stroke)"
        strokeWidth={0.8}
      />
      <ellipse cx="-2" cy="-0.5" rx="0.8" ry="0.7" fill="var(--tiger-stroke)" />
      <ellipse cx="2" cy="-0.5" rx="0.8" ry="0.7" fill="var(--tiger-stroke)" />
    </svg>
  );
}

export function PiecesToggle() {
  const { pieceStyle, setPieceStyle, t } = useSettings();
  const items = [
    { id: 'stone' as const, icon: <StoneIcon />, label: t.settings.pieceStone },
    { id: 'heads' as const, icon: <HeadsIcon />, label: t.settings.pieceHeads },
  ];
  return (
    <div
      className="flex items-center"
      role="radiogroup"
      aria-label={t.settings.pieces}
      style={{
        background: 'var(--paper)',
        border: '1px solid var(--rule-soft)',
        borderRadius: 999,
        padding: 2,
        gap: 1,
      }}
    >
      {items.map((it) => {
        const active = pieceStyle === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={it.label}
            data-testid={`pieces-${it.id}`}
            onClick={() => setPieceStyle(it.id)}
            style={{
              background: active ? 'var(--ochre-soft)' : 'transparent',
              border: 0,
              padding: '0 8px',
              height: PILL_HEIGHT - 4,
              minWidth: 32,
              borderRadius: 999,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: active ? 1 : 0.55,
              transition: 'opacity 140ms ease, background-color 140ms ease',
            }}
            title={it.label}
          >
            {it.icon}
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   ThemeToggle — single sun/moon button.
   ────────────────────────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme, t } = useSettings();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      data-testid="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t.settings.themeLight : t.settings.themeDark}
      title={isDark ? t.settings.themeLight : t.settings.themeDark}
      style={{
        width: ICON_BTN_SIZE,
        height: ICON_BTN_SIZE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 0,
        color: 'var(--ink-mute)',
        cursor: 'pointer',
        borderRadius: 8,
      }}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   SoundToggle — speaker on/off button.
   ────────────────────────────────────────────────────────────────────── */
function SpeakerOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

export function SoundToggle() {
  const { soundEnabled, setSoundEnabled, t } = useSettings();
  return (
    <button
      type="button"
      data-testid="sound-toggle"
      onClick={() => setSoundEnabled(!soundEnabled)}
      aria-label={soundEnabled ? t.settings.soundOff : t.settings.soundOn}
      aria-pressed={soundEnabled}
      title={soundEnabled ? t.settings.soundOff : t.settings.soundOn}
      style={{
        width: ICON_BTN_SIZE,
        height: ICON_BTN_SIZE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 0,
        color: soundEnabled ? 'var(--ink-mute)' : 'var(--ink-faint)',
        cursor: 'pointer',
        borderRadius: 8,
      }}
    >
      {soundEnabled ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
    </button>
  );
}
