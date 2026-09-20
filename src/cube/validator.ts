import type { CubeState, ValidationResult } from './types';

const FACELETS = /^[URFDLB]+$/;
const CENTERS = [4, 13, 22, 31, 40, 49];
const CORNER_FACELETS = [
  [8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11],
  [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51],
];
const CORNER_COLORS = [
  ['U', 'R', 'F'], ['U', 'F', 'L'], ['U', 'L', 'B'], ['U', 'B', 'R'],
  ['D', 'F', 'R'], ['D', 'L', 'F'], ['D', 'B', 'L'], ['D', 'R', 'B'],
];
const EDGE_FACELETS = [
  [5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25],
  [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14],
];
const EDGE_COLORS = [
  ['U', 'R'], ['U', 'F'], ['U', 'L'], ['U', 'B'], ['D', 'R'], ['D', 'F'],
  ['D', 'L'], ['D', 'B'], ['F', 'R'], ['F', 'L'], ['B', 'L'], ['B', 'R'],
];

function permutationParity(permutation: number[]): number {
  let inversions = 0;
  for (let index = 0; index < permutation.length; index += 1) {
    for (let next = index + 1; next < permutation.length; next += 1) {
      if (permutation[index] > permutation[next]) inversions += 1;
    }
  }
  return inversions % 2;
}

export function validateCubeState(state: CubeState): ValidationResult {
  const errors: string[] = [];
  const facelets = state.facelets;

  if (facelets.length !== 54) errors.push('Cube needs exactly 54 facelets.');
  if (!FACELETS.test(facelets)) errors.push('Facelets may only use U, R, F, D, L, or B.');
  for (const color of ['U', 'R', 'F', 'D', 'L', 'B']) {
    const count = [...facelets].filter((value) => value === color).length;
    if (count !== 9) errors.push(`Color ${color} must appear exactly 9 times (found ${count}).`);
  }
  if (errors.length > 0) return { valid: false, errors };

  CENTERS.forEach((index, faceIndex) => {
    const expected = ['U', 'R', 'F', 'D', 'L', 'B'][faceIndex];
    if (facelets[index] !== expected) errors.push(`Center ${expected} is in the wrong position.`);
  });

  const cornerPermutation: number[] = [];
  let cornerOrientation = 0;
  CORNER_FACELETS.forEach((positions, positionIndex) => {
    const colors = positions.map((position) => facelets[position]);
    const orientation = colors.findIndex((color) => color === 'U' || color === 'D');
    if (orientation === -1) {
      errors.push(`Corner ${positionIndex + 1} has no U/D sticker.`);
      return;
    }
    const ordered = [colors[(orientation + 1) % 3], colors[(orientation + 2) % 3]];
    const piece = CORNER_COLORS.findIndex((candidate) => candidate[1] === ordered[0] && candidate[2] === ordered[1]);
    if (piece === -1) {
      errors.push(`Corner ${positionIndex + 1} has an impossible color combination.`);
      return;
    }
    if (cornerPermutation.includes(piece)) errors.push(`Corner piece ${piece + 1} appears more than once.`);
    cornerPermutation.push(piece);
    cornerOrientation += orientation;
  });

  const edgePermutation: number[] = [];
  let edgeOrientation = 0;
  EDGE_FACELETS.forEach((positions, positionIndex) => {
    const colors = positions.map((position) => facelets[position]);
    const piece = EDGE_COLORS.findIndex((candidate) =>
      (candidate[0] === colors[0] && candidate[1] === colors[1]) ||
      (candidate[1] === colors[0] && candidate[0] === colors[1]),
    );
    if (piece === -1) {
      errors.push(`Edge ${positionIndex + 1} has an impossible color combination.`);
      return;
    }
    if (edgePermutation.includes(piece)) errors.push(`Edge piece ${piece + 1} appears more than once.`);
    edgePermutation.push(piece);
    if (colors[0] !== EDGE_COLORS[piece][0]) edgeOrientation += 1;
  });

  if (cornerPermutation.length === 8 && cornerOrientation % 3 !== 0) {
    errors.push('Corner orientation is impossible.');
  }
  if (edgePermutation.length === 12 && edgeOrientation % 2 !== 0) {
    errors.push('Edge orientation is impossible.');
  }
  if (cornerPermutation.length === 8 && edgePermutation.length === 12 && permutationParity(cornerPermutation) !== permutationParity(edgePermutation)) {
    errors.push('Corner and edge permutation parity do not match.');
  }

  return { valid: errors.length === 0, errors };
}
