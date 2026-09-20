import { describe, expect, it } from 'vitest';
import { parseNotation, formatMoves, tachNuocDiDoi } from '../src/cube/notation';
import { applyMove, applyMoves, createState, isSolved } from '../src/cube/state';
import type { Move } from '../src/cube/types';

describe('Kiem tra tinh nang tach nuoc di 180 do (L2 -> L, L) de giam speed', () => {
  it('tach nuoc di L2 thanh 2 buoc L lien tiep', () => {
    // Dau vao la nuoc di L2 (quay 180 do)
    const ds_goc: Move[] = [{ face: 'L', turn: '2' }];
    const ds_tach = tachNuocDiDoi(ds_goc);

    // Ket qua phai la 2 buoc L (90 do) rieng biet
    expect(ds_tach).toHaveLength(2);
    expect(ds_tach[0]).toEqual({ face: 'L', turn: '' });
    expect(ds_tach[1]).toEqual({ face: 'L', turn: '' });
    expect(formatMoves(ds_tach)).toBe('L L');
  });

  it('tach tat ca cac nuoc di doi (U2, D2, R2, F2, B2) thanh 2 buoc don', () => {
    const chuoi_nhap = 'U2 D2 R2 L2 F2 B2';
    const ds_buoc = parseNotation(chuoi_nhap);
    const ds_tach = tachNuocDiDoi(ds_buoc);

    // 6 nuoc di doi phai thanh 12 nuoc di don
    expect(ds_tach).toHaveLength(12);
    expect(formatMoves(ds_tach)).toBe('U U D D R R L L F F B B');
  });

  it('giu nguyen cac nuoc di don (90 do) va nuoc di nghich (nguoc chieu kim dong ho)', () => {
    const chuoi_nhap = "R U R' U'";
    const ds_buoc = parseNotation(chuoi_nhap);
    const ds_tach = tachNuocDiDoi(ds_buoc);

    // Cac nuoc khong phai '2' phai duoc giu nguyen ven
    expect(ds_tach).toEqual(ds_buoc);
    expect(formatMoves(ds_tach)).toBe("R U R' U'");
  });

  it('dam bao trang thai Rubik sau khi chay [L, L] tuong duong tuyet doi voi [L2]', () => {
    const tt_goc = createState();

    // 1. Thuc hien truc tiep nuoc di L2
    const tt_l2 = applyMoves(tt_goc, parseNotation('L2'));

    // 2. Thuc hien 2 nuoc di L lien tiep
    const tt_ll = applyMoves(tt_goc, parseNotation('L L'));

    // Hai trang thai facelets phai trung khop nhau 100%
    expect(tt_ll.facelets).toBe(tt_l2.facelets);
    expect(tt_ll).toEqual(tt_l2);
  });

  it('giai scramble hop le khi cac buoc duoc tach ra thanh nuoc don', () => {
    const tt_goc = createState();
    // Scramble co chua cac nuoc di doi
    const ds_xao = parseNotation("R2 U2 F2 L2");
    const tt_xao = applyMoves(tt_goc, ds_xao);

    // Nghich dao chuoi xao sau khi da tach doi
    const ds_tach = tachNuocDiDoi(ds_xao);
    const ds_giai = [...ds_tach].reverse().map((b) => ({
      face: b.face,
      turn: b.turn === "'" ? '' : ("'" as Move['turn']),
    }));

    const tt_sau_giai = applyMoves(tt_xao, ds_giai);
    expect(isSolved(tt_sau_giai)).toBe(true);
  });
});
