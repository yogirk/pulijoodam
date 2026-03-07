// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { InstallPrompt } from './InstallPrompt';

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
  Object.defineProperty(window, 'localStorage', { value: lsMock, writable: true });
});

function fireBeforeInstallPrompt() {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  (event as unknown as Record<string, unknown>).prompt = vi.fn().mockResolvedValue(undefined);
  (event as unknown as Record<string, unknown>).userChoice = Promise.resolve({ outcome: 'accepted' as const });
  window.dispatchEvent(event);
  return event;
}

describe('InstallPrompt', () => {
  it('does not show on first visit', () => {
    render(<InstallPrompt />);
    // Fire the event -- should still not show because visit count = 1
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });

  it('shows on second visit when beforeinstallprompt fires', () => {
    // Simulate first visit already happened
    store['pwa_visit_count'] = '1';

    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.getByTestId('install-prompt')).toBeTruthy();
  });

  it('does not show after dismissal', () => {
    store['pwa_visit_count'] = '5';
    store['pwa_install_dismissed'] = 'true';

    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });

  it('dismiss button sets localStorage and hides banner', () => {
    store['pwa_visit_count'] = '1';

    render(<InstallPrompt />);
    act(() => {
      fireBeforeInstallPrompt();
    });

    const dismissBtn = screen.getByTestId('install-dismiss-btn');
    act(() => {
      dismissBtn.click();
    });

    expect(store['pwa_install_dismissed']).toBe('true');
    expect(screen.queryByTestId('install-prompt')).toBeNull();
  });
});
