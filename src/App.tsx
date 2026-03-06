import { useState } from 'react';
import { GameScreen } from './components/GameScreen/GameScreen';
import { SetupScreen } from './components/SetupScreen/SetupScreen';
import type { Role } from './engine';
import type { AIDifficulty } from './engine/ai/types';

type Screen = 'setup' | 'game';

interface AIConfig {
  humanRole: Role;
  difficulty: AIDifficulty;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null);

  const handleStart = (config: AIConfig | null) => {
    setAiConfig(config);
    setScreen('game');
  };

  const handleBackToMenu = () => {
    setAiConfig(null);
    setScreen('setup');
  };

  if (screen === 'game') {
    return (
      <GameScreen
        aiConfig={aiConfig}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  return <SetupScreen onStart={handleStart} />;
}
