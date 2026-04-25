import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, SETTINGS_KEY, normalizeThemeName } from '../theme/theme';
import type { ThemeName, PieceStyle, Settings } from '../theme/theme';
import { DICTIONARIES, normalizeLang, type Dictionary, type Lang } from '../i18n';

interface SettingsContextValue {
  theme: ThemeName;
  soundEnabled: boolean;
  pieceStyle: PieceStyle;
  lang: Lang;
  t: Dictionary;
  setTheme: (theme: ThemeName) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setPieceStyle: (style: PieceStyle) => void;
  setLang: (lang: Lang) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.theme === 'string' && typeof parsed.soundEnabled === 'boolean') {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          theme: normalizeThemeName(parsed.theme),
          lang: normalizeLang(parsed.lang),
        };
      }
    }
  } catch {
    // Invalid JSON or localStorage error -- fall back to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // QuotaExceededError or private browsing -- fail silently
  }
}

function applyThemeToDOM(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
}

function applyLangToDOM(lang: Lang): void {
  document.documentElement.lang = lang;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const loaded = loadSettings();
    applyThemeToDOM(loaded.theme);
    applyLangToDOM(loaded.lang);
    return loaded;
  });

  const setTheme = useCallback((theme: ThemeName) => {
    setSettings(prev => {
      const next = { ...prev, theme };
      persistSettings(next);
      applyThemeToDOM(theme);
      return next;
    });
  }, []);

  const setSoundEnabled = useCallback((soundEnabled: boolean) => {
    setSettings(prev => {
      const next = { ...prev, soundEnabled };
      persistSettings(next);
      return next;
    });
  }, []);

  const setPieceStyle = useCallback((pieceStyle: PieceStyle) => {
    setSettings(prev => {
      const next = { ...prev, pieceStyle };
      persistSettings(next);
      return next;
    });
  }, []);

  const setLang = useCallback((lang: Lang) => {
    setSettings(prev => {
      const next = { ...prev, lang };
      persistSettings(next);
      applyLangToDOM(lang);
      return next;
    });
  }, []);

  const value = useMemo<SettingsContextValue>(() => ({
    theme: settings.theme,
    soundEnabled: settings.soundEnabled,
    pieceStyle: settings.pieceStyle,
    lang: settings.lang,
    t: DICTIONARIES[settings.lang],
    setTheme,
    setSoundEnabled,
    setPieceStyle,
    setLang,
  }), [settings, setTheme, setSoundEnabled, setPieceStyle, setLang]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}

/**
 * Convenience hook returning just the active language dictionary.
 * Equivalent to `useSettings().t`.
 */
export function useT(): Dictionary {
  return useSettings().t;
}

export type { Settings };
