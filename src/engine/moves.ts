import type { GameState, Move, LegalMove, MoveResult, GameEvent } from './types';
import { NODES, JUMP_MAP } from './board';
import { getGameStatus } from './rules';

// ─── Board hash ──────────────────────────────────────────────────────────────

function boardHash(state: GameState): string {
  return (
    state.board.map(p => (p === 'tiger' ? 'T' : p === 'goat' ? 'G' : '_')).join('') +
    state.currentTurn[0]
  );
}

// ─── Internal move generators ─────────────────────────────────────────────────

function getGoatMoves(state: GameState): LegalMove[] {
  const moves: LegalMove[] = [];

  if (state.phase === 'placement' && state.goatsInPool > 0) {
    // Placement: place goat on any empty node
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === null) {
        moves.push({ move: { type: 'PLACE', to: i }, to: i });
      }
    }
    return moves;
  }

  if (state.phase === 'movement') {
    // Movement: slide to adjacent empty node
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === 'goat') {
        for (const neighbor of NODES[i].adj) {
          if (state.board[neighbor] === null) {
            moves.push({ move: { type: 'MOVE', from: i, to: neighbor }, from: i, to: neighbor });
          }
        }
      }
    }
  }

  return moves;
}

export function getCaptureMovesFrom(state: GameState, tigerNode: number): LegalMove[] {
  const moves: LegalMove[] = [];
  for (const neighbor of NODES[tigerNode].adj) {
    if (state.board[neighbor] !== 'goat') continue;
    const key = `${tigerNode},${neighbor}`;
    const landing = JUMP_MAP[key];
    if (landing !== undefined && state.board[landing] === null) {
      moves.push({
        move: { type: 'CAPTURE', from: tigerNode, over: neighbor, to: landing },
        from: tigerNode,
        to: landing,
      });
    }
  }
  return moves;
}

function getTigerMoves(state: GameState): LegalMove[] {
  const moves: LegalMove[] = [];

  // During placement, if tigers still in pool, must place
  if (state.phase === 'placement' && state.tigersInPool > 0) {
    for (let i = 0; i < state.board.length; i++) {
      if (state.board[i] === null) {
        moves.push({ move: { type: 'PLACE_TIGER', to: i }, to: i });
      }
    }
    return moves;
  }

  // Normal tiger moves: slide + capture
  for (let i = 0; i < state.board.length; i++) {
    if (state.board[i] !== 'tiger') continue;
    // Slide moves
    for (const neighbor of NODES[i].adj) {
      if (state.board[neighbor] === null) {
        moves.push({ move: { type: 'MOVE', from: i, to: neighbor }, from: i, to: neighbor });
      }
    }
    // Capture moves
    moves.push(...getCaptureMovesFrom(state, i));
  }
  return moves;
}

// ─── Public: getLegalMoves ────────────────────────────────────────────────────

export function getLegalMoves(state: GameState): LegalMove[] {
  if (state.chainJumpInProgress !== null) {
    const captures = getCaptureMovesFrom(state, state.chainJumpInProgress);
    const endChain: LegalMove = { move: { type: 'END_CHAIN' } };
    return [...captures, endChain];
  }
  if (state.currentTurn === 'goat') return getGoatMoves(state);
  return getTigerMoves(state);
}

// ─── Public: applyMove ────────────────────────────────────────────────────────

export function applyMove(state: GameState, move: Move): MoveResult {
  const error = validateMove(state, move);
  if (error) {
    return { state, events: [], error };
  }

  const newBoard = state.board.slice() as GameState['board'];
  const events: GameEvent[] = [];
  let newState: GameState = { ...state, board: newBoard };

  switch (move.type) {
    case 'PLACE': {
      newBoard[move.to] = 'goat';
      newState.goatsInPool = state.goatsInPool - 1;
      newState.capturelessMoves = state.capturelessMoves + 1;
      events.push({ type: 'GOAT_PLACED', at: move.to });
      newState.moveHistory = [...state.moveHistory, move];

      if (newState.goatsInPool === 0) {
        newState.phase = 'movement';
        events.push({ type: 'PHASE_CHANGED', newPhase: 'movement' });
      }

      newState.currentTurn = 'tiger';
      break;
    }

    case 'PLACE_TIGER': {
      newBoard[move.to] = 'tiger';
      newState.tigersInPool = state.tigersInPool - 1;
      newState.capturelessMoves = state.capturelessMoves + 1;
      events.push({ type: 'TIGER_PLACED', at: move.to });
      newState.moveHistory = [...state.moveHistory, move];
      newState.currentTurn = 'goat';
      break;
    }

    case 'MOVE': {
      const piece = state.board[move.from]!;
      newBoard[move.from] = null;
      newBoard[move.to] = piece;
      newState.capturelessMoves = state.capturelessMoves + 1;
      events.push({ type: 'PIECE_MOVED', from: move.from, to: move.to, piece });
      newState.moveHistory = [...state.moveHistory, move];
      newState.currentTurn = state.currentTurn === 'goat' ? 'tiger' : 'goat';
      break;
    }

    case 'CAPTURE': {
      newBoard[move.from] = null;
      newBoard[move.over] = null;
      newBoard[move.to] = 'tiger';
      newState.goatsCaptured = state.goatsCaptured + 1;
      newState.capturelessMoves = 0;
      events.push({ type: 'GOAT_CAPTURED', over: move.over, landedAt: move.to });
      newState.moveHistory = [...state.moveHistory, move];

      // Check for chain-hop continuation
      if (state.config.andhra) {
        const furtherCaptures = getCaptureMovesFrom(newState, move.to);
        if (furtherCaptures.length > 0) {
          newState.chainJumpInProgress = move.to;
          events.push({ type: 'CHAIN_JUMP_AVAILABLE', tigerAt: move.to });
        } else {
          newState.chainJumpInProgress = null;
          newState.currentTurn = 'goat';
        }
      } else {
        newState.chainJumpInProgress = null;
        newState.currentTurn = 'goat';
      }
      break;
    }

    case 'END_CHAIN': {
      const tigerAt = state.chainJumpInProgress!;
      newState.chainJumpInProgress = null;
      newState.currentTurn = 'goat';
      newState.capturelessMoves = state.capturelessMoves + 1;
      newState.moveHistory = [...state.moveHistory, move];
      events.push({ type: 'CHAIN_JUMP_ENDED', tigerAt });
      break;
    }
  }

  // Update state hashes (for repetition detection)
  const hash = boardHash(newState);
  newState.stateHashes = {
    ...state.stateHashes,
    [hash]: (state.stateHashes[hash] ?? 0) + 1,
  };

  // Check game status
  const status = getGameStatus(newState);
  if (status !== 'ongoing') {
    events.push({ type: 'GAME_OVER', status });
  }

  return { state: newState, events };
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateMove(state: GameState, move: Move): string | undefined {
  // Mid-chain: only CAPTURE from the chain tiger and END_CHAIN are valid
  if (state.chainJumpInProgress !== null) {
    if (move.type === 'END_CHAIN') return undefined;
    if (move.type !== 'CAPTURE') return 'Must continue or end chain-hop';
    if (move.from !== state.chainJumpInProgress) return 'Wrong tiger during chain-hop';
    return validateCapture(state, move);
  }

  switch (move.type) {
    case 'PLACE':
      if (state.currentTurn !== 'goat') return 'Not goat\'s turn';
      if (state.phase !== 'placement') return 'Cannot place in movement phase';
      if (state.goatsInPool <= 0) return 'No goats in pool';
      if (state.board[move.to] !== null) return 'Node is occupied';
      return undefined;

    case 'PLACE_TIGER':
      if (state.currentTurn !== 'tiger') return 'Not tiger\'s turn';
      if (state.phase !== 'placement') return 'Cannot place in movement phase';
      if (state.tigersInPool <= 0) return 'No tigers in pool';
      if (state.board[move.to] !== null) return 'Node is occupied';
      return undefined;

    case 'MOVE': {
      const piece = state.board[move.from];
      if (piece === null) return 'No piece at source';
      if (piece !== state.currentTurn) return 'Not your piece';
      if (state.currentTurn === 'goat' && state.phase === 'placement')
        return 'Goats cannot move during placement phase';
      if (state.currentTurn === 'tiger' && state.phase === 'placement' && state.tigersInPool > 0)
        return 'Must place tigers from pool first';
      if (state.board[move.to] !== null) return 'Destination is occupied';
      if (!NODES[move.from].adj.includes(move.to)) return 'Not adjacent';
      return undefined;
    }

    case 'CAPTURE': {
      if (state.currentTurn !== 'tiger') return 'Only tigers can capture';
      if (state.phase === 'placement' && state.tigersInPool > 0)
        return 'Must place tigers from pool first';
      return validateCapture(state, move);
    }

    case 'END_CHAIN':
      return 'No chain-hop in progress';
  }
}

function validateCapture(
  state: GameState,
  move: Extract<Move, { type: 'CAPTURE' }>
): string | undefined {
  if (state.board[move.from] !== 'tiger') return 'No tiger at source';
  if (!NODES[move.from].adj.includes(move.over)) return 'Goat not adjacent to tiger';
  if (state.board[move.over] !== 'goat') return 'No goat to capture';
  const expectedLanding = JUMP_MAP[`${move.from},${move.over}`];
  if (expectedLanding === undefined) return 'No valid jump path';
  if (expectedLanding !== move.to) return 'Wrong landing node';
  if (state.board[move.to] !== null) return 'Landing node is occupied';
  return undefined;
}
