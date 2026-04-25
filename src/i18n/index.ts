import { en, type Dictionary } from './en';
import { te } from './te';

export type Lang = 'en' | 'te';

export const SUPPORTED_LANGS: readonly Lang[] = ['en', 'te'] as const;

export const DICTIONARIES: Record<Lang, Dictionary> = { en, te };

export function normalizeLang(value: unknown): Lang {
  return value === 'te' ? 'te' : 'en';
}

export type { Dictionary };
