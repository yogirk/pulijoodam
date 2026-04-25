import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY, normalizeThemeName, normalizePieceStyle } from './theme';
import type { ThemeName, Settings } from './theme';

describe('theme constants', () => {
  it('DEFAULT_SETTINGS has light theme', () => {
    expect(DEFAULT_SETTINGS.theme).toBe('light');
  });

  it('DEFAULT_SETTINGS has sound enabled', () => {
    expect(DEFAULT_SETTINGS.soundEnabled).toBe(true);
  });

  it('SETTINGS_KEY is the correct localStorage key', () => {
    expect(SETTINGS_KEY).toBe('pulijoodam_settings');
  });

  it('ThemeName type allows light and dark', () => {
    const t1: ThemeName = 'light';
    const t2: ThemeName = 'dark';
    expect(t1).toBe('light');
    expect(t2).toBe('dark');
  });

  it('Settings interface matches expected shape', () => {
    const s: Settings = { theme: 'dark', soundEnabled: false, pieceStyle: 'heads', lang: 'en' };
    expect(s).toEqual({ theme: 'dark', soundEnabled: false, pieceStyle: 'heads', lang: 'en' });
  });

  it('DEFAULT_SETTINGS has stone piece style', () => {
    expect(DEFAULT_SETTINGS.pieceStyle).toBe('stone');
  });

  it('DEFAULT_SETTINGS has English language', () => {
    expect(DEFAULT_SETTINGS.lang).toBe('en');
  });

  describe('normalizeThemeName', () => {
    it('passes through "dark"', () => {
      expect(normalizeThemeName('dark')).toBe('dark');
    });
    it('passes through "light"', () => {
      expect(normalizeThemeName('light')).toBe('light');
    });
    it('migrates legacy "traditional" to light', () => {
      expect(normalizeThemeName('traditional')).toBe('light');
    });
    it('migrates legacy "modern" to light', () => {
      expect(normalizeThemeName('modern')).toBe('light');
    });
    it('falls back unknown values to light', () => {
      expect(normalizeThemeName('cyberpunk')).toBe('light');
      expect(normalizeThemeName(undefined)).toBe('light');
      expect(normalizeThemeName(null)).toBe('light');
    });
  });

  describe('normalizePieceStyle', () => {
    it('passes through "stone"', () => {
      expect(normalizePieceStyle('stone')).toBe('stone');
    });
    it('passes through "heads"', () => {
      expect(normalizePieceStyle('heads')).toBe('heads');
    });
    it('migrates legacy "classic" to stone', () => {
      expect(normalizePieceStyle('classic')).toBe('stone');
    });
    it('migrates legacy "character" to stone', () => {
      expect(normalizePieceStyle('character')).toBe('stone');
    });
    it('falls back unknown values to stone', () => {
      expect(normalizePieceStyle(undefined)).toBe('stone');
      expect(normalizePieceStyle(null)).toBe('stone');
      expect(normalizePieceStyle(42)).toBe('stone');
    });
  });
});
