import { describe, it, expect } from 'vitest';
import { en } from './en';
import { te } from './te';
import { DICTIONARIES, SUPPORTED_LANGS, normalizeLang } from './index';

/**
 * Recursively collect every leaf-key path in a nested string dictionary.
 * "app.name", "settings.themeLight", etc.
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') {
      out.push(...collectKeys(v as Record<string, unknown>, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>(
    (acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined),
    obj,
  );
}

describe('i18n dictionaries', () => {
  it('Telugu dictionary covers every English key', () => {
    const enKeys = collectKeys(en);
    const teKeys = collectKeys(te);
    const missing = enKeys.filter(k => !teKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it('every English value is a non-empty string', () => {
    for (const path of collectKeys(en)) {
      const v = getByPath(en, path);
      expect(typeof v, `en.${path} must be a string`).toBe('string');
      expect((v as string).length, `en.${path} must be non-empty`).toBeGreaterThan(0);
    }
  });

  it('every Telugu value is a non-empty string', () => {
    for (const path of collectKeys(te)) {
      const v = getByPath(te, path);
      expect(typeof v, `te.${path} must be a string`).toBe('string');
      expect((v as string).length, `te.${path} must be non-empty`).toBeGreaterThan(0);
    }
  });

  it('SUPPORTED_LANGS contains exactly en and te', () => {
    expect([...SUPPORTED_LANGS].sort()).toEqual(['en', 'te']);
  });

  it('DICTIONARIES is keyed by every supported lang', () => {
    for (const l of SUPPORTED_LANGS) {
      expect(DICTIONARIES[l]).toBeDefined();
    }
  });

  describe('normalizeLang', () => {
    it('passes through "en" and "te"', () => {
      expect(normalizeLang('en')).toBe('en');
      expect(normalizeLang('te')).toBe('te');
    });

    it('falls back unknown values to "en"', () => {
      expect(normalizeLang('fr')).toBe('en');
      expect(normalizeLang(undefined)).toBe('en');
      expect(normalizeLang(null)).toBe('en');
      expect(normalizeLang(42)).toBe('en');
    });
  });
});
