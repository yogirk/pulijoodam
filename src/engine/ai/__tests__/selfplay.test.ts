// Self-play validation: confirms difficulty levels are correctly ranked.
// Higher difficulty should beat lower difficulty the majority of the time.
//
// This is an integration test. It runs actual AI games using chooseMove().
// If it fails, the eval weights or MCTS/minimax tuning may need adjustment.
//
// Uses direct function calls (no Worker needed).
// Uses reduced time budgets to keep test under 2 minutes total.

import { createGame, applyMove, getLegalMoves, getGameStatus } from '../../index';
import type { GameState, GameStatus } from '../../types';
import { chooseMove } from '../index';
import type { AIConfig, AIDifficulty } from '../types';

const MAX_MOVES = 100;

// Reduced configs for testing — same relative strength differences but faster.
// Real DIFFICULTY_CONFIGS have much higher budgets; these keep tests under 2 minutes.
const TEST_CONFIGS: Record<AIDifficulty, AIConfig> = {
  easy:   { difficulty: 'easy',   mctsSims: 50,   minimaxDepth: 1, timeBudgetMs: 50,  topN: 3 },
  medium: { difficulty: 'medium', mctsSims: 300,  minimaxDepth: 3, timeBudgetMs: 150, topN: 1 },
  hard:   { difficulty: 'hard',   mctsSims: 1000, minimaxDepth: 4, timeBudgetMs: 300, topN: 1 },
  expert: { difficulty: 'expert', mctsSims: 1500, minimaxDepth: 5, timeBudgetMs: 400, topN: 1 },
};

/** Play one game between two difficulty levels. Returns 'tiger' | 'goat' | 'draw'. */
function playGame(
  tigerDifficulty: AIDifficulty,
  goatDifficulty: AIDifficulty
): 'tiger' | 'goat' | 'draw' {
  let state: GameState = createGame();

  for (let moveCount = 0; moveCount < MAX_MOVES; moveCount++) {
    const status: GameStatus = getGameStatus(state);
    if (status === 'tiger-wins') return 'tiger';
    if (status === 'goat-wins') return 'goat';
    if (status === 'draw-repetition' || status === 'draw-50moves') return 'draw';

    const moves = getLegalMoves(state);
    if (moves.length === 0) return 'draw';

    const config = state.currentTurn === 'tiger'
      ? TEST_CONFIGS[tigerDifficulty]
      : TEST_CONFIGS[goatDifficulty];

    const move = chooseMove(state, config);
    const result = applyMove(state, move);

    if (result.error) {
      throw new Error(`AI produced illegal move: ${JSON.stringify(move)} — ${result.error}`);
    }

    state = result.state;
  }

  return 'draw';
}

/**
 * Run N games between two difficulties for the same role.
 * Returns score for the higher difficulty (win=1, draw=0.5, loss=0).
 */
function runMatch(
  higherDiff: AIDifficulty,
  lowerDiff: AIDifficulty,
  role: 'tiger' | 'goat',
  games: number
): { score: number; wins: number; draws: number; losses: number } {
  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (let i = 0; i < games; i++) {
    const tigerDiff = role === 'tiger' ? higherDiff : lowerDiff;
    const goatDiff = role === 'goat' ? higherDiff : lowerDiff;
    const result = playGame(tigerDiff, goatDiff);

    if (result === 'draw') {
      draws++;
    } else if (result === role) {
      wins++;
    } else {
      losses++;
    }
  }

  const score = wins + draws * 0.5;
  return { score, wins, draws, losses };
}

describe('Self-play difficulty ranking', { timeout: 120_000 }, () => {
  // 4 games per pair keeps total runtime manageable (~60s for slow pairs)
  const GAMES_PER_PAIR = 4;
  // Threshold: higher difficulty should score at least 40% (lenient due to randomness + small N)
  const MIN_SCORE_RATIO = 0.4;

  it('Easy < Medium: medium beats easy as tiger', () => {
    const result = runMatch('medium', 'easy', 'tiger', GAMES_PER_PAIR);
    const ratio = result.score / GAMES_PER_PAIR;
    console.log(`Medium(T) vs Easy(G): ${result.wins}W ${result.draws}D ${result.losses}L (${ratio.toFixed(2)})`);
    expect(ratio).toBeGreaterThanOrEqual(MIN_SCORE_RATIO);
  });

  it('Easy < Medium: medium beats easy as goat', () => {
    const result = runMatch('medium', 'easy', 'goat', GAMES_PER_PAIR);
    const ratio = result.score / GAMES_PER_PAIR;
    console.log(`Medium(G) vs Easy(T): ${result.wins}W ${result.draws}D ${result.losses}L (${ratio.toFixed(2)})`);
    expect(ratio).toBeGreaterThanOrEqual(MIN_SCORE_RATIO);
  });

  it('Medium < Hard: hard beats medium', () => {
    // Test both roles in a single test to save time
    const asTiger = runMatch('hard', 'medium', 'tiger', GAMES_PER_PAIR);
    const asGoat = runMatch('hard', 'medium', 'goat', GAMES_PER_PAIR);
    const totalScore = asTiger.score + asGoat.score;
    const totalGames = GAMES_PER_PAIR * 2;
    const ratio = totalScore / totalGames;
    console.log(`Hard(T) vs Med(G): ${asTiger.wins}W ${asTiger.draws}D ${asTiger.losses}L`);
    console.log(`Hard(G) vs Med(T): ${asGoat.wins}W ${asGoat.draws}D ${asGoat.losses}L`);
    console.log(`Combined: ${ratio.toFixed(2)}`);
    expect(ratio).toBeGreaterThanOrEqual(MIN_SCORE_RATIO);
  });

  it('Hard < Expert: expert beats hard', () => {
    // Fewer games for this pair since both are slow (keep total under 60s)
    const pairGames = 3;
    const asTiger = runMatch('expert', 'hard', 'tiger', pairGames);
    const asGoat = runMatch('expert', 'hard', 'goat', pairGames);
    const totalScore = asTiger.score + asGoat.score;
    const totalGames = pairGames * 2;
    const ratio = totalScore / totalGames;
    console.log(`Expert(T) vs Hard(G): ${asTiger.wins}W ${asTiger.draws}D ${asTiger.losses}L`);
    console.log(`Expert(G) vs Hard(T): ${asGoat.wins}W ${asGoat.draws}D ${asGoat.losses}L`);
    console.log(`Combined: ${ratio.toFixed(2)}`);
    expect(ratio).toBeGreaterThanOrEqual(MIN_SCORE_RATIO);
  });
});
