import Cube from 'cubejs';
import { parseNotation } from '../cube/notation';
import type { CubeState, Move } from '../cube/types';
import { validateCubeState } from '../cube/validator';
import type { SolverAdapter } from './solver-adapter';

let solverInitialization: Promise<void> | undefined;

function ensureSolverInitialized(): Promise<void> {
  if (!solverInitialization) {
    solverInitialization = new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          Cube.initSolver();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }
  return solverInitialization;
}

export class CubeJsSolverAdapter implements SolverAdapter {
  async solve(state: CubeState): Promise<Move[]> {
    const validation = validateCubeState(state);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    await ensureSolverInitialized();
    const solution = Cube.fromString(state.facelets).solve();
    return parseNotation(solution);
  }
}
