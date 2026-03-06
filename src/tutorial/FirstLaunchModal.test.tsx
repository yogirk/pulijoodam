// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FirstLaunchModal } from './FirstLaunchModal';

const STORAGE_KEY = 'pulijoodam_tutorial_seen';

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
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FirstLaunchModal', () => {
  it('renders modal when localStorage flag is not set', () => {
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={() => {}} />
    );
    expect(screen.getByText('New to Pulijoodam?')).toBeTruthy();
  });

  it('does not render when localStorage flag is set', () => {
    lsMock.setItem(STORAGE_KEY, 'true');
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={() => {}} />
    );
    expect(screen.queryByText('New to Pulijoodam?')).toBeNull();
  });

  it('clicking Start Tutorial calls onStartTutorial and sets flag', () => {
    const onStart = vi.fn();
    render(
      <FirstLaunchModal onStartTutorial={onStart} onSkip={() => {}} />
    );
    fireEvent.click(screen.getByText('Start Tutorial'));
    expect(onStart).toHaveBeenCalledOnce();
    expect(lsMock.getItem(STORAGE_KEY)).toBe('true');
  });

  it('clicking Skip calls onSkip and sets flag', () => {
    const onSkip = vi.fn();
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={onSkip} />
    );
    fireEvent.click(screen.getByText('Skip'));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(lsMock.getItem(STORAGE_KEY)).toBe('true');
  });

  it('modal text contains expected description', () => {
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={() => {}} />
    );
    expect(screen.getByText(/Learn the game in 3 short lessons/)).toBeTruthy();
  });
});
