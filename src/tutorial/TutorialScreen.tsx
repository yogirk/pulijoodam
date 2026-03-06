import { useEffect } from 'react';
import { TutorialProvider, useTutorial } from './TutorialContext';
import { TutorialOverlay } from './TutorialOverlay';
import { Board } from '../components/Board/Board';
import { useAnimationQueue } from '../hooks/useAnimationQueue';
import { useSettings } from '../hooks/useSettings.tsx';

interface TutorialScreenProps {
  onBackToMenu: () => void;
}

function TutorialContent({ onBackToMenu }: TutorialScreenProps) {
  const {
    isActive,
    isComplete,
    currentLesson,
    currentStep,
    gameState,
    legalMoves,
    encouragement,
    handleMove,
    skip,
    start,
    lastEvents,
  } = useTutorial();

  const { theme, soundEnabled } = useSettings();
  const animationState = useAnimationQueue(lastEvents, soundEnabled, theme);

  // Start tutorial on mount
  useEffect(() => {
    start(0);
  }, [start]);

  // Tutorial completed
  if (isComplete || (!isActive && !currentLesson)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div
          className="rounded-xl p-8 text-center max-w-sm"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: 'var(--accent)' }}
          >
            Well done!
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            You have learned the basics of Pulijoodam. Time to play a real game!
          </p>
          <button
            onClick={onBackToMenu}
            className="px-6 py-2 font-semibold rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-primary)' }}
            data-testid="back-to-menu-btn"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // The Board component uses legalMoves to show placement hints
  const tutorialLegalMoves = legalMoves;

  return (
    <div
      className="min-h-screen flex flex-col items-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div className="w-full max-w-[600px] px-4 pt-3 flex items-center justify-between">
        <button
          onClick={() => {
            skip();
            onBackToMenu();
          }}
          className="text-sm px-3 py-1 rounded transition-colors"
          style={{
            color: 'var(--text-secondary)',
            border: '1px solid var(--text-secondary)',
          }}
          data-testid="tutorial-back-btn"
        >
          Back to Menu
        </button>
        {currentLesson && (
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--accent)' }}
          >
            Lesson {currentLesson.id} of 3
          </span>
        )}
      </div>

      {/* Cultural intro (shown at step 0 of each lesson) */}
      {currentLesson && currentStep === currentLesson.steps[0] && (
        <div className="w-full max-w-[600px] px-4 mt-2">
          <p
            className="text-xs italic text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            {currentLesson.culturalIntro}
          </p>
        </div>
      )}

      {/* Board */}
      <div className="w-full max-w-[600px] px-2 mt-2">
        <Board
          gameState={gameState}
          selectedNode={null}
          legalMoves={tutorialLegalMoves}
          onNodeTap={handleMove}
          chainJumpInProgress={gameState.chainJumpInProgress}
          animationState={animationState}
        />
      </div>

      {/* Tutorial Overlay */}
      {currentStep && currentLesson && (
        <div className="w-full max-w-[600px] px-4 mt-3">
          <TutorialOverlay
            step={currentStep}
            lessonTitle={currentLesson.title}
            stepIndex={currentLesson.steps.indexOf(currentStep)}
            totalSteps={currentLesson.steps.length}
            onSkip={() => {
              skip();
              onBackToMenu();
            }}
            encouragement={encouragement}
          />
        </div>
      )}
    </div>
  );
}

export function TutorialScreen({ onBackToMenu }: TutorialScreenProps) {
  return (
    <TutorialProvider>
      <TutorialContent onBackToMenu={onBackToMenu} />
    </TutorialProvider>
  );
}
