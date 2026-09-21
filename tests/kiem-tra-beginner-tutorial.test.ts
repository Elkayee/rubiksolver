import { describe, it, expect } from 'vitest';
import { createState, applyMove, applyMoves, isSolved } from '../src/cube/state';
import { parseNotation } from '../src/cube/notation';
import type { CubeState, Move } from '../src/cube/types';
import {
  xacDinhGiaiDoan,
  laDaisyXong,
  laWhiteCrossXong,
  laTang1Xong,
  laTang2Xong,
  laYellowCrossXong,
  laYellowEdgesXong,
  laGoodCornersXong,
  taoHuongDanNuocDi,
  taoBuocHuongDan,
} from '../src/tutorial/detector';

describe('Beginner Tutorial State & Case Detector', () => {
  it('nhan dien SOLVED khi khoi Rubik o trang thai hoan thanh', () => {
    const tt_goc: CubeState = createState();
    const gd: string = xacDinhGiaiDoan(tt_goc);
    expect(gd).toBe('SOLVED');
  });

  it('nhan dien DAISY khi khoi Rubik vua duoc scramble', () => {
    // 1. Tao scramble co dien
    const ds_xao: Move[] = parseNotation("R U R' U'");
    const tt: CubeState = applyMoves(createState(), ds_xao);

    // 2. Kiem tra giai doan bat dau phai la DAISY hoac giai doan thich hop
    const gd: string = xacDinhGiaiDoan(tt);
    expect(gd).toBeDefined();
  });

  it('tach nuoc di doi X2 thanh hai nuoc quarter-turn rieng biet', () => {
    // 1. Tao danh sach nuoc di co chua nuoc doi R2 va U2
    const ds_goc: Move[] = [
      { face: 'R', turn: '2' },
      { face: 'U', turn: "'" },
      { face: 'F', turn: '2' },
    ];

    // 2. Goi ham tach nuoc huong dan
    const ds_hd = taoHuongDanNuocDi(ds_goc);

    // 3. Kiem tra so luong nuoc di sau khi tach: R2 (2) + U' (1) + F2 (2) = 5
    expect(ds_hd.length).toBe(5);
    expect(ds_hd[0].move).toEqual({ face: 'R', turn: '' });
    expect(ds_hd[1].move).toEqual({ face: 'R', turn: '' });
    expect(ds_hd[2].move).toEqual({ face: 'U', turn: "'" });
    expect(ds_hd[3].move).toEqual({ face: 'F', turn: '' });
    expect(ds_hd[4].move).toEqual({ face: 'F', turn: '' });

    // 4. Kiem tra thong tin index va tong so quarter-turns
    expect(ds_hd[0].quarterIndex).toBe(1);
    expect(ds_hd[0].totalQuarters).toBe(5);
    expect(ds_hd[4].quarterIndex).toBe(5);
  });

  it('sinh buoc huong dan chi tiet va khong rong cho moi trang thai', () => {
    // 1. Tao trang thai scramble
    const ds_xao: Move[] = parseNotation("R U R' U' F2 L D2 B");
    const tt: CubeState = applyMoves(createState(), ds_xao);

    // 2. Sinh buoc huong dan
    const buoc = taoBuocHuongDan(tt);

    // 3. Kiem tra cac truong bat buoc theo BEGINNER_GUIDE.md
    expect(buoc.stageId).toBeDefined();
    expect(buoc.caseId).toBeDefined();
    expect(buoc.titleVn).toBeTruthy();
    expect(buoc.titleEn).toBeTruthy();
    expect(buoc.explanationVn).toBeTruthy();
    expect(buoc.explanationEn).toBeTruthy();
    expect(buoc.cameraCue).toBeDefined();
  });

  it('Righty move co dung 4 nuoc quarter-turn R, U, R prime, U prime', () => {
    // 1. Dinh nghia Righty move
    const righty: Move[] = [
      { face: 'R', turn: '' },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
      { face: 'U', turn: "'" },
    ];

    // 2. Tach nuoc di
    const hd = taoHuongDanNuocDi(righty);
    expect(hd.length).toBe(4);
    expect(hd[0].move.face).toBe('R');
    expect(hd[1].move.face).toBe('U');
    expect(hd[2].move.face).toBe('R');
    expect(hd[2].move.turn).toBe("'");
    expect(hd[3].move.face).toBe('U');
    expect(hd[3].move.turn).toBe("'");
  });

  it('Sune algorithm tach nuoc U2 thanh hai nuoc Up rieng biet (tong cong 8 moves)', () => {
    // 1. Sune goc: R U R' U R U2 R'
    const sune: Move[] = [
      { face: 'R', turn: '' },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
      { face: 'U', turn: '' },
      { face: 'R', turn: '' },
      { face: 'U', turn: '2' },
      { face: 'R', turn: "'" },
    ];

    // 2. Chuyen thanh danh sach huong dan
    const hd = taoHuongDanNuocDi(sune);

    // 3. U2 phai thanh 2 nuoc U, tong so nuoc la 8
    expect(hd.length).toBe(8);
    expect(hd[5].move).toEqual({ face: 'U', turn: '' });
    expect(hd[6].move).toEqual({ face: 'U', turn: '' });
  });

  it('Niklas algorithm co dung 8 nuoc quarter-turn', () => {
    // 1. Niklas: R U' L' U R' U' L U
    const niklas: Move[] = [
      { face: 'R', turn: '' },
      { face: 'U', turn: "'" },
      { face: 'L', turn: "'" },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
      { face: 'U', turn: "'" },
      { face: 'L', turn: '' },
      { face: 'U', turn: '' },
    ];

    const hd = taoHuongDanNuocDi(niklas);
    expect(hd.length).toBe(8);
  });
});
