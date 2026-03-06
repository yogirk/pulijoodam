import { useState } from 'react';
import { GameScreen } from './components/GameScreen/GameScreen';
import { SetupScreen } from './components/SetupScreen/SetupScreen';
import { HistoryScreen } from './history/HistoryScreen';
import { ReplayScreen } from './history/ReplayScreen';
import { useGameResume } from './history/useGameHistory';
import { TutorialScreen } from './tutorial/TutorialScreen';
import { FirstLaunchModal } from './tutorial/FirstLaunchModal';
import type { Role } from './engine';
import type { AIDifficulty } from './engine/ai/types';
import type { GameRecord } from './history/types';

type Screen = 'setup' | 'game' | 'history' | 'replay' | 'tutorial';

interface AIConfig {
  humanRole: Role;
  difficulty: AIDifficulty;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [replayGame, setReplayGame] = useState<GameRecord | null>(null);
  const { savedGame, clearSavedGame } = useGameResume();
  const [showResume, setShowResume] = useState(savedGame !== null);

  const handleStart = (config: AIConfig | null) => {
    setAiConfig(config);
    setShowResume(false);
    setScreen('game');
  };

  const handleResume = () => {
    if (!savedGame) return;
    // Resume with stored config
    if (savedGame.opponent === 'ai' && savedGame.difficulty) {
      setAiConfig({
        humanRole: savedGame.humanRole,
        difficulty: savedGame.difficulty,
      });
    } else {
      setAiConfig(null);
    }
    setShowResume(false);
    setScreen('game');
  };

  const handleDismissResume = () => {
    clearSavedGame();
    setShowResume(false);
  };

  const handleBackToMenu = () => {
    setAiConfig(null);
    setScreen('setup');
  };

  if (screen === 'tutorial') {
    return (
      <TutorialScreen onBackToMenu={handleBackToMenu} />
    );
  }

  if (screen === 'replay' && replayGame) {
    return (
      <ReplayScreen
        game={replayGame}
        onBack={() => {
          setReplayGame(null);
          setScreen('history');
        }}
      />
    );
  }

  if (screen === 'history') {
    return (
      <HistoryScreen
        onSelectGame={(record) => {
          setReplayGame(record);
          setScreen('replay');
        }}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  if (screen === 'game') {
    return (
      <GameScreen
        aiConfig={aiConfig}
        onBackToMenu={handleBackToMenu}
        onStartTutorial={() => setScreen('tutorial')}
      />
    );
  }

  return (
    <>
      <SetupScreen
        onStart={handleStart}
        onViewHistory={() => setScreen('history')}
        onStartTutorial={() => setScreen('tutorial')}
      />
      {/* First-launch tutorial prompt */}
      <FirstLaunchModal
        onStartTutorial={() => setScreen('tutorial')}
        onSkip={() => {}}
      />
      {/* Resume modal */}
      {showResume && savedGame && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 mx-4 max-w-sm w-full text-center"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: 'var(--accent)' }}
            >
              Resume Game?
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              You have an unfinished {savedGame.opponent === 'ai' ? 'AI' : 'local'} game
              with {savedGame.moveHistory.length} moves.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleResume}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors"
                data-testid="resume-yes-btn"
              >
                Resume
              </button>
              <button
                onClick={handleDismissResume}
                className="px-5 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                data-testid="resume-no-btn"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
