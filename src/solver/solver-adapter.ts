import type { CubeState, Move } from '../cube/types';

export interface SolverAdapter {
  solve(state: CubeState): Promise<Move[]>;
}
