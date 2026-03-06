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
    it('returns traditional theme by default', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('traditional');
    });

    it('returns soundEnabled true by default', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('localStorage read', () => {
    it('reads saved theme from localStorage on mount', () => {
      const saved: Settings = { theme: 'modern', soundEnabled: false };
      lsMock.setItem(SETTINGS_KEY, JSON.stringify(saved));

      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('modern');
      expect(result.current.soundEnabled).toBe(false);
    });

    it('falls back to defaults on invalid JSON', () => {
      lsMock.setItem(SETTINGS_KEY, 'not-json');

      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('traditional');
      expect(result.current.soundEnabled).toBe(true);
    });

    it('falls back to defaults when localStorage is empty', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });
      expect(result.current.theme).toBe('traditional');
    });
  });

  describe('theme toggle', () => {
    it('setTheme updates theme state', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setTheme('modern');
      });

      expect(result.current.theme).toBe('modern');
    });

    it('setTheme persists to localStorage', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setTheme('modern');
      });

      const stored = JSON.parse(lsMock.getItem(SETTINGS_KEY)!);
      expect(stored.theme).toBe('modern');
    });

    it('setTheme updates document.documentElement.dataset.theme', () => {
      const { result } = renderHook(() => useSettings(), { wrapper });

      act(() => {
        result.current.setTheme('modern');
      });

      expect(document.documentElement.dataset.theme).toBe('modern');
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
});
