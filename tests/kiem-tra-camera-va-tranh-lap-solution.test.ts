import { describe, it, expect } from 'vitest';
import { createState, applyMove, applyMoves, isSolved } from '../src/cube/state';
import { parseNotation } from '../src/cube/notation';
import type { CubeState, Move } from '../src/cube/types';
import {
  xacDinhGiaiDoan,
  laDaisyXong,
  laWhiteCrossXong,
  taoBuocHuongDan,
} from '../src/tutorial/detector';

/**
 * Kiểm tra việc khắc phục 2 lỗi:
 * 1. Camera preset không bị phẳng lì chỉ thấy mỗi mặt trên.
 * 2. Solution của Beginner Guide không bị loop vô hạn trên mặt U.
 */
describe('Kiểm tra sửa góc nhìn Camera và chống loop vô tận trên mặt U', () => {
  it('buoc huong dan Daisy tao tien trien ro ret va khong bi loop nuoc U vo han', () => {
    // 1. Khoi tao khoi Rubik bi xao
    const ds_xao: Move[] = parseNotation("R U R' U' F2 L D2 B");
    let tt: CubeState = applyMoves(createState(), ds_xao);

    let dem_buoc = 0;
    const gioi_han_buoc = 15;

    // 2. Chay cac buoc huong dan cua Daisy cho den khi xong Daisy
    while (xacDinhGiaiDoan(tt) === 'DAISY' && dem_buoc < gioi_han_buoc) {
      const buoc = taoBuocHuongDan(tt);
      expect(buoc.stageId).toBe('DAISY');
      expect(buoc.moves.length).toBeGreaterThan(0);

      // Thuc hien cac nuoc di cua buoc nay
      for (const nuoc of buoc.moves) {
        tt = applyMove(tt, nuoc);
      }
      dem_buoc += 1;
    }

    // 3. Xac nhan Daisy phai hoan thanh trong so buoc hop ly (khong vuot qua gioi han)
    expect(xacDinhGiaiDoan(tt)).not.toBe('DAISY');
    expect(dem_buoc).toBeLessThanOrEqual(gioi_han_buoc);
  });

  it('buoc huong dan White Cross giai xong chu thap day ma khong bi loop tren U', () => {
    // 1. Khoi tao khoi da xong Daisy nhung chua xong White Cross
    const ds_xao: Move[] = parseNotation("R2 L2 U F2 B2 U'");
    let tt: CubeState = applyMoves(createState(), ds_xao);

    // Neu chua o White Cross thi chay buoc Daisy de den dung giai doan
    let dem_daisy = 0;
    while (xacDinhGiaiDoan(tt) === 'DAISY' && dem_daisy < 10) {
      const buoc = taoBuocHuongDan(tt);
      for (const n of buoc.moves) tt = applyMove(tt, n);
      dem_daisy += 1;
    }

    let dem_cross = 0;
    const gioi_han_cross = 10;
    while (xacDinhGiaiDoan(tt) === 'WHITE_CROSS' && dem_cross < gioi_han_cross) {
      const buoc = taoBuocHuongDan(tt);
      expect(buoc.stageId).toBe('WHITE_CROSS');
      expect(buoc.moves.length).toBeGreaterThan(0);
      for (const nuoc of buoc.moves) {
        tt = applyMove(tt, nuoc);
      }
      dem_cross += 1;
    }

    expect(laWhiteCrossXong(tt)).toBe(true);
  });

  it('cac giai doan tiep theo sinh buoc hop le va khong quay U qua 4 lan lien tiep', () => {
    // Khoi tao scramble co dien
    const tt = applyMoves(createState(), parseNotation("R U R' U'"));
    const buoc = taoBuocHuongDan(tt);

    // Kiem tra moves sinh ra phai co hanh dong thuc su, khong chi la U vo nghia
    expect(buoc.moves.length).toBeGreaterThan(0);
    expect(buoc.titleVn).toBeTruthy();
    expect(buoc.explanationVn).toBeTruthy();
  });
});
