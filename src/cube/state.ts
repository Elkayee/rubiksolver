import { applyMoveToFacelets } from './moves';
import type { CubeState, Face, Move, Turn } from './types';
import { FACES, SOLVED_FACELETS } from './types';

export function createState(facelets = SOLVED_FACELETS): CubeState {
  return { facelets };
}

export function applyMove(state: CubeState, move: Move): CubeState {
  return createState(applyMoveToFacelets(state.facelets, move));
}

export function applyMoves(state: CubeState, moves: Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

export function isSolved(state: CubeState): boolean {
  return state.facelets === SOLVED_FACELETS;
}

export function generateScramble(length = 20, random = Math.random): Move[] {
  const moves: Move[] = [];
  let previousFace: Face | undefined;
  const turns: Turn[] = ['', "'", '2'];

  while (moves.length < length) {
    const face = FACES[Math.floor(random() * FACES.length)];
    if (face === previousFace) continue;
    previousFace = face;
    moves.push({ face, turn: turns[Math.floor(random() * turns.length)] });
  }

  return moves;
}
