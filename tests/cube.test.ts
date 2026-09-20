import { describe, expect, it } from 'vitest';
import { applyMove, applyMoves, createState, isSolved } from '../src/cube/state';
import { inverseMove, inverseMoves, parseNotation } from '../src/cube/notation';
import type { Face, Move } from '../src/cube/types';
import { validateCubeState } from '../src/cube/validator';
import Cube from 'cubejs';

const faces: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

describe('cube move engine', () => {
  it('returns to solved after four quarter turns on every face', () => {
    for (const face of faces) {
      let state = createState();
      const move: Move = { face, turn: '' };
      for (let turn = 0; turn < 4; turn += 1) state = applyMove(state, move);
      expect(isSolved(state)).toBe(true);
    }
  });

  it('returns to solved after a move and its inverse', () => {
    for (const face of faces) {
      for (const turn of ['', "'", '2'] as const) {
        const move = { face, turn };
        expect(isSolved(applyMoves(createState(), [move, inverseMove(move)]))).toBe(true);
      }
    }
  });

  it('returns to solved after a sequence and its inverse', () => {
    const sequence = parseNotation("R U R' U' F2 L D2 B");
    expect(isSolved(applyMoves(createState(), [...sequence, ...inverseMoves(sequence)]))).toBe(true);
  });

  it('uses the same facelet orientation as the solver package', () => {
    for (const face of faces) {
      const move = { face, turn: '' } as const;
      expect(applyMove(createState(), move).facelets).toBe(new Cube().move(face).asString());
    }
  });
});

describe('notation and validation', () => {
  it('parses standard notation and rejects unknown tokens', () => {
    expect(parseNotation("R U R' U'")).toHaveLength(4);
    expect(() => parseNotation('X Q')).toThrow('Invalid move token');
  });

  it('accepts solved state and reports invalid colors', () => {
    expect(validateCubeState(createState()).valid).toBe(true);
    expect(validateCubeState(createState('U'.repeat(54))).errors.length).toBeGreaterThan(0);
  });

  it('has exactly 54 stickers and correct counts in solved state', () => {
    const solved = createState();
    expect(solved.facelets).toHaveLength(54);
    for (const face of faces) {
      const count = [...solved.facelets].filter((c) => c === face).length;
      expect(count).toBe(9);
    }
  });

  it('rejects a twisted corner, flipped edge, and odd permutation', () => {
    const replace = (facelets: string, updates: Array<[number, string]>): string => {
      const next = facelets.split('');
      updates.forEach(([index, value]) => { next[index] = value; });
      return next.join('');
    };
    const twistedCorner = replace(createState().facelets, [[8, 'R'], [9, 'F'], [20, 'U']]);
    const flippedEdge = replace(createState().facelets, [[7, 'F'], [19, 'U']]);
    const oddCornerPermutation = replace(createState().facelets, [
      [8, 'U'], [9, 'F'], [20, 'L'], [6, 'U'], [18, 'R'], [38, 'F'],
    ]);

    expect(validateCubeState(createState(twistedCorner)).errors).toContain('Corner orientation is impossible.');
    expect(validateCubeState(createState(flippedEdge)).errors).toContain('Edge orientation is impossible.');
    expect(validateCubeState(createState(oddCornerPermutation)).errors).toContain('Corner and edge permutation parity do not match.');
  });
});
