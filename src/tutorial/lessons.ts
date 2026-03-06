// Tutorial lesson definitions
// Each lesson builds its initial state by replaying valid moves through the engine
// (never constructing raw state) to avoid engine invariant violations.

import type { GameState, Move } from '../engine';
import { createGame, applyMove } from '../engine';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TutorialStep {
  text: string;
  highlightNodes: number[];
  expectedMoves?: number[];    // target node IDs that advance the tutorial
  autoMove?: Move;             // AI/opponent move applied automatically
  position: 'top' | 'bottom' | 'left' | 'right';
  encourageText?: string;      // shown when user makes a valid but unexpected move
}

export interface Lesson {
  id: number;
  title: string;
  culturalIntro: string;
  buildInitialState: () => GameState;
  steps: TutorialStep[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Replay a sequence of moves from a fresh game to build a specific board state. */
function replayMoves(moves: Move[]): GameState {
  let state = createGame();
  for (const move of moves) {
    const result = applyMove(state, move);
    if (result.error) {
      throw new Error(`Tutorial state build failed: ${result.error}`);
    }
    state = result.state;
  }
  return state;
}

// ─── Lesson 1: Board & Placement ────────────────────────────────────────────

const lesson1: Lesson = {
  id: 1,
  title: 'Board & Placement',
  culturalIntro:
    'Pulijoodam has been played in South Indian villages for centuries. Tigers hunt goats, and goats try to surround them. Let\'s learn how.',
  buildInitialState: () => createGame(),
  steps: [
    {
      text: 'Welcome! You play as the goats. Tigers are already on the board at the top. Your job is to place goats on empty nodes to surround the tigers.',
      highlightNodes: [0, 3, 4],
      position: 'bottom',
    },
    {
      text: 'Tap any highlighted node to place your first goat. Strategic spots near the center give you more control.',
      highlightNodes: [2, 5, 9, 10],
      expectedMoves: [2, 5, 9, 10],
      encourageText: 'That works! Any empty node is a valid placement.',
      position: 'bottom',
    },
    {
      text: 'Good! Now the tiger takes a turn. Watch how it moves to an adjacent node.',
      highlightNodes: [],
      autoMove: { type: 'MOVE', from: 0, to: 2 },
      position: 'top',
    },
    {
      text: 'Your turn again! Place another goat. Try to block the tigers\' paths by building walls of goats.',
      highlightNodes: [8, 9, 15],
      expectedMoves: [8, 9, 15],
      encourageText: 'Good choice! Placement is about controlling space.',
      position: 'bottom',
    },
    {
      text: 'Tigers can move or capture, but during placement they often just reposition. Keep placing goats strategically.',
      highlightNodes: [],
      autoMove: { type: 'MOVE', from: 3, to: 0 },
      position: 'top',
    },
    {
      text: 'Place one more goat. After all 15 goats are on the board, the movement phase begins. Keep building your formation!',
      highlightNodes: [14, 15, 16],
      expectedMoves: [14, 15, 16],
      encourageText: 'Nice! You\'re getting the hang of placement.',
      position: 'bottom',
    },
  ],
};

// ─── Lesson 2: Movement & Captures ──────────────────────────────────────────

// Verified move sequence: builds a mid-game board with capture opportunities.
// Tigers at [0,3,4] initially. After these moves:
// Board: 2:t 4:t 5:g 7:g 8:g 9:g 10:g 11:g 13:t 14:g 15:g 16:g 17:g
// Tiger at 13 can capture goat at 7, landing at 1 (line V_left [1,7,13])
function buildLesson2State(): GameState {
  return replayMoves([
    { type: 'PLACE', to: 9 },
    { type: 'MOVE', from: 3, to: 2 },
    { type: 'PLACE', to: 5 },
    { type: 'MOVE', from: 4, to: 3 },
    { type: 'PLACE', to: 15 },
    { type: 'MOVE', from: 0, to: 4 },
    { type: 'PLACE', to: 10 },
    { type: 'MOVE', from: 4, to: 0 },
    { type: 'PLACE', to: 16 },
    { type: 'MOVE', from: 2, to: 1 },
    { type: 'PLACE', to: 8 },
    { type: 'MOVE', from: 1, to: 7 },
    { type: 'PLACE', to: 14 },
    { type: 'MOVE', from: 3, to: 4 },
    { type: 'PLACE', to: 11 },
    { type: 'MOVE', from: 0, to: 2 },
    { type: 'PLACE', to: 17 },
    { type: 'MOVE', from: 7, to: 13 },
    { type: 'PLACE', to: 7 },
    // Result: tigers at 2,4,13 — goats at 5,7,8,9,10,11,14,15,16,17
    // It's tiger's turn. Tiger at 13 can capture goat at 7, landing at empty node 1.
  ]);
}

const lesson2: Lesson = {
  id: 2,
  title: 'Movement & Captures',
  culturalIntro:
    'In the villages, experienced players say the tiger must be patient — waiting for the right moment to pounce. Let\'s see how captures work.',
  buildInitialState: buildLesson2State,
  steps: [
    {
      text: 'This board is mid-game. Both sides have pieces positioned. Pieces move by sliding along lines to adjacent empty nodes.',
      highlightNodes: [],
      position: 'top',
    },
    {
      text: 'Place a goat to continue. Notice how each piece can only slide to a directly connected neighbor.',
      highlightNodes: [1, 6, 12, 18, 19, 20, 21, 22],
      expectedMoves: [1, 6, 12, 18, 19, 20, 21, 22],
      encourageText: 'Good placement! Each empty node is a valid choice.',
      position: 'bottom',
    },
    {
      text: 'Watch carefully — the tiger spots a goat it can jump over! Tigers capture by leaping over an adjacent goat to an empty node beyond it.',
      highlightNodes: [13, 7, 1],
      autoMove: { type: 'CAPTURE', from: 13, over: 7, to: 1 },
      position: 'top',
    },
    {
      text: 'The tiger captured a goat! In Andhra rules, if another jump is available after landing, the tiger can chain-hop for multiple captures in one turn.',
      highlightNodes: [1],
      position: 'top',
    },
    {
      text: 'Your turn — place a goat to protect your formation. Block tiger jumping paths by filling empty landing spots.',
      highlightNodes: [0, 7, 13],
      expectedMoves: [0, 7, 13],
      encourageText: 'Smart defensive move!',
      position: 'bottom',
    },
    {
      text: 'Excellent! Blocking landing nodes is the key defensive strategy. Tigers need an empty node to land on — no landing spot means no capture.',
      highlightNodes: [],
      position: 'bottom',
    },
  ],
};

// ─── Lesson 3: Winning & Losing ─────────────────────────────────────────────

// Verified move sequence: all 15 goats placed, 2 captured, movement phase.
// Board: 2:t 4:t 5:g 6:g 7:g 8:g 9:g 10:g 11:g 13:t 14:g 15:g 16:g 17:g 19:g 20:g
// 13 goats on board, goatsCaptured=2, phase=movement, turn=goat
function buildLesson3State(): GameState {
  return replayMoves([
    { type: 'PLACE', to: 9 },
    { type: 'MOVE', from: 3, to: 2 },
    { type: 'PLACE', to: 5 },
    { type: 'MOVE', from: 4, to: 3 },
    { type: 'PLACE', to: 15 },
    { type: 'MOVE', from: 0, to: 4 },
    { type: 'PLACE', to: 10 },
    { type: 'MOVE', from: 4, to: 0 },
    { type: 'PLACE', to: 16 },
    { type: 'MOVE', from: 2, to: 1 },
    { type: 'PLACE', to: 8 },
    { type: 'MOVE', from: 1, to: 7 },
    { type: 'PLACE', to: 14 },
    { type: 'MOVE', from: 3, to: 4 },
    { type: 'PLACE', to: 11 },
    { type: 'MOVE', from: 0, to: 2 },
    { type: 'PLACE', to: 17 },
    { type: 'MOVE', from: 7, to: 13 },
    { type: 'PLACE', to: 7 },
    { type: 'CAPTURE', from: 13, over: 7, to: 1 },  // cap=1
    { type: 'PLACE', to: 7 },
    { type: 'MOVE', from: 4, to: 3 },
    { type: 'PLACE', to: 20 },
    { type: 'CAPTURE', from: 1, over: 7, to: 13 },  // cap=2
    { type: 'PLACE', to: 7 },
    { type: 'MOVE', from: 3, to: 4 },
    { type: 'PLACE', to: 19 },
    { type: 'MOVE', from: 2, to: 0 },
    { type: 'PLACE', to: 6 },       // 15th goat -> phase=movement
    { type: 'MOVE', from: 0, to: 2 },
    // Final: tigers at 2,4,13 — 13 goats on board — movement phase — goat's turn
  ]);
}

const lesson3: Lesson = {
  id: 3,
  title: 'Winning the Game',
  culturalIntro:
    'Victory requires patience and foresight. The goats win by trapping all tigers so none can move. The tigers win by capturing 10 goats.',
  buildInitialState: buildLesson3State,
  steps: [
    {
      text: 'This is a late-game position. The goats are close to trapping the tigers. Goats win when no tiger has any legal move — completely surrounded!',
      highlightNodes: [],
      position: 'top',
    },
    {
      text: 'Meanwhile, tigers win by capturing 10 goats total. With each capture, the goat defense weakens. Watch the capture counter at the top.',
      highlightNodes: [],
      position: 'top',
    },
    {
      text: 'Try to move a goat to tighten the trap. Position goats on adjacent empty nodes around tigers to block all their escape routes.',
      highlightNodes: [],
      expectedMoves: undefined,
      encourageText: 'Good positioning! Every blocked path matters.',
      position: 'bottom',
    },
    {
      text: 'A draw can also occur if the same board position repeats 3 times, or if 50 moves pass without a capture. Keep the pressure on!',
      highlightNodes: [],
      position: 'top',
    },
    {
      text: 'Well done! You now know the basics of Pulijoodam. Place goats wisely, block tiger paths, and trap them to win. Good luck!',
      highlightNodes: [],
      position: 'bottom',
    },
  ],
};

// ─── Export ─────────────────────────────────────────────────────────────────

export const LESSONS: Lesson[] = [lesson1, lesson2, lesson3];
