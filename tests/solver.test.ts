import { describe, expect, it } from 'vitest';
import { applyMoves, createState, generateScramble, isSolved } from '../src/cube/state';
import { CubeJsSolverAdapter } from '../src/solver/cubejs-solver';
import Cube from 'cubejs';
import { formatMoves } from '../src/cube/notation';

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

describe('CubeJsSolverAdapter', () => {
  it('solves a scrambled cube without mutating the input', async () => {
    const scramble = generateScramble(12, seededRandom(42));
    const scrambled = applyMoves(createState(), scramble);
    expect(scrambled.facelets).toBe(new Cube().move(formatMoves(scramble)).asString());
    const adapter = new CubeJsSolverAdapter();
    const solution = await adapter.solve(scrambled);

    expect(isSolved(applyMoves(scrambled, solution))).toBe(true);
    expect(scrambled).toEqual(applyMoves(createState(), scramble));
  }, 30_000);

  it('solves 100 deterministic scrambles', async () => {
    const adapter = new CubeJsSolverAdapter();
    const random = seededRandom(7);
    for (let index = 0; index < 100; index += 1) {
      const scramble = generateScramble(20, random);
      const scrambled = applyMoves(createState(), scramble);
      const solution = await adapter.solve(scrambled);
      expect(isSolved(applyMoves(scrambled, solution))).toBe(true);
    }
  }, 120_000);

  it('rejects an invalid cube before invoking the solver', async () => {
    await expect(new CubeJsSolverAdapter().solve(createState('U'.repeat(54)))).rejects.toThrow('Color');
  });
});
