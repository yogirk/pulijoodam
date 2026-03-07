import { useState, useEffect, useCallback, useRef } from 'react';
import {
  createGame,
  applyMove,
  getLegalMoves,
  getGameStatus,
} from '../engine';
import type { GameState, Move, LegalMove, GameEvent, GameStatus, Role } from '../engine';
import { decodeMessage } from './protocol';
import type { P2PConnection } from './webrtc';
import type { P2PMessage } from './protocol';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UseP2PGameOpts {
  localRole: Role;
  connection: P2PConnection;
}

export interface P2PGameReturn {
  gameState: GameState;
  selectedNode: number | null;
  legalMoves: LegalMove[];
  lastEvents: GameEvent[];
  status: GameStatus;
  canUndo: false;
  canRedo: false;
  onNodeTap: (nodeId: number) => void;
  onEndChain: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNewGame: () => void;
  connectionState: string;
  isDisconnected: boolean;
}

// ─── Noop functions ──────────────────────────────────────────────────────────

const noop = () => {};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useP2PGame({ localRole, connection }: UseP2PGameOpts): P2PGameReturn {
  const [gameState, setGameState] = useState<GameState>(() => createGame());
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [lastEvents, setLastEvents] = useState<GameEvent[]>([]);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [isDisconnected, setIsDisconnected] = useState(false);

  // Use ref for gameState inside callbacks to avoid stale closures
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const localRoleRef = useRef(localRole);
  localRoleRef.current = localRole;

  // Derived values
  const legalMoves = getLegalMoves(gameState);
  const status = getGameStatus(gameState);
  const isMyTurn = gameState.currentTurn === localRole;

  // ── Listen for opponent messages ─────────────────────────────────────────

  useEffect(() => {
    connection.onMessage((data: string) => {
      const msg = decodeMessage(data);
      const currentState = gameStateRef.current;
      const myTurn = currentState.currentTurn === localRoleRef.current;

      // Ignore messages when it's our turn (out-of-turn protection)
      if (myTurn) return;

      if (msg.type === 'MOVE') {
        const result = applyMove(currentState, msg.move);
        if (!result.error) {
          setGameState(result.state);
          setLastEvents(result.events);
          setSelectedNode(null);
        }
      } else if (msg.type === 'END_CHAIN') {
        const result = applyMove(currentState, { type: 'END_CHAIN' });
        if (!result.error) {
          setGameState(result.state);
          setLastEvents(result.events);
          setSelectedNode(null);
        }
      }
    });

    connection.onStateChange((state: string) => {
      setConnectionState(state);
      if (state === 'disconnected' || state === 'failed') {
        setIsDisconnected(true);
      } else if (state === 'connected') {
        setIsDisconnected(false);
      }
    });
  }, [connection]);

  // ── Node tap handler (mirrors useGame logic) ────────────────────────────

  const onNodeTap = useCallback((nodeId: number) => {
    const currentState = gameStateRef.current;

    // Not my turn -- no-op
    if (currentState.currentTurn !== localRoleRef.current) return;

    // Game over -- no-op
    if (getGameStatus(currentState) !== 'ongoing') return;

    const currentLegalMoves = getLegalMoves(currentState);

    // ── Mid chain-hop ──────────────────────────────────────────────────
    if (currentState.chainJumpInProgress !== null) {
      const chainTiger = currentState.chainJumpInProgress;
      if (nodeId === chainTiger) return;

      const captureMove = currentLegalMoves.find(
        (lm) => lm.move.type === 'CAPTURE' && lm.to === nodeId
      );
      if (!captureMove) return;

      const result = applyMove(currentState, captureMove.move);
      if (!result.error) {
        setGameState(result.state);
        setLastEvents(result.events);
        setSelectedNode(null);
        connection.send({ type: 'MOVE', move: captureMove.move });
      }
      return;
    }

    // ── Placement phase ────────────────────────────────────────────────
    if (currentState.phase === 'placement') {
      if (currentState.currentTurn === 'goat') {
        const placeMove = currentLegalMoves.find(
          (lm) => lm.move.type === 'PLACE' && lm.to === nodeId
        );
        if (!placeMove) return;
        const result = applyMove(currentState, placeMove.move);
        if (!result.error) {
          setGameState(result.state);
          setLastEvents(result.events);
          setSelectedNode(null);
          connection.send({ type: 'MOVE', move: placeMove.move });
        }
        return;
      }

      // Tiger's turn during placement
      if (currentState.currentTurn === 'tiger') {
        setSelectedNode((prev) => {
          if (prev === null) {
            if (currentState.board[nodeId] !== 'tiger') return null;
            const movesFrom = currentLegalMoves.filter((lm) => lm.from === nodeId);
            if (movesFrom.length === 0) return null;
            return nodeId;
          }

          if (nodeId === prev) return null;

          const moveToNode = currentLegalMoves.find(
            (lm) => lm.from === prev && lm.to === nodeId
          );
          if (moveToNode) {
            const result = applyMove(currentState, moveToNode.move);
            if (!result.error) {
              setGameState(result.state);
              setLastEvents(result.events);
              connection.send({ type: 'MOVE', move: moveToNode.move });
            }
            return null;
          }

          if (currentState.board[nodeId] === 'tiger') {
            const movesFromNew = currentLegalMoves.filter((lm) => lm.from === nodeId);
            if (movesFromNew.length > 0) return nodeId;
          }

          return null;
        });
        return;
      }
    }

    // ── Movement phase ─────────────────────────────────────────────────
    if (currentState.phase === 'movement') {
      const currentPiece = currentState.currentTurn;

      setSelectedNode((prev) => {
        if (prev === null) {
          if (currentState.board[nodeId] !== currentPiece) return null;
          const movesFrom = currentLegalMoves.filter((lm) => lm.from === nodeId);
          if (movesFrom.length === 0) return null;
          return nodeId;
        }

        if (nodeId === prev) return null;

        const moveToNode = currentLegalMoves.find(
          (lm) => lm.from === prev && lm.to === nodeId
        );
        if (moveToNode) {
          const result = applyMove(currentState, moveToNode.move);
          if (!result.error) {
            setGameState(result.state);
            setLastEvents(result.events);
            connection.send({ type: 'MOVE', move: moveToNode.move });
          }
          return null;
        }

        if (currentState.board[nodeId] === currentPiece) {
          const movesFromNew = currentLegalMoves.filter((lm) => lm.from === nodeId);
          if (movesFromNew.length > 0) return nodeId;
        }

        return null;
      });
    }
  }, [connection]);

  // ── End chain handler ────────────────────────────────────────────────────

  const onEndChain = useCallback(() => {
    const currentState = gameStateRef.current;
    if (currentState.chainJumpInProgress === null) return;
    if (currentState.currentTurn !== localRoleRef.current) return;

    const result = applyMove(currentState, { type: 'END_CHAIN' });
    if (!result.error) {
      setGameState(result.state);
      setLastEvents(result.events);
      setSelectedNode(null);
      connection.send({ type: 'END_CHAIN' });
    }
  }, [connection]);

  // ── New game handler ─────────────────────────────────────────────────────

  const onNewGame = useCallback(() => {
    setGameState(createGame());
    setSelectedNode(null);
    setLastEvents([]);
  }, []);

  return {
    gameState,
    selectedNode,
    legalMoves,
    lastEvents,
    status,
    canUndo: false as const,
    canRedo: false as const,
    onNodeTap,
    onEndChain,
    onUndo: noop,
    onRedo: noop,
    onNewGame,
    connectionState,
    isDisconnected,
  };
}
