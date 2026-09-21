import { describe, it, expect } from 'vitest';
import { createState, applyMove, applyMoves, isSolved } from '../src/cube/state';
import { parseNotation, formatMove } from '../src/cube/notation';
import type { CubeState, Move } from '../src/cube/types';
import { TutorialEngine } from '../src/tutorial/engine';
import { taoBuocHuongDan } from '../src/tutorial/detector';
import { validateCubeState } from '../src/cube/validator';

/**
 * Kiểm tra việc xoay trực tiếp các nước đi của Beginner Guide trên cùng khối Rubik
 * mà không cần chuyển đổi màn hình hay tạo view khác.
 */
describe('Kiểm tra xoay trực tiếp trên khối Rubik hiện tại cho Beginner Guide', () => {
  it('cac nuoc di Beginner duoc nạp truc tiep va xoay tren cung khoi Rubik', () => {
    // 1. Khoi tao trang thai xao khoi Rubik
    const ds_xao: Move[] = parseNotation("R U R' U'");
    let tt_hien_tai: CubeState = applyMoves(createState(), ds_xao);
    const tt_goc_facelets = tt_hien_tai.facelets;

    // 2. Lay buoc huong dan Beginner cho trang thai nay
    const buoc = taoBuocHuongDan(tt_hien_tai);
    expect(buoc.moves.length).toBeGreaterThan(0);

    // 3. Xoay truc tiep tung nuoc di tren cung trang thai Rubik
    for (const nuoc of buoc.moves) {
      // Moi nuoc di deu la quarter-turn (1/4 vong), khong phai turn doi '2'
      expect(nuoc.turn).not.toBe('2');
      tt_hien_tai = applyMove(tt_hien_tai, nuoc);
    }

    // 4. Xac nhan trang thai da thay doi hop le ma khong bi loi dinh dang
    expect(tt_hien_tai.facelets).not.toBe(tt_goc_facelets);
    const ket_qua_kiem_tra = validateCubeState(tt_hien_tai);
    expect(ket_qua_kiem_tra.valid).toBe(true);
  });

  it('TutorialEngine cung cap nuoc di tuan tu cho bo dieu khien playback hien co', () => {
    // 1. Khoi tao cube can giai
    const tt_dau: CubeState = applyMoves(createState(), parseNotation('F R U'));
    const tut = new TutorialEngine(tt_dau);

    // 2. Lay danh sach nuoc di can phat
    const buoc = tut.layBuocHienTai();
    const ds_nuoc = buoc.moves;
    expect(ds_nuoc.length).toBeGreaterThan(0);

    // 3. Mo phong Playback tuan tu tung buoc giong nhu nut Next tren giao dien
    let tt_chay = tt_dau;
    for (let chi_so = 0; chi_so < ds_nuoc.length; chi_so += 1) {
      const nuoc_tiep = tut.layNuocDiTiepTheo();
      expect(nuoc_tiep).toBeDefined();
      if (nuoc_tiep) {
        tt_chay = applyMove(tt_chay, nuoc_tiep);
        tut.ghiNhanDaXoayXongMotNuoc(nuoc_tiep);
      }
    }

    // 4. Kiem tra tinh toan van toan ven
    expect(validateCubeState(tt_chay).valid).toBe(true);
  });

  it('chuyen tiep buoc tu dong tren cung khoi Rubik khi hoan thanh mot giai doan', () => {
    // 1. Khoi tao khoi Rubik da xong hoa cuc, can dua canh xuong tao chu thap trang
    const tt_daisy: CubeState = applyMoves(createState(), parseNotation('U'));
    const tut = new TutorialEngine(tt_daisy);
    const buoc_1 = tut.layBuocHienTai();

    // 2. Chay het nuoc cua buoc 1
    for (const nuoc of buoc_1.moves) {
      tut.ghiNhanDaXoayXongMotNuoc(nuoc);
    }

    // 3. Kiem tra buoc moi da duoc cap nhat ngay tren engine
    const buoc_2 = tut.layBuocHienTai();
    expect(buoc_2).toBeDefined();
    expect(buoc_2.titleVn).toBeTruthy();
  });
});
