import { parseNotation, formatMoves } from './cube/notation';
import { createState } from './cube/state';
import type { CubeState, Move } from './cube/types';

export const SESSION_STORAGE_KEY = 'rubik-lab:session:v1';

export interface SessionSnapshot {
  state: CubeState;
  scramble: string;
  solution: Move[];
  solutionIndex: number;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function isFaceletShape(value: unknown): value is string {
  return typeof value === 'string' && value.length === 54 && /^[URFDLB]+$/.test(value);
}

export function readSession(storage?: StorageLike): SessionSnapshot | null {
  const source = storage ?? browserStorage();
  if (!source) return null;
  try {
    const raw = source.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!isFaceletShape(parsed.facelets)) return null;

    let solution: Move[] = [];
    if (typeof parsed.solution === 'string') {
      try {
        solution = parseNotation(parsed.solution);
      } catch {
        solution = [];
      }
    }

    const requestedIndex = typeof parsed.solutionIndex === 'number' && Number.isFinite(parsed.solutionIndex)
      ? Math.floor(parsed.solutionIndex)
      : 0;
    return {
      state: createState(parsed.facelets),
      scramble: typeof parsed.scramble === 'string' ? parsed.scramble : '',
      solution,
      solutionIndex: Math.max(0, Math.min(requestedIndex, solution.length)),
    };
  } catch {
    return null;
  }
}

export function writeSession(snapshot: SessionSnapshot, storage?: StorageLike): void {
  const target = storage ?? browserStorage();
  if (!target) return;
  try {
    target.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      facelets: snapshot.state.facelets,
      scramble: snapshot.scramble,
      solution: formatMoves(snapshot.solution),
      solutionIndex: snapshot.solutionIndex,
    }));
  } catch {
    // Storage may be unavailable in private browsing or with blocked site data.
  }
}
