import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';

/** Gear icon SVG for settings button */
function GearIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" />
    </svg>
  );
}

interface SettingsDropdownProps {
  onStartTutorial?: () => void;
}

/**
 * Tiny two-item segmented control. Each item is a real <button> for
 * keyboard / a11y; the seg wraps them. Uses .seg / .seg-item primitives
 * from index.css.
 */
function Seg<T extends string>({
  testId,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  testId?: string;
  ariaLabel: string;
  options: { id: T; label: string; testId?: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={ariaLabel} data-testid={testId}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={o.testId}
            onClick={() => onChange(o.id)}
            className={`seg-item ${active ? 'is-active' : ''}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsDropdown({ onStartTutorial }: SettingsDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, soundEnabled, pieceStyle, lang, t, setTheme, setSoundEnabled, setPieceStyle, setLang } = useSettings();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        const trigger = dropdownRef.current?.querySelector<HTMLButtonElement>('[data-testid="settings-gear-btn"]');
        trigger?.focus();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative" data-testid="settings-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="rounded-lg flex items-center justify-center transition-colors"
        style={{
          color: 'var(--ink-mute)',
          width: 44,
          height: 44,
        }}
        aria-label={t.settings.title}
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="settings-gear-btn"
      >
        <GearIcon />
      </button>

      {isOpen && (
        <div
          className="card-elev absolute right-0 top-full mt-2 z-50"
          style={{ padding: 16, minWidth: 260, boxShadow: 'var(--shadow-lg)' }}
        >
          <Row label={t.settings.theme}>
            <Seg
              ariaLabel={t.settings.theme}
              testId="theme-seg"
              value={theme}
              onChange={setTheme}
              options={[
                { id: 'light', label: t.settings.themeLight, testId: 'theme-toggle-btn' },
                { id: 'dark', label: t.settings.themeDark },
              ]}
            />
          </Row>

          <Row label={t.settings.language}>
            <Seg
              ariaLabel={t.settings.language}
              testId="lang-seg"
              value={lang}
              onChange={setLang}
              options={[
                { id: 'en', label: t.settings.langEn, testId: 'lang-toggle-btn' },
                { id: 'te', label: t.settings.langTe },
              ]}
            />
          </Row>

          <Row label={t.settings.pieces}>
            <Seg
              ariaLabel={t.settings.pieces}
              testId="piece-style-seg"
              value={pieceStyle}
              onChange={setPieceStyle}
              options={[
                { id: 'stone', label: t.settings.pieceStone, testId: 'piece-style-toggle-btn' },
                { id: 'heads', label: t.settings.pieceHeads },
              ]}
            />
          </Row>

          <Row label={t.settings.sound} last={!onStartTutorial}>
            <Seg
              ariaLabel={t.settings.sound}
              testId="sound-seg"
              value={soundEnabled ? 'on' : 'off'}
              onChange={(v) => setSoundEnabled(v === 'on')}
              options={[
                { id: 'on', label: t.settings.soundOn, testId: 'sound-toggle-btn' },
                { id: 'off', label: t.settings.soundOff },
              ]}
            />
          </Row>

          {onStartTutorial && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--rule-soft)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onStartTutorial();
                }}
                className="btn btn-quiet w-full justify-start"
                style={{ padding: '8px 0', fontSize: 13 }}
                data-testid="tutorial-link-btn"
              >
                {t.settings.learnToPlay}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ marginBottom: last ? 0 : 12, gap: 12 }}
    >
      <span
        className="text-sm font-medium"
        style={{ color: 'var(--ink)' }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
