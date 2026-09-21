import { solveCfopFacelets } from './cfop-solver-core';

interface SolveRequest {
  id: number;
  facelets: string;
}

self.addEventListener('message', async (event: MessageEvent<SolveRequest>) => {
  const { id, facelets } = event.data;
  try {
    const solution = await solveCfopFacelets(facelets);
    self.postMessage({ id, solution });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
});
