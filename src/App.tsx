import { useState, useCallback, lazy, Suspense } from 'react';
import { GameScreen } from './components/GameScreen/GameScreen';
import { SetupScreen } from './components/SetupScreen/SetupScreen';
import { useGameResume } from './history/useGameHistory';
import { FirstLaunchModal } from './tutorial/FirstLaunchModal';
import { InstallPrompt } from './pwa/InstallPrompt';
import { HostScreen } from './multiplayer/HostScreen';
import { JoinScreen } from './multiplayer/JoinScreen';
import { P2PGameScreen } from './multiplayer/P2PGameScreen';
import type { Role, Move } from './engine';
import type { AIDifficulty } from './engine/ai/types';
import type { GameRecord } from './history/types';
import type { P2PConnection } from './multiplayer/webrtc';

// Lazy-loaded screens (not in initial bundle)
const HistoryScreen = lazy(() =>
  import('./history/HistoryScreen').then(m => ({ default: m.HistoryScreen }))
);
const ReplayScreen = lazy(() =>
  import('./history/ReplayScreen').then(m => ({ default: m.ReplayScreen }))
);
const TutorialScreen = lazy(() =>
  import('./tutorial/TutorialScreen').then(m => ({ default: m.TutorialScreen }))
);

type Screen =
  | 'setup'
  | 'game'
  | 'history'
  | 'replay'
  | 'tutorial'
  | 'online-menu'
  | 'host'
  | 'join'
  | 'p2p-game';

interface AIConfig {
  humanRole: Role;
  difficulty: AIDifficulty;
}



export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);
  const [replayGame, setReplayGame] = useState<GameRecord | null>(null);
  const { savedGame, clearSavedGame } = useGameResume();

  // P2P state
  const [p2pConnection, setP2PConnection] = useState<P2PConnection | null>(null);
  const [p2pLocalRole, setP2PLocalRole] = useState<Role>('goat');

  const handleStart = (config: AIConfig | null) => {
    setAiConfig(config);
    setScreen('game');
  };

  const handleResume = () => {
    if (!savedGame) return;
    if (savedGame.opponent === 'ai' && savedGame.difficulty) {
      setAiConfig({
        humanRole: savedGame.humanRole,
        difficulty: savedGame.difficulty,
      });
    } else {
      setAiConfig(null);
    }
    setScreen('game');
  };

  const handleDismissResume = useCallback(() => {
    clearSavedGame();
  }, [clearSavedGame]);

  const handleBackToMenu = () => {
    setAiConfig(null);
    setP2PConnection(null);
    setScreen('setup');
  };

  const handleContinueVsAI = (_moveHistory: Move[]) => {
    // Switch to AI game with the opponent's role as AI
    // Use medium difficulty as default for continue-vs-AI
    setAiConfig({
      humanRole: p2pLocalRole,
      difficulty: 'medium',
    });
    if (p2pConnection) {
      p2pConnection.close();
    }
    setP2PConnection(null);
    setScreen('game');
  };

  // ── Screen routing ─────────────────────────────────────────────────────────

  if (screen === 'tutorial') {
    return (
      <Suspense fallback={null}>
        <TutorialScreen onBackToMenu={handleBackToMenu} />
        <InstallPrompt />
      </Suspense>
    );
  }

  if (screen === 'replay' && replayGame) {
    return (
      <Suspense fallback={null}>
        <ReplayScreen
          game={replayGame}
          onBack={() => {
            setReplayGame(null);
            setScreen('history');
          }}
        />
        <InstallPrompt />
      </Suspense>
    );
  }

  if (screen === 'history') {
    return (
      <Suspense fallback={null}>
        <HistoryScreen
          onSelectGame={(record) => {
            setReplayGame(record);
            setScreen('replay');
          }}
          onBackToMenu={handleBackToMenu}
        />
        <InstallPrompt />
      </Suspense>
    );
  }

  if (screen === 'game') {
    return (
      <>
        <GameScreen
          aiConfig={aiConfig}
          onBackToMenu={handleBackToMenu}
        />
        <InstallPrompt />
      </>
    );
  }

  if (screen === 'online-menu') {
    return (
      <>
        <div
          className="min-h-screen-safe flex flex-col items-center justify-center p-4"
          style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <button
            onClick={() => setScreen('setup')}
            className="self-start mb-4 px-3 py-1 text-sm"
            style={{ color: 'var(--text-secondary)' }}
            data-testid="online-back-btn"
          >
            &larr; Back
          </button>

          <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--accent)' }}>
            Play Online
          </h1>

          <button
            onClick={() => setScreen('host')}
            className="min-h-[44px] px-8 py-3 font-bold rounded-lg text-lg transition-colors mb-4"
            style={{ backgroundColor: 'var(--legal-move-stroke)', color: '#ffffff' }}
            data-testid="host-game-btn"
          >
            Host Game
          </button>

          <button
            onClick={() => setScreen('join')}
            className="min-h-[44px] px-8 py-3 rounded-lg font-bold text-lg transition-colors"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--accent)',
            }}
            data-testid="join-game-btn"
          >
            Join Game
          </button>
        </div>
        <InstallPrompt />
      </>
    );
  }

  if (screen === 'host') {
    return (
      <>
        <HostScreen
          onConnected={(connection, hostRole) => {
            setP2PConnection(connection);
            setP2PLocalRole(hostRole);
            setScreen('p2p-game');
          }}
          onBack={() => setScreen('online-menu')}
        />
        <InstallPrompt />
      </>
    );
  }

  if (screen === 'join') {
    return (
      <>
        <JoinScreen
          onConnected={(connection) => {
            setP2PConnection(connection);
            // Guest gets the opposite role -- host already picked
            // The guest role will be determined by the host's choice
            // For now, guest defaults to goat (host typically picks tiger)
            // In practice, the host's role choice could be sent as a message
            setP2PLocalRole('goat');
            setScreen('p2p-game');
          }}
          onBack={() => setScreen('online-menu')}
        />
        <InstallPrompt />
      </>
    );
  }

  if (screen === 'p2p-game' && p2pConnection) {
    return (
      <>
        <P2PGameScreen
          connection={p2pConnection}
          localRole={p2pLocalRole}
          onContinueVsAI={handleContinueVsAI}
          onEndGame={handleBackToMenu}
        />
        <InstallPrompt />
      </>
    );
  }

  // ── Setup screen (default) ─────────────────────────────────────────────────

  return (
    <>
      <SetupScreen
        onStart={handleStart}
        onViewHistory={() => setScreen('history')}
        onStartTutorial={() => setScreen('tutorial')}
        onPlayOnline={() => setScreen('online-menu')}
        savedGame={savedGame ? { opponent: savedGame.opponent, moves: savedGame.moveHistory.length } : null}
        onResume={handleResume}
        onDismissResume={handleDismissResume}
      />
      {/* First-launch tutorial prompt */}
      <FirstLaunchModal
        onStartTutorial={() => setScreen('tutorial')}
        onSkip={() => { }}
      />
      {/* PWA install prompt */}
      <InstallPrompt />
    </>
  );
}
