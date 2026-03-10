export type ThemeName = 'traditional' | 'modern';
export type PieceStyle = 'classic' | 'character';

export interface Settings {
  theme: ThemeName;
  soundEnabled: boolean;
  pieceStyle: PieceStyle;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'traditional',
  soundEnabled: true,
  pieceStyle: 'character',
};

export const SETTINGS_KEY = 'pulijoodam_settings';
