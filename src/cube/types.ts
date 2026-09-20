export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;

export type Face = (typeof FACES)[number];
export type Color = Face;
export type Turn = '' | "'" | '2';

export type Corner = 'URF' | 'UFL' | 'ULB' | 'UBR' | 'DFR' | 'DLF' | 'DBL' | 'DRB';
export type Edge = 'UR' | 'UF' | 'UL' | 'UB' | 'DR' | 'DF' | 'DL' | 'DB' | 'FR' | 'FL' | 'BL' | 'BR';

export interface Move {
  face: Face;
  turn: Turn;
}

export interface CubeState {
  facelets: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const SOLVED_FACELETS = FACES.map((face) => face.repeat(9)).join('');

export function createSolvedState(): CubeState {
  return { facelets: SOLVED_FACELETS };
}
