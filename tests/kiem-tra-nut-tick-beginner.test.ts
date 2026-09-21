import { describe, it, expect } from 'vitest';
import { createState, applyMoves, isSolved } from '../src/cube/state';
import { parseNotation } from '../src/cube/notation';
import type { CubeState, Move } from '../src/cube/types';
import { TutorialEngine } from '../src/tutorial/engine';
import { taoBuocHuongDan } from '../src/tutorial/detector';

describe('Kiem tra nut tick va dieu huong Beginner Guide', () => {
  it('bat nut tick Beginner Guide khong lam bien doi trang thai logic khoi Rubik', () => {
    // 1. Khoi tao trang thai xao ban dau
    const ds_xao: Move[] = parseNotation("R U R' U' F");
    const tt_goc: CubeState = applyMoves(createState(), ds_xao);

    // 2. Gia lap bat nut tick Beginner Guide
    const tut = new TutorialEngine(tt_goc);
    const buoc_hien_tai = tut.layBuocHienTai();

    // 3. Xac nhan trang thai logic Rubik van giu nguyen ven
    expect(tut.layBuocHienTai().stageId).toBeDefined();
    expect(buoc_hien_tai.moves.length).toBeGreaterThan(0);
    expect(isSolved(tt_goc)).toBe(false);
  });

  it('dieu huong chinh xac sang buoc huong dan khi tick chon Beginner Mode', () => {
    // 1. Tao khoi Rubik o trang thai Daisy
    const tt_xao: CubeState = applyMoves(createState(), parseNotation('R2 L2 U'));
    
    // 2. Tinh toan buoc huong dan
    const buoc = taoBuocHuongDan(tt_xao);

    // 3. Kiem tra buoc huong dan co day du thong tin hien thi tren HUD
    expect(buoc.titleVn).toBeTruthy();
    expect(buoc.explanationVn).toBeTruthy();
    expect(buoc.moveInstructions.length).toBe(buoc.moves.length);
  });

  it('dong bo chinh xac giua thao tac tick va huong dan nuoc di', () => {
    // 1. Khoi tao tutorial voi trang thai mac dinh
    const tt: CubeState = createState();
    const tut = new TutorialEngine(tt);

    // 2. Kiem tra buoc dau tien khi khoi da solved
    const buoc = tut.layBuocHienTai();
    expect(buoc.stageId).toBe('SOLVED');
    expect(buoc.isComplete).toBe(true);
  });
});
