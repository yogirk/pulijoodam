// Tutorial lesson definitions unit tests
import { describe, it, expect } from 'vitest';
import { LESSONS } from './lessons';
import type { GameState } from '../engine';

describe('Tutorial Lessons', () => {
  it('LESSONS array has exactly 3 entries', () => {
    expect(LESSONS).toHaveLength(3);
  });

  it('each lesson has required fields', () => {
    for (const lesson of LESSONS) {
      expect(lesson.id).toBeTypeOf('number');
      expect(lesson.title).toBeTypeOf('string');
      expect(lesson.culturalIntro).toBeTypeOf('string');
      expect(lesson.steps.length).toBeGreaterThan(0);
      expect(lesson.buildInitialState).toBeTypeOf('function');
    }
  });

  it('Lesson 1 initial state is a fresh game (placement phase)', () => {
    const state = LESSONS[0].buildInitialState();
    expect(state.phase).toBe('placement');
    expect(state.goatsInPool).toBe(15);
    expect(state.goatsCaptured).toBe(0);
    expect(state.currentTurn).toBe('goat');
  });

  it('Lesson 2 initial state has pieces positioned for capture', () => {
    const state = LESSONS[1].buildInitialState();
    // Must have goats on board for capture demonstration
    const goatsOnBoard = state.board.filter(p => p === 'goat').length;
    expect(goatsOnBoard).toBeGreaterThan(0);
    // Must have tigers on board
    const tigersOnBoard = state.board.filter(p => p === 'tiger').length;
    expect(tigersOnBoard).toBeGreaterThanOrEqual(3);
  });

  it('Lesson 3 initial state is near-endgame', () => {
    const state = LESSONS[2].buildInitialState();
    // Near-endgame means many goats placed (in movement phase or close to it)
    // and some captures have happened
    const goatsOnBoard = state.board.filter(p => p === 'goat').length;
    const totalGoatsUsed = 15 - state.goatsInPool;
    expect(totalGoatsUsed).toBeGreaterThan(10);
    expect(goatsOnBoard).toBeGreaterThan(0);
  });

  it('each step has text and position', () => {
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        expect(step.text).toBeTypeOf('string');
        expect(step.text.length).toBeGreaterThan(0);
        expect(['top', 'bottom', 'left', 'right']).toContain(step.position);
        expect(step.highlightNodes).toBeInstanceOf(Array);
      }
    }
  });

  it('each lesson has a cultural intro', () => {
    for (const lesson of LESSONS) {
      expect(lesson.culturalIntro.length).toBeGreaterThan(10);
    }
  });
});
