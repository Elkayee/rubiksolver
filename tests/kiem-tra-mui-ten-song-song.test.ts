import { describe, expect, it } from 'vitest';
import type { Face } from '../src/cube/types';
import { layDinhHuongMuiTen3D } from '../src/scene/cube-view-modern';

describe('Kiem tra mui ten 3D song song voi mat Rubik tuong ung', () => {
  it('xac dinh dung mat phang song song cho tat ca 6 mat Rubik', () => {
    const ds_mat: Face[] = ['U', 'D', 'R', 'L', 'F', 'B'];

    ds_mat.forEach((mat) => {
      // Lay thong so toa do va goc quay 3D cua mui ten tren mat Rubik
      const tt = layDinhHuongMuiTen3D(mat);

      // 1. Phai luon danh dau is_song_song la true
      expect(tt.is_song_song).toBe(true);

      // 2. Mat va phap tuyen phai khop voi nhau
      expect(tt.mat).toBe(mat);
      expect(tt.phap_tuyen).toBeDefined();
      expect(tt.vi_tri).toBeDefined();
      expect(tt.goc_quay).toBeDefined();
    });
  });

  it('dam bao mui ten mat Tren (U) va Duoi (D) nam tren mat phang ngang X-Z', () => {
    // Mat Tren U: phap tuyen huong len truc Y (0, 1, 0)
    const tt_u = layDinhHuongMuiTen3D('U');
    expect(tt_u.mat_phang).toBe('X-Z');
    expect(tt_u.phap_tuyen).toEqual([0, 1, 0]);
    expect(tt_u.goc_quay[0]).toBeCloseTo(-Math.PI / 2); // Xoay quanh truc X de nam ngang

    // Mat Duoi D: phap tuyen huong xuong truc Y (0, -1, 0)
    const tt_d = layDinhHuongMuiTen3D('D');
    expect(tt_d.mat_phang).toBe('X-Z');
    expect(tt_d.phap_tuyen).toEqual([0, -1, 0]);
    expect(tt_d.goc_quay[0]).toBeCloseTo(Math.PI / 2); // Xoay quanh truc X de nam ngang
  });

  it('dam bao mui ten mat Phai (R) va Trai (L) nam tren mat phang dung Y-Z', () => {
    // Mat Phai R: phap tuyen huong sang truc X (1, 0, 0)
    const tt_r = layDinhHuongMuiTen3D('R');
    expect(tt_r.mat_phang).toBe('Y-Z');
    expect(tt_r.phap_tuyen).toEqual([1, 0, 0]);
    expect(tt_r.goc_quay[1]).toBeCloseTo(Math.PI / 2); // Xoay quanh truc Y de ap vao mat phai

    // Mat Trai L: phap tuyen huong sang truc -X (-1, 0, 0)
    const tt_l = layDinhHuongMuiTen3D('L');
    expect(tt_l.mat_phang).toBe('Y-Z');
    expect(tt_l.phap_tuyen).toEqual([-1, 0, 0]);
    expect(tt_l.goc_quay[1]).toBeCloseTo(-Math.PI / 2); // Xoay quanh truc Y de ap vao mat trai
  });

  it('dam bao mui ten mat Truoc (F) va Sau (B) nam tren mat phang dung X-Y', () => {
    // Mat Truoc F: phap tuyen huong theo truc Z (0, 0, 1)
    const tt_f = layDinhHuongMuiTen3D('F');
    expect(tt_f.mat_phang).toBe('X-Y');
    expect(tt_f.phap_tuyen).toEqual([0, 0, 1]);
    expect(tt_f.goc_quay).toEqual([0, 0, 0]); // Huong thang mat phang mac dinh

    // Mat Sau B: phap tuyen huong theo truc -Z (0, 0, -1)
    const tt_b = layDinhHuongMuiTen3D('B');
    expect(tt_b.mat_phang).toBe('X-Y');
    expect(tt_b.phap_tuyen).toEqual([0, 0, -1]);
    expect(tt_b.goc_quay[1]).toBeCloseTo(Math.PI); // Quay 180 do de ap vao mat sau
  });

  it('toa do mui ten cach tam Rubik dung khoang cach an toan khong bi chen mat sticker', () => {
    const tt_f = layDinhHuongMuiTen3D('F');
    // Toa do Z cua mat truoc phai lon hon 1.5 (sticker nam o tam 1.5)
    expect(tt_f.vi_tri[2]).toBeGreaterThan(1.5);
    expect(tt_f.vi_tri[0]).toBe(0);
    expect(tt_f.vi_tri[1]).toBe(0);
  });
});
