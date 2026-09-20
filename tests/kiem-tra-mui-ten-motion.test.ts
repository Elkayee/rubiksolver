import { describe, expect, it } from 'vitest';
import { FACE_NAMES_VN } from '../src/scene/cube-view-modern';
import type { Face, Move } from '../src/cube/types';

// Ham xac dinh huong va so vong xoay theo quy uoc
export function layThongTinXoay(buoc: Move, luot = 1, tong_luot = 1) {
  const ten_mat = FACE_NAMES_VN[buoc.face];
  let huong_quay = 'CW ↻';
  let kieu_mui_ten = 'cw';
  let so_vong = 'Xoay 1/4 vòng (90°) theo chiều kim đồng hồ';

  if (buoc.turn === "'") {
    huong_quay = 'CCW ↺';
    kieu_mui_ten = 'ccw';
    so_vong = 'Xoay ngược 1/4 vòng (90°) ngược chiều kim đồng hồ';
  } else if (buoc.turn === '2') {
    huong_quay = '180° ↻↻';
    kieu_mui_ten = 'double';
    so_vong = `Xoay nửa vòng (180° — 2 lượt) • Đang quay lượt ${luot}/${tong_luot}`;
  }

  return {
    ten_mat_vn: ten_mat.vn,
    ten_mat_en: ten_mat.en,
    huong_quay,
    kieu_mui_ten,
    so_vong,
    tien_do: `${luot}/${tong_luot}`,
  };
}

describe('Kiem tra mui ten va thong tin xoay mat Rubik', () => {
  it('anh xa dung du 6 mat Rubik sang tieng Viet', () => {
    const ds_mat: Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];
    ds_mat.forEach((mat) => {
      const tt = FACE_NAMES_VN[mat];
      expect(tt.vn).toBeDefined();
      expect(tt.en).toBeDefined();
    });

    expect(FACE_NAMES_VN['R'].vn).toBe('Mặt Phải');
    expect(FACE_NAMES_VN['U'].vn).toBe('Mặt Trên');
    expect(FACE_NAMES_VN['F'].vn).toBe('Mặt Trước');
    expect(FACE_NAMES_VN['D'].vn).toBe('Mặt Dưới');
    expect(FACE_NAMES_VN['L'].vn).toBe('Mặt Trái');
    expect(FACE_NAMES_VN['B'].vn).toBe('Mặt Sau');
  });

  it('xac dinh dung mui ten thuan (CW) khi xoay 1/4 vong 90 do', () => {
    const buoc_r: Move = { face: 'R', turn: '' };
    const kq = layThongTinXoay(buoc_r, 1, 1);
    expect(kq.kieu_mui_ten).toBe('cw');
    expect(kq.huong_quay).toContain('CW');
    expect(kq.so_vong).toContain('90°');
    expect(kq.tien_do).toBe('1/1');
  });

  it('xac dinh dung mui ten nghich (CCW) khi xoay nguoc 1/4 vong', () => {
    const buoc_u_phay: Move = { face: 'U', turn: "'" };
    const kq = layThongTinXoay(buoc_u_phay, 1, 1);
    expect(kq.kieu_mui_ten).toBe('ccw');
    expect(kq.huong_quay).toContain('CCW');
    expect(kq.so_vong).toContain('Xoay ngược');
    expect(kq.tien_do).toBe('1/1');
  });

  it('xac dinh dung mui ten kep (double) khi xoay nua vong 180 do voi 2 luot', () => {
    const buoc_f2: Move = { face: 'F', turn: '2' };
    const kq_luot_1 = layThongTinXoay(buoc_f2, 1, 2);
    expect(kq_luot_1.kieu_mui_ten).toBe('double');
    expect(kq_luot_1.huong_quay).toContain('180°');
    expect(kq_luot_1.so_vong).toContain('lượt 1/2');
    expect(kq_luot_1.tien_do).toBe('1/2');

    const kq_luot_2 = layThongTinXoay(buoc_f2, 2, 2);
    expect(kq_luot_2.so_vong).toContain('lượt 2/2');
    expect(kq_luot_2.tien_do).toBe('2/2');
  });
});
