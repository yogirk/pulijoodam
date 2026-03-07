// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the pure helper functions directly, and mock-test the hook logic
// via a minimal state machine extracted from useDrag.

import { findNearestValidNode, DRAG_THRESHOLD, SNAP_RADIUS } from './useDrag';
import { NODES } from '../engine/board';
import type { LegalMove } from '../engine/types';

describe('useDrag constants', () => {
  it('DRAG_THRESHOLD is 5 SVG units', () => {
    expect(DRAG_THRESHOLD).toBe(5);
  });

  it('SNAP_RADIUS is 30 SVG units', () => {
    expect(SNAP_RADIUS).toBe(30);
  });
});

describe('findNearestValidNode', () => {
  const legalMoves: LegalMove[] = [
    { move: { type: 'MOVE', from: 0, to: 2 }, from: 0, to: 2 },
    { move: { type: 'MOVE', from: 0, to: 3 }, from: 0, to: 3 },
    { move: { type: 'CAPTURE', from: 0, over: 2, to: 8 }, from: 0, to: 8 },
  ];

  it('returns null when no node within SNAP_RADIUS', () => {
    // Position far from any valid destination
    const result = findNearestValidNode(0, 0, 0, legalMoves);
    expect(result).toBeNull();
  });

  it('returns closest valid node when within SNAP_RADIUS', () => {
    // Node 2 is at x=251.25, y=110 -- position near it
    const result = findNearestValidNode(250, 112, 0, legalMoves);
    expect(result).toBe(2);
  });

  it('returns closest among multiple valid nodes within range', () => {
    // Node 3 is at x=283.75, y=110 -- position closer to node 3 than node 2
    const result = findNearestValidNode(285, 110, 0, legalMoves);
    expect(result).toBe(3);
  });

  it('ignores nodes that are not legal move destinations from the given source', () => {
    // Node 4 at x=316.25 y=110 is NOT a legal destination from node 0
    // (only nodes 2, 3, 8 are legal destinations)
    const result = findNearestValidNode(316, 110, 0, legalMoves);
    expect(result).toBeNull();
  });

  it('returns null when position is just outside SNAP_RADIUS of valid node', () => {
    // Node 2 at x=251.25 y=110 -- put us 31+ units away
    const result = findNearestValidNode(251.25, 141, 0, legalMoves);
    expect(result).toBeNull();
  });

  it('works for capture move destinations', () => {
    // Node 8 at x=202.5, y=190 -- position near it
    const result = findNearestValidNode(205, 188, 0, legalMoves);
    expect(result).toBe(8);
  });
});
