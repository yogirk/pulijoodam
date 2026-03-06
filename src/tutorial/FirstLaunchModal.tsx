import { useState } from 'react';

const STORAGE_KEY = 'pulijoodam_tutorial_seen';

interface FirstLaunchModalProps {
  onStartTutorial: () => void;
  onSkip: () => void;
}

function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markTutorialSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // QuotaExceededError or private browsing
  }
}

export function FirstLaunchModal({ onStartTutorial, onSkip }: FirstLaunchModalProps) {
  const [visible] = useState(() => !hasSeenTutorial());

  if (!visible) return null;

  const handleStart = () => {
    markTutorialSeen();
    onStartTutorial();
  };

  const handleSkip = () => {
    markTutorialSeen();
    onSkip();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      data-testid="first-launch-modal"
    >
      <div
        className="rounded-xl p-6 mx-4 max-w-sm w-full text-center"
        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
      >
        <h2
          className="text-xl font-bold mb-3"
          style={{ color: 'var(--accent)' }}
        >
          New to Pulijoodam?
        </h2>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Pulijoodam has been played in South Indian villages for centuries.
          Learn the game in 3 short lessons.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleStart}
            className="px-5 py-2 font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-primary)' }}
            data-testid="start-tutorial-btn"
          >
            Start Tutorial
          </button>
          <button
            onClick={handleSkip}
            className="px-5 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--text-secondary)',
            }}
            data-testid="skip-tutorial-btn"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
