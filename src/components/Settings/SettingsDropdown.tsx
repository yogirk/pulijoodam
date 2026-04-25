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

export function SettingsDropdown({ onStartTutorial }: SettingsDropdownProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, soundEnabled, pieceStyle, lang, t, setTheme, setSoundEnabled, setPieceStyle, setLang } = useSettings();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
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
        // Return focus to the trigger button
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
        onClick={() => setIsOpen(o => !o)}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="settings-gear-btn"
      >
        <GearIcon />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg shadow-xl p-3 min-w-[180px] z-50"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid color-mix(in srgb, var(--text-secondary) 30%, transparent)',
          }}
        >
          {/* Theme toggle */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {t.settings.theme}
            </span>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="px-2 py-1 text-xs rounded font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-primary)',
              }}
              data-testid="theme-toggle-btn"
            >
              {theme === 'light' ? t.settings.themeLight : t.settings.themeDark}
            </button>
          </div>

          {/* Language toggle */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {t.settings.language}
            </span>
            <button
              onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
              className="px-2 py-1 text-xs rounded font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-primary)',
              }}
              data-testid="lang-toggle-btn"
            >
              {lang === 'en' ? t.settings.langEn : t.settings.langTe}
            </button>
          </div>

          {/* Pieces toggle */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {t.settings.pieces}
            </span>
            <button
              onClick={() => setPieceStyle(pieceStyle === 'stone' ? 'heads' : 'stone')}
              className="px-2 py-1 text-xs rounded font-medium transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--text-primary)',
              }}
              data-testid="piece-style-toggle-btn"
            >
              {pieceStyle === 'stone' ? t.settings.pieceStone : t.settings.pieceHeads}
            </button>
          </div>

          {/* Sound toggle */}
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {t.settings.sound}
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="px-2 py-1 text-xs rounded font-medium transition-colors"
              style={{
                backgroundColor: soundEnabled ? 'var(--accent)' : 'var(--bg-primary)',
                color: 'var(--text-primary)',
                border: soundEnabled ? 'none' : '1px solid var(--text-secondary)',
              }}
              data-testid="sound-toggle-btn"
            >
              {soundEnabled ? t.settings.soundOn : t.settings.soundOff}
            </button>
          </div>

          {/* Tutorial link */}
          {onStartTutorial && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid color-mix(in srgb, var(--text-secondary) 30%, transparent)' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onStartTutorial();
                }}
                className="text-sm font-medium transition-colors w-full text-left"
                style={{ color: 'var(--accent)' }}
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
