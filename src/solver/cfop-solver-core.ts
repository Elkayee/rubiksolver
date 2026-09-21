import Cube from 'cubejs';
import { cfop } from '@moishy/cfop';
import { applyAlg, applyMoves as applyCfopMoves, normalizeOrientation, solvedCube, toFacelets } from '@moishy/cubing-core';
import { formatMoves, inverseMoves, parseNotation } from '../cube/notation';
import type { Face, Move } from '../cube/types';
import { FACES } from '../cube/types';
import type { CfopStageId, SolutionStage, StagedSolution } from './solver-adapter';

const OUTER_FACES = new Set<string>(FACES);
const STAGE_LABELS: Record<CfopStageId, string> = {
  cross: 'Cross',
  f2l: 'F2L',
  oll: 'OLL',
  pll: 'PLL',
};

let initialization: Promise<void> | undefined;

function initializeKociemba(): Promise<void> {
  if (!initialization) {
    initialization = Promise.resolve().then(() => Cube.initSolver());
  }
  return initialization;
}

function toMove(family: string, amount: number): Move {
  if (!OUTER_FACES.has(family) || ![1, 2, 3].includes(amount)) {
    throw new Error(`Unsupported outer-face move: ${family}${amount}`);
  }
  return {
    face: family as Face,
    turn: amount === 1 ? '' : amount === 2 ? '2' : "'",
  };
}

function invertCube(cube: Cube): Cube {
  const source = cube.toJSON();
  const inverse = {
    center: Array<number>(6),
    cp: Array<number>(8),
    co: Array<number>(8),
    ep: Array<number>(12),
    eo: Array<number>(12),
  };
  source.center.forEach((piece, position) => { inverse.center[piece] = position; });
  source.cp.forEach((piece, position) => {
    inverse.cp[piece] = position;
    inverse.co[piece] = (3 - source.co[position]) % 3;
  });
  source.ep.forEach((piece, position) => {
    inverse.ep[piece] = position;
    inverse.eo[piece] = source.eo[position];
  });
  return new Cube(inverse);
}

function outerFaceTransition(fromFacelets: string, toFacelets: string): Move[] {
  const from = Cube.fromString(fromFacelets);
  const to = Cube.fromString(toFacelets);
  const delta = invertCube(from).multiply(to);
  const moves = inverseMoves(parseNotation(delta.solve()));
  if (from.clone().move(formatMoves(moves)).asString() !== toFacelets) {
    throw new Error('Could not translate a CFOP stage to outer-face moves.');
  }
  return moves;
}

export async function solveCfopFacelets(facelets: string): Promise<StagedSolution> {
  await initializeKociemba();

  // CFOP accepts a scramble. The inverse of a verified Kociemba solution is an
  // equivalent scramble for any legal facelet state, including color-editor input.
  const pathToSolved = parseNotation(Cube.fromString(facelets).solve());
  const equivalentScramble = formatMoves(inverseMoves(pathToSolved));
  if (!equivalentScramble) return { moves: [], stages: [] };

  const result = await cfop.solve(equivalentScramble, {
    colorNeutrality: 'fixed',
    lookahead: { depth: 0 },
    moveCostModel: {
      // Keep the result inside the move vocabulary supported by the shared engine.
      cost: (move) => OUTER_FACES.has(move.family) ? 1 : 1_000,
    },
  });
  if (!result.solved) throw new Error('CFOP could not complete this cube state.');

  const moves: Move[] = [];
  const stages: SolutionStage[] = [];
  let cfopState = applyAlg(solvedCube(), equivalentScramble);
  for (const segment of result.segments) {
    if (!(segment.unitId in STAGE_LABELS)) continue;
    const startIndex = moves.length;
    const nextCfopState = applyCfopMoves(cfopState, segment.moves);
    const onlyOuterMoves = segment.moves.every((move) => OUTER_FACES.has(move.family));
    const stageMoves = onlyOuterMoves
      ? segment.moves.map((move) => toMove(move.family, move.amount))
      : outerFaceTransition(
        toFacelets(normalizeOrientation(cfopState)),
        toFacelets(normalizeOrientation(nextCfopState)),
      );
    moves.push(...stageMoves);
    cfopState = nextCfopState;
    const id = segment.unitId as CfopStageId;
    stages.push({ id, label: STAGE_LABELS[id], startIndex, endIndex: moves.length });
  }

  return { moves, stages };
}
