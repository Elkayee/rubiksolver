import { describe, expect, it } from 'vitest';
import { applyMoves, createState, generateScramble, isSolved } from '../src/cube/state';
import { parseNotation } from '../src/cube/notation';
import type { CubeState, Face } from '../src/cube/types';
import { FACES } from '../src/cube/types';
import { CfopSolverAdapter } from '../src/solver/cfop-solver';

function faceletsFor(state: CubeState, face: Face): string {
  const offset = FACES.indexOf(face) * 9;
  return state.facelets.slice(offset, offset + 9);
}

describe('CfopSolverAdapter', () => {
  it('solves through Cross, F2L, OLL and PLL using supported face moves', async () => {
    const scrambled = applyMoves(createState(), parseNotation('R U F2 D L2 B'));
    const snapshot = structuredClone(scrambled);

    const result = await new CfopSolverAdapter().solveWithStages(scrambled);

    expect(result.stages.map((stage) => stage.id)).toEqual(['cross', 'f2l', 'oll', 'pll']);
    expect(result.stages.every((stage) => stage.endIndex > stage.startIndex)).toBe(true);
    expect(result.stages[0].startIndex).toBe(0);
    expect(result.stages.at(-1)?.endIndex).toBe(result.moves.length);
    expect(result.moves.every((move) => /^[URFDLB]$/.test(move.face))).toBe(true);

    let stageState = scrambled;
    for (const stage of result.stages) {
      stageState = applyMoves(stageState, result.moves.slice(stage.startIndex, stage.endIndex));
      if (stage.id === 'cross') {
        expect([1, 3, 5, 7].every((index) => faceletsFor(stageState, 'D')[index] === 'D')).toBe(true);
        expect((['R', 'F', 'L', 'B'] as Face[]).every((face) => faceletsFor(stageState, face)[7] === face)).toBe(true);
      } else if (stage.id === 'f2l') {
        expect(faceletsFor(stageState, 'D')).toBe('D'.repeat(9));
        expect((['R', 'F', 'L', 'B'] as Face[]).every((face) => faceletsFor(stageState, face).slice(3) === face.repeat(6))).toBe(true);
      } else if (stage.id === 'oll') {
        expect(faceletsFor(stageState, 'U')).toBe('U'.repeat(9));
      }
    }
    expect(isSolved(applyMoves(scrambled, result.moves))).toBe(true);
    expect(scrambled).toEqual(snapshot);
  }, 30_000);

  it('solves a deterministic set without emitting slice, wide or rotation moves', async () => {
    let seed = 19;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    const adapter = new CfopSolverAdapter();

    for (let index = 0; index < 5; index += 1) {
      const scrambled = applyMoves(createState(), generateScramble(20, random));
      const result = await adapter.solveWithStages(scrambled);
      expect(result.stages.map((stage) => stage.id)).toEqual(['cross', 'f2l', 'oll', 'pll']);
      expect(result.moves.every((move) => /^[URFDLB]$/.test(move.face))).toBe(true);
      expect(isSolved(applyMoves(scrambled, result.moves))).toBe(true);
    }
  }, 60_000);

  it('rejects an invalid cube before invoking CFOP', async () => {
    await expect(new CfopSolverAdapter().solve(createState('U'.repeat(54)))).rejects.toThrow('Color');
  });
});
