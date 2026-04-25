import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, SETTINGS_KEY, normalizeThemeName } from '../theme/theme';
import type { ThemeName, PieceStyle, Settings } from '../theme/theme';

interface SettingsContextValue {
  theme: ThemeName;
  soundEnabled: boolean;
  pieceStyle: PieceStyle;
  setTheme: (theme: ThemeName) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setPieceStyle: (style: PieceStyle) => void;
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
          // Migrate legacy theme names (traditional/modern) → light default
          theme: normalizeThemeName(parsed.theme),
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const loaded = loadSettings();
    // Apply theme to DOM immediately on mount (synchronous with first render)
    applyThemeToDOM(loaded.theme);
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

  return (
    <SettingsContext.Provider value={{
      theme: settings.theme,
      soundEnabled: settings.soundEnabled,
      pieceStyle: settings.pieceStyle,
      setTheme,
      setSoundEnabled,
      setPieceStyle,
    }}>
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

export type { Settings };
