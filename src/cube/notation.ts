import type { Face, Move } from './types';

const TOKEN_PATTERN = /^([URFDLB])([2']?)$/;

export function parseNotation(input: string): Move[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  return trimmed.split(/\s+/).map((token) => {
    const match = TOKEN_PATTERN.exec(token);
    if (!match) throw new Error(`Invalid move token: ${token}`);
    return { face: match[1] as Face, turn: match[2] as Move['turn'] };
  });
}

export function formatMove(move: Move): string {
  return `${move.face}${move.turn}`;
}

export function formatMoves(moves: Move[]): string {
  return moves.map(formatMove).join(' ');
}

export function inverseMove(move: Move): Move {
  if (move.turn === '2') return move;
  return { face: move.face, turn: move.turn === "'" ? '' : "'" };
}

export function inverseMoves(moves: Move[]): Move[] {
  return [...moves].reverse().map(inverseMove);
}

/**
 * Tach cac nuoc di 180 do ('2') thanh 2 nuoc di 90 do thuan chieu (vi du: L2 -> L, L)
 * Giup giam toc do xoay, cho phep nguoi dung quan sat ro tung nhip 90 do.
 */
export function tachNuocDiDoi(ds_buoc: Move[]): Move[] {
  const kq: Move[] = [];
  for (const buoc of ds_buoc) {
    if (buoc.turn === '2') {
      kq.push({ face: buoc.face, turn: '' });
      kq.push({ face: buoc.face, turn: '' });
    } else {
      kq.push(buoc);
    }
  }
  return kq;
}

