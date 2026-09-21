import type { CubeState, Move } from '../cube/types';

export interface SolverAdapter {
  solve(state: CubeState): Promise<Move[]>;
}

export type CfopStageId = 'cross' | 'f2l' | 'oll' | 'pll';

export interface SolutionStage {
  id: CfopStageId;
  label: string;
  startIndex: number;
  endIndex: number;
}

export interface StagedSolution {
  moves: Move[];
  stages: SolutionStage[];
}
