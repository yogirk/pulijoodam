import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from './theme';
import type { ThemeName, Settings } from './theme';

describe('theme constants', () => {
  it('DEFAULT_SETTINGS has traditional theme', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('traditional');
  });

  it('DEFAULT_SETTINGS has sound enabled', () => {
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
  });

  it('SETTINGS_KEY is the correct localStorage key', () => {
    expect(SETTINGS_KEY).toBe('pulijoodam_settings');
  });

  it('ThemeName type allows traditional and modern', () => {
    const t1: ThemeName = 'traditional';
    const t2: ThemeName = 'modern';
    expect(t1).toBe('traditional');
    expect(t2).toBe('modern');
  });

  it('Settings interface matches expected shape', () => {
    const s: Settings = { theme: 'modern', soundEnabled: false };
    expect(s).toEqual({ theme: 'modern', soundEnabled: false });
  });
});
