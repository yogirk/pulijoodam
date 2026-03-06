// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FirstLaunchModal } from './FirstLaunchModal';

const STORAGE_KEY = 'pulijoodam_tutorial_seen';

describe('FirstLaunchModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders modal when localStorage flag is not set', () => {
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={() => {}} />
    );
    expect(screen.getByText('New to Pulijoodam?')).toBeTruthy();
  });

  it('does not render when localStorage flag is set', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
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
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('clicking Skip calls onSkip and sets flag', () => {
    const onSkip = vi.fn();
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={onSkip} />
    );
    fireEvent.click(screen.getByText('Skip'));
    expect(onSkip).toHaveBeenCalledOnce();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('modal text contains expected description', () => {
    render(
      <FirstLaunchModal onStartTutorial={() => {}} onSkip={() => {}} />
    );
    expect(screen.getByText(/Learn the game in 3 short lessons/)).toBeTruthy();
  });
});
