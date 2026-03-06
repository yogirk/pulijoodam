export type ThemeName = 'traditional' | 'modern';

export interface Settings {
  theme: ThemeName;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'traditional',
  soundEnabled: true,
};

export const SETTINGS_KEY = 'pulijoodam_settings';
