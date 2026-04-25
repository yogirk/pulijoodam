import type { Lang } from '../i18n';

export type ThemeName = 'light' | 'dark';
export type PieceStyle = 'stone' | 'heads';

export interface Settings {
  theme: ThemeName;
  soundEnabled: boolean;
  pieceStyle: PieceStyle;
  lang: Lang;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  soundEnabled: true,
  pieceStyle: 'stone',
  lang: 'en',
};

export const SETTINGS_KEY = 'pulijoodam_settings';

export function normalizeThemeName(value: unknown): ThemeName {
  if (value === 'dark') return 'dark';
  return 'light';
}

export function normalizePieceStyle(value: unknown): PieceStyle {
  if (value === 'heads') return 'heads';
  return 'stone';
}
