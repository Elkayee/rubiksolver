import { describe, expect, it } from 'vitest';
import { applyMove, applyMoves, createState, isSolved } from '../src/cube/state';
import { formatMoves, inverseMove, parseNotation } from '../src/cube/notation';
import type { CubeState, Move } from '../src/cube/types';

// Ham khoi phuc trang thai ve buoc 0 bang cach ap dung nghich dao cac buoc da di
function quay_ve_dau(trang_thai_ht: CubeState, cac_buoc: Move[], chi_so_buoc: number): CubeState {
  let kq = trang_thai_ht;
  for (let i = chi_so_buoc - 1; i >= 0; i -= 1) {
    const buoc_nghich = inverseMove(cac_buoc[i]);
    kq = applyMove(kq, buoc_nghich);
  }
  return kq;
}

describe('Kiem tra logic nut Restart (Di tu dau ve buoc 0)', () => {
  it('khoi phuc chinh xac trang thai ban dau khi da di den giua solution', () => {
    // 1. Tao trang thai scramble ban dau
    const xao = parseNotation("R U R' U' F2 D");
    const trang_thai_goc = applyMoves(createState(), xao);

    // 2. Gia su loi giai bao gom cac buoc sau
    const cac_buoc_giai = parseNotation("D' F2 U R U' R'");

    // 3. Cho nguoi dung di 4 buoc dau tien trong loi giai
    const chi_so_buoc = 4;
    let trang_thai_hien_tai = trang_thai_goc;
    for (let i = 0; i < chi_so_buoc; i += 1) {
      trang_thai_hien_tai = applyMove(trang_thai_hien_tai, cac_buoc_giai[i]);
    }

    // 4. Nhan nut Restart -> quay nguoc ve buoc 0
    const trang_thai_sau_restart = quay_ve_dau(trang_thai_hien_tai, cac_buoc_giai, chi_so_buoc);

    // 5. Trang thai sau restart phai giong het trang thai goc ban dau
    expect(trang_thai_sau_restart.facelets).toBe(trang_thai_goc.facelets);
  });

  it('khoi phuc ve trang thai goc khi da di het toan bo loi giai (solved)', () => {
    const xao = parseNotation("F R U' R' U F'");
    const trang_thai_goc = applyMoves(createState(), xao);
    // Loi giai chinh la day buoc nghich dao cua xao dao nguoc thu tu
    const cac_buoc_giai = xao.slice().reverse().map(inverseMove);

    // Di toan bo cac buoc giai
    let trang_thai_hien_tai = trang_thai_goc;
    for (const buoc of cac_buoc_giai) {
      trang_thai_hien_tai = applyMove(trang_thai_hien_tai, buoc);
    }
    expect(isSolved(trang_thai_hien_tai)).toBe(true);

    // Nhan Restart tu buoc cuoi cung
    const trang_thai_sau_restart = quay_ve_dau(trang_thai_hien_tai, cac_buoc_giai, cac_buoc_giai.length);

    // Phai tro lai dung trang thai truoc khi giai
    expect(trang_thai_sau_restart.facelets).toBe(trang_thai_goc.facelets);
  });

  it('khong thay doi gi neu chi_so_buoc dang o 0', () => {
    const trang_thai_goc = createState();
    const cac_buoc_giai = parseNotation("R U R' U'");

    const trang_thai_sau_restart = quay_ve_dau(trang_thai_goc, cac_buoc_giai, 0);
    expect(trang_thai_sau_restart.facelets).toBe(trang_thai_goc.facelets);
  });
});
