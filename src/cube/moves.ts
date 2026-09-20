import type { Face, Move } from './types';

type Vector = [number, number, number];

interface FaceletGeometry {
  position: Vector;
  normal: Vector;
}

const FACE_INDEX: Record<Face, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const FACE_NORMALS: Record<Face, Vector> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};

function geometryForIndex(index: number): FaceletGeometry {
  const face = (Object.keys(FACE_INDEX) as Face[]).find((candidate) => FACE_INDEX[candidate] === Math.floor(index / 9));
  if (!face) throw new Error(`Invalid facelet index: ${index}`);
  const local = index % 9;
  const row = Math.floor(local / 3);
  const column = local % 3;

  switch (face) {
    case 'U': return { position: [column - 1, 1, row - 1], normal: FACE_NORMALS.U };
    case 'R': return { position: [1, 1 - row, 1 - column], normal: FACE_NORMALS.R };
    case 'F': return { position: [column - 1, 1 - row, 1], normal: FACE_NORMALS.F };
    case 'D': return { position: [column - 1, -1, 1 - row], normal: FACE_NORMALS.D };
    case 'L': return { position: [-1, 1 - row, column - 1], normal: FACE_NORMALS.L };
    case 'B': return { position: [1 - column, 1 - row, -1], normal: FACE_NORMALS.B };
  }
}

function indexForGeometry(position: Vector, normal: Vector): number {
  let face: Face;
  let row: number;
  let column: number;

  if (normal[1] === 1) {
    face = 'U';
    row = position[2] + 1;
    column = position[0] + 1;
  } else if (normal[0] === 1) {
    face = 'R';
    row = 1 - position[1];
    column = 1 - position[2];
  } else if (normal[2] === 1) {
    face = 'F';
    row = 1 - position[1];
    column = position[0] + 1;
  } else if (normal[1] === -1) {
    face = 'D';
    row = 1 - position[2];
    column = position[0] + 1;
  } else if (normal[0] === -1) {
    face = 'L';
    row = 1 - position[1];
    column = position[2] + 1;
  } else {
    face = 'B';
    row = 1 - position[1];
    column = 1 - position[0];
  }

  return FACE_INDEX[face] * 9 + row * 3 + column;
}

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function rotateQuarter(vector: Vector, axis: Vector): Vector {
  const cross: Vector = [
    axis[1] * vector[2] - axis[2] * vector[1],
    axis[2] * vector[0] - axis[0] * vector[2],
    axis[0] * vector[1] - axis[1] * vector[0],
  ];
  const projection = dot(axis, vector);
  return [
    axis[0] * projection - cross[0],
    axis[1] * projection - cross[1],
    axis[2] * projection - cross[2],
  ];
}

function buildQuarterTurn(face: Face): number[] {
  const axis = FACE_NORMALS[face];
  const permutation = Array.from({ length: 54 }, (_, index) => index);

  for (let index = 0; index < 54; index += 1) {
    const geometry = geometryForIndex(index);
    if (dot(geometry.position, axis) !== 1) continue;
    const position = rotateQuarter(geometry.position, axis);
    const normal = rotateQuarter(geometry.normal, axis);
    permutation[indexForGeometry(position, normal)] = index;
  }

  return permutation;
}

const QUARTER_TURNS: Record<Face, number[]> = {
  U: buildQuarterTurn('U'),
  R: buildQuarterTurn('R'),
  F: buildQuarterTurn('F'),
  D: buildQuarterTurn('D'),
  L: buildQuarterTurn('L'),
  B: buildQuarterTurn('B'),
};

function applyQuarterTurn(facelets: string, face: Face): string {
  const permutation = QUARTER_TURNS[face];
  const next = Array.from({ length: 54 }, (_, index) => facelets[permutation[index]]);
  return next.join('');
}

export function applyMoveToFacelets(facelets: string, move: Move): string {
  const repetitions = move.turn === '2' ? 2 : move.turn === "'" ? 3 : 1;
  let next = facelets;
  for (let index = 0; index < repetitions; index += 1) {
    next = applyQuarterTurn(next, move.face);
  }
  return next;
}
