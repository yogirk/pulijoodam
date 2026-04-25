import type { Lang } from '../i18n';

export type ThemeName = 'light' | 'dark';
export type PieceStyle = 'classic' | 'character';

export interface Settings {
  theme: ThemeName;
  soundEnabled: boolean;
  pieceStyle: PieceStyle;
  lang: Lang;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  soundEnabled: true,
  pieceStyle: 'character',
  lang: 'en',
};

export const SETTINGS_KEY = 'pulijoodam_settings';

export function normalizeThemeName(value: unknown): ThemeName {
  if (value === 'dark') return 'dark';
  return 'light';
}
