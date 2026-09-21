import { describe, expect, it } from 'vitest';
import type { Face } from '../src/cube/types';
import { HE_SO_KC_MUI_TEN, layDinhHuongMuiTen3D } from '../src/scene/cube-view-modern';

describe('Kiểm tra khoảng cách mũi tên 3D xoay cách xa mặt khối Rubik', () => {
  it('hệ số khoảng cách mũi tên phải đủ lớn (>= 2.0) để tách biệt rõ ràng khỏi khối Rubik', () => {
    // 1. Hệ số khoảng cách cấu hình phải lớn hơn mức cũ (1.58) đáng kể
    expect(HE_SO_KC_MUI_TEN).toBeGreaterThanOrEqual(2.0);
  });

  it('tất cả 6 mặt Rubik đều có tọa độ mũi tên lơ lửng cách xa mặt sticker ít nhất 0.5 đơn vị', () => {
    // Bề mặt sticker ngoài cùng của khối Rubik nằm ở khoảng 1.55 (1.06 * 1 + 0.49)
    const kc_be_mat_cube = 1.55;
    const ds_mat: Face[] = ['U', 'D', 'R', 'L', 'F', 'B'];

    ds_mat.forEach((mat) => {
      // Lấy thông số định hướng 3D của mũi tên
      const tt = layDinhHuongMuiTen3D(mat);

      // Tính khoảng cách từ tâm (0, 0, 0) đến vị trí mũi tên
      const kc_tam = Math.sqrt(
        tt.vi_tri[0] * tt.vi_tri[0] +
        tt.vi_tri[1] * tt.vi_tri[1] +
        tt.vi_tri[2] * tt.vi_tri[2]
      );

      // Độ hở giữa mũi tên và bề mặt ngoài của Rubik
      const do_ho = kc_tam - kc_be_mat_cube;

      // Đảm bảo mũi tên không bị dính sát vào mặt Rubik (độ hở >= 0.5 đơn vị)
      expect(do_ho).toBeGreaterThanOrEqual(0.5);
    });
  });

  it('tọa độ mũi tên mặt Trước (F) và Sau (B) tách xa trên trục Z', () => {
    const tt_f = layDinhHuongMuiTen3D('F');
    const tt_b = layDinhHuongMuiTen3D('B');

    // Mặt Trước F có tọa độ Z dương và lớn hơn 2.2
    expect(tt_f.vi_tri[2]).toBeGreaterThan(2.2);
    expect(tt_f.vi_tri[0]).toBe(0);
    expect(tt_f.vi_tri[1]).toBe(0);

    // Mặt Sau B có tọa độ Z âm và nhỏ hơn -2.2
    expect(tt_b.vi_tri[2]).toBeLessThan(-2.2);
    expect(tt_b.vi_tri[0]).toBe(0);
    expect(tt_b.vi_tri[1]).toBe(0);
  });

  it('tọa độ mũi tên mặt Trên (U) và Dưới (D) tách xa trên trục Y', () => {
    const tt_u = layDinhHuongMuiTen3D('U');
    const tt_d = layDinhHuongMuiTen3D('D');

    // Mặt Trên U có tọa độ Y dương và lớn hơn 2.2
    expect(tt_u.vi_tri[1]).toBeGreaterThan(2.2);
    expect(tt_u.vi_tri[0]).toBe(0);
    expect(tt_u.vi_tri[2]).toBe(0);

    // Mặt Dưới D có tọa độ Y âm và nhỏ hơn -2.2
    expect(tt_d.vi_tri[1]).toBeLessThan(-2.2);
    expect(tt_d.vi_tri[0]).toBe(0);
    expect(tt_d.vi_tri[2]).toBe(0);
  });
});
