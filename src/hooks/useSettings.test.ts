// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SettingsProvider, useSettings } from './useSettings.tsx';
import { SETTINGS_KEY } from '../theme/theme';
import type { Settings } from '../theme/theme';

// Provide a working localStorage mock (happy-dom's may be incomplete)
let store: Record<string, string> = {};
const lsMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  get length() { return Object.keys(store).length; },
  key: (_i: number): string | null => null,
};

beforeEach(() => {
  store = {};
  vi.stubGlobal('localStorage', lsMock);
  document.documentElement.dataset.theme = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SettingsProvider, null, children);
}

describe('useSettings', () => {
  describe('defaults', () => {
    it('returns light theme by default', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('light');
    });

    it('returns soundEnabled true by default', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('localStorage read', () => {
    it('reads saved theme from localStorage on mount', () => {
      const saved: Settings = { theme: 'dark', soundEnabled: false, pieceStyle: 'heads', lang: 'en' };
      lsMock.setItem(SETTINGS_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('dark');
      expect(result.current.soundEnabled).toBe(false);
    });

    it('migrates legacy "traditional" theme to light', () => {
      lsMock.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: 'traditional', soundEnabled: true, pieceStyle: 'character' }),
      );

      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('light');
    });

    it('migrates legacy "modern" theme to light', () => {
      lsMock.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: 'modern', soundEnabled: true, pieceStyle: 'character' }),
      );

      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('light');
    });

    it('falls back to defaults on invalid JSON', () => {
      lsMock.setItem(SETTINGS_KEY, 'not-json');

      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('light');
      expect(result.current.soundEnabled).toBe(true);
    });

    it('falls back to defaults when localStorage is empty', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('light');
    });

    it('migrates legacy "character" pieceStyle to stone', () => {
      lsMock.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: 'light', soundEnabled: true, pieceStyle: 'character', lang: 'en' }),
      );
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.pieceStyle).toBe('stone');
    });

    it('migrates legacy "classic" pieceStyle to stone', () => {
      lsMock.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: 'light', soundEnabled: true, pieceStyle: 'classic', lang: 'en' }),
      );
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.pieceStyle).toBe('stone');
    });
  });

  describe('theme toggle', () => {
    it('setTheme updates theme state', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('setTheme persists to localStorage', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      const stored = JSON.parse(lsMock.getItem(SETTINGS_KEY)!);
      expect(stored.theme).toBe('dark');
    });

    it('setTheme updates document.documentElement.dataset.theme', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.dataset.theme).toBe('dark');
    });
  });

  describe('sound toggle', () => {
    it('setSoundEnabled updates soundEnabled state', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);
    });

    it('setSoundEnabled persists to localStorage', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setSoundEnabled(false);
      });

      const stored = JSON.parse(lsMock.getItem(SETTINGS_KEY)!);
      expect(stored.soundEnabled).toBe(false);
    });
  });

  describe('language', () => {
    it('defaults to English', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.lang).toBe('en');
      expect(result.current.t.app.name).toBe('Pulijoodam');
    });

    it('reads saved Telugu lang from localStorage', () => {
      lsMock.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: 'light', soundEnabled: true, pieceStyle: 'character', lang: 'te' }),
      );
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.lang).toBe('te');
      expect(result.current.t.app.name).toBe('పులిజూదం');
    });

    it('setLang updates language and dictionary', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setLang('te');
      });

      expect(result.current.lang).toBe('te');
      expect(result.current.t.app.name).toBe('పులిజూదం');
    });

    it('setLang persists to localStorage', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setLang('te');
      });

      const stored = JSON.parse(lsMock.getItem(SETTINGS_KEY)!);
      expect(stored.lang).toBe('te');
    });

    it('setLang updates document.documentElement.lang', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setLang('te');
      });

      expect(document.documentElement.lang).toBe('te');
    });

    it('falls back unknown lang values to English', () => {
      lsMock.setItem(
        SETTINGS_KEY,
        JSON.stringify({ theme: 'light', soundEnabled: true, pieceStyle: 'character', lang: 'fr' }),
      );
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.lang).toBe('en');
    });
  });
});
