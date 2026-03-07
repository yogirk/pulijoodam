import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_COUNT_KEY = 'pwa_visit_count';
const DISMISSED_KEY = 'pwa_install_dismissed';

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Increment visit count
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    // Don't show if first visit or previously dismissed
    if (count < 2 || localStorage.getItem(DISMISSED_KEY) === 'true') {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    deferredPrompt.current = null;
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      data-testid="install-prompt"
      className="fixed bottom-4 left-4 right-4 mx-auto max-w-md rounded-xl px-5 py-4 flex items-center justify-between gap-3 z-50"
      style={{
        backgroundColor: 'var(--bg-secondary, #44403c)',
        color: 'var(--text-primary, #e7e5e4)',
        border: '1px solid var(--accent, #d97706)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.3)',
      }}
    >
      <span className="text-sm font-medium">
        Install Pulijoodam for quick access?
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: 'var(--accent, #d97706)' }}
          data-testid="install-btn"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--text-secondary, #a8a29e)' }}
          data-testid="install-dismiss-btn"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
