interface DisconnectBannerProps {
  onContinueVsAI: () => void;
  onEndGame: () => void;
}

export function DisconnectBanner({ onContinueVsAI, onEndGame }: DisconnectBannerProps) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-6 py-4 shadow-lg z-50 text-center max-w-sm w-[calc(100%-2rem)]"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--accent)',
      }}
      data-testid="disconnect-banner"
    >
      <p className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>
        Opponent disconnected
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onContinueVsAI}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors text-sm"
          data-testid="continue-vs-ai-btn"
        >
          Continue vs AI
        </button>
        <button
          onClick={onEndGame}
          className="px-4 py-2 rounded-lg transition-colors text-sm"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
          data-testid="end-game-btn"
        >
          End Game
        </button>
      </div>
    </div>
  );
}
