import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { LESSONS } from './lessons';
import type { TutorialStep } from './lessons';
import type { GameState, LegalMove, GameEvent } from '../engine';
import { applyMove, getLegalMoves } from '../engine';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TutorialState {
  isActive: boolean;
  lessonIndex: number;
  stepIndex: number;
  gameState: GameState;
  legalMoves: LegalMove[];
  encouragement: string | null;
  isComplete: boolean;
  lastEvents: GameEvent[];
}

interface TutorialContextValue extends TutorialState {
  currentLesson: typeof LESSONS[number] | null;
  currentStep: TutorialStep | null;
  highlightNodes: number[];
  start: (lessonIndex?: number) => void;
  advance: () => void;
  handleMove: (nodeId: number) => void;
  skip: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

function createInitialState(): TutorialState {
  const gameState = LESSONS[0].buildInitialState();
  return {
    isActive: false,
    lessonIndex: 0,
    stepIndex: 0,
    gameState,
    legalMoves: getLegalMoves(gameState),
    encouragement: null,
    isComplete: false,
    lastEvents: [],
  };
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorialState>(createInitialState);
  const autoMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLesson = state.isActive ? LESSONS[state.lessonIndex] ?? null : null;
  const currentStep = currentLesson ? currentLesson.steps[state.stepIndex] ?? null : null;
  const highlightNodes = currentStep?.highlightNodes ?? [];

  const clearAutoMoveTimer = useCallback(() => {
    if (autoMoveTimerRef.current !== null) {
      clearTimeout(autoMoveTimerRef.current);
      autoMoveTimerRef.current = null;
    }
  }, []);

  const applyAutoMove = useCallback((lesson: typeof LESSONS[number], stepIdx: number, gameState: GameState) => {
    const step = lesson.steps[stepIdx];
    if (!step?.autoMove) return;

    clearAutoMoveTimer();
    autoMoveTimerRef.current = setTimeout(() => {
      const result = applyMove(gameState, step.autoMove!);
      if (!result.error) {
        const newLegal = getLegalMoves(result.state);
        setState(prev => ({
          ...prev,
          gameState: result.state,
          legalMoves: newLegal,
          lastEvents: result.events,
          stepIndex: prev.stepIndex + 1,
          encouragement: null,
        }));
      }
    }, 800);
  }, [clearAutoMoveTimer]);

  const start = useCallback((lessonIndex: number = 0) => {
    clearAutoMoveTimer();
    const lesson = LESSONS[lessonIndex];
    if (!lesson) return;
    const gameState = lesson.buildInitialState();
    const newState: TutorialState = {
      isActive: true,
      lessonIndex,
      stepIndex: 0,
      gameState,
      legalMoves: getLegalMoves(gameState),
      encouragement: null,
      isComplete: false,
      lastEvents: [],
    };
    setState(newState);

    // If first step has autoMove, trigger it
    if (lesson.steps[0]?.autoMove) {
      applyAutoMove(lesson, 0, gameState);
    }
  }, [clearAutoMoveTimer, applyAutoMove]);

  const advance = useCallback(() => {
    setState(prev => {
      if (!prev.isActive) return prev;
      const lesson = LESSONS[prev.lessonIndex];
      if (!lesson) return prev;

      const nextStepIndex = prev.stepIndex + 1;

      if (nextStepIndex < lesson.steps.length) {
        const nextStep = lesson.steps[nextStepIndex];
        // Schedule autoMove for next step if needed
        if (nextStep?.autoMove) {
          setTimeout(() => applyAutoMove(lesson, nextStepIndex, prev.gameState), 0);
        }
        return { ...prev, stepIndex: nextStepIndex, encouragement: null };
      }

      // End of lesson — advance to next lesson
      const nextLessonIndex = prev.lessonIndex + 1;
      if (nextLessonIndex < LESSONS.length) {
        const nextLesson = LESSONS[nextLessonIndex];
        const newGameState = nextLesson.buildInitialState();
        if (nextLesson.steps[0]?.autoMove) {
          setTimeout(() => applyAutoMove(nextLesson, 0, newGameState), 0);
        }
        return {
          ...prev,
          lessonIndex: nextLessonIndex,
          stepIndex: 0,
          gameState: newGameState,
          legalMoves: getLegalMoves(newGameState),
          encouragement: null,
          lastEvents: [],
        };
      }

      // All lessons complete
      return { ...prev, isActive: false, isComplete: true, encouragement: null };
    });
  }, [applyAutoMove]);

  const handleMove = useCallback((nodeId: number) => {
    setState(prev => {
      if (!prev.isActive) return prev;
      const lesson = LESSONS[prev.lessonIndex];
      const step = lesson?.steps[prev.stepIndex];
      if (!step) return prev;

      // Find a legal move targeting this node
      const legalMove = prev.legalMoves.find(lm => lm.to === nodeId);
      if (!legalMove) return prev; // Invalid move — ignore

      const result = applyMove(prev.gameState, legalMove.move);
      if (result.error) return prev;

      const newLegal = getLegalMoves(result.state);
      const isExpected = step.expectedMoves?.includes(nodeId) ?? false;

      if (isExpected || !step.expectedMoves) {
        // Expected move — advance
        const nextStepIndex = prev.stepIndex + 1;
        const nextStep = lesson.steps[nextStepIndex];
        if (nextStep?.autoMove) {
          setTimeout(() => applyAutoMove(lesson, nextStepIndex, result.state), 0);
        }

        if (nextStepIndex < lesson.steps.length) {
          return {
            ...prev,
            gameState: result.state,
            legalMoves: newLegal,
            stepIndex: nextStepIndex,
            encouragement: null,
            lastEvents: result.events,
          };
        }

        // End of lesson
        const nextLessonIndex = prev.lessonIndex + 1;
        if (nextLessonIndex < LESSONS.length) {
          const nextLesson = LESSONS[nextLessonIndex];
          const newGameState = nextLesson.buildInitialState();
          if (nextLesson.steps[0]?.autoMove) {
            setTimeout(() => applyAutoMove(nextLesson, 0, newGameState), 0);
          }
          return {
            ...prev,
            lessonIndex: nextLessonIndex,
            stepIndex: 0,
            gameState: newGameState,
            legalMoves: getLegalMoves(newGameState),
            encouragement: null,
            lastEvents: [],
          };
        }

        return { ...prev, isActive: false, isComplete: true, encouragement: null, lastEvents: result.events };
      }

      // Valid but unexpected — show encouragement, stay on same step
      return {
        ...prev,
        gameState: result.state,
        legalMoves: newLegal,
        encouragement: step.encourageText ?? 'Good move! That works too.',
        lastEvents: result.events,
      };
    });
  }, [applyAutoMove]);

  const skip = useCallback(() => {
    clearAutoMoveTimer();
    setState(prev => ({
      ...prev,
      isActive: false,
      isComplete: true,
      encouragement: null,
    }));
  }, [clearAutoMoveTimer]);

  return (
    <TutorialContext.Provider value={{
      ...state,
      currentLesson,
      currentStep,
      highlightNodes,
      start,
      advance,
      handleMove,
      skip,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return ctx;
}
