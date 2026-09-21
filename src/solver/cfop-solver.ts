import type { CubeState, Move } from '../cube/types';
import { validateCubeState } from '../cube/validator';
import type { SolverAdapter, StagedSolution } from './solver-adapter';

interface WorkerResponse {
  id: number;
  solution?: StagedSolution;
  error?: string;
}

export class CfopSolverAdapter implements SolverAdapter {
  private worker: Worker | undefined;
  private nextRequestId = 1;
  private pending = new Map<number, { resolve: (value: StagedSolution) => void; reject: (reason: Error) => void }>();

  async solve(state: CubeState): Promise<Move[]> {
    return (await this.solveWithStages(state)).moves;
  }

  async solveWithStages(state: CubeState): Promise<StagedSolution> {
    const validation = validateCubeState(state);
    if (!validation.valid) throw new Error(validation.errors.join(' '));

    if (typeof Worker === 'undefined') {
      const { solveCfopFacelets } = await import('./cfop-solver-core');
      return solveCfopFacelets(state.facelets);
    }
    if (!this.worker) this.createWorker();

    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ id, facelets: state.facelets });
    });
  }

  private createWorker(): void {
    this.worker = new Worker(new URL('./cfop-worker.ts', import.meta.url), { type: 'module' });
    this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const request = this.pending.get(event.data.id);
      if (!request) return;
      this.pending.delete(event.data.id);
      if (event.data.solution) request.resolve(event.data.solution);
      else request.reject(new Error(event.data.error ?? 'CFOP worker failed.'));
    });
    this.worker.addEventListener('error', () => {
      for (const request of this.pending.values()) request.reject(new Error('CFOP worker failed.'));
      this.pending.clear();
      this.worker = undefined;
    });
  }
}
