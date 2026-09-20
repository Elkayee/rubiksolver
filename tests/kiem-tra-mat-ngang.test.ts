import { describe, expect, it } from 'vitest';
import type { Face, Move } from '../src/cube/types';
import { FACE_NAMES_VN } from '../src/scene/cube-view-modern';

// Ham kiem tra mot mat rubik co phai la mat ngang (tren/duoi) hay khong
export function laMatNgang(ten_mat: Face): boolean {
  // Mat U (Tren) va D (Duoi) nam tren mat phang ngang X-Z
  return ten_mat === 'U' || ten_mat === 'D';
}

// Ham dinh dang thong bao va xac dinh huong mui ten theo mat xoay
export function layDinhDangMatNgang(buoc: Move) {
  const ten_mat = buoc.face;
  const is_ngang = laMatNgang(ten_mat);
  const tt_mat = FACE_NAMES_VN[ten_mat];

  // Ten dinh huong de gan vao thuoc tinh DOM data-orientation
  const huong_hien_thi = is_ngang ? 'horizontal' : 'vertical';

  // Mo ta chi tiet chieu quay kem chu thich mat ngang
  let mo_ta = '';
  if (is_ngang) {
    if (buoc.turn === "'") {
      mo_ta = `Xoay ngang ${tt_mat.vn.toLowerCase()} ngược chiều kim đồng hồ (90° CCW)`;
    } else if (buoc.turn === '2') {
      mo_ta = `Xoay ngang ${tt_mat.vn.toLowerCase()} nửa vòng (180°)`;
    } else {
      mo_ta = `Xoay ngang ${tt_mat.vn.toLowerCase()} theo chiều kim đồng hồ (90° CW)`;
    }
  } else {
    if (buoc.turn === "'") {
      mo_ta = `Xoay đứng ${tt_mat.vn.toLowerCase()} ngược chiều kim đồng hồ (90° CCW)`;
    } else if (buoc.turn === '2') {
      mo_ta = `Xoay đứng ${tt_mat.vn.toLowerCase()} nửa vòng (180°)`;
    } else {
      mo_ta = `Xoay đứng ${tt_mat.vn.toLowerCase()} theo chiều kim đồng hồ (90° CW)`;
    }
  }

  return {
    ten_mat,
    is_ngang,
    huong_hien_thi,
    mo_ta,
  };
}

describe('Kiem tra logic mui ten nam ngang cho mat Tren (U) va Duoi (D)', () => {
  it('xac dinh dung mat U va D la mat ngang', () => {
    // Mat tren (U) phai la mat ngang
    const kq_u = laMatNgang('U');
    expect(kq_u).toBe(true);

    // Mat duoi (D) phai la mat ngang
    const kq_d = laMatNgang('D');
    expect(kq_d).toBe(true);
  });

  it('xac dinh dung cac mat dung (R, L, F, B) khong phai mat ngang', () => {
    const ds_mat_dung: Face[] = ['R', 'L', 'F', 'B'];
    ds_mat_dung.forEach((mat) => {
      const kq = laMatNgang(mat);
      expect(kq).toBe(false);
    });
  });

  it('tra ve thuoc tinh horizontal va mo ta xoay ngang cho buoc U', () => {
    const buoc_u: Move = { face: 'U', turn: '' };
    const kq = layDinhDangMatNgang(buoc_u);

    expect(kq.is_ngang).toBe(true);
    expect(kq.huong_hien_thi).toBe('horizontal');
    expect(kq.mo_ta).toContain('Xoay ngang mặt trên');
    expect(kq.mo_ta).toContain('90° CW');
  });

  it('tra ve thuoc tinh horizontal va mo ta xoay ngang cho buoc D phay', () => {
    const buoc_d: Move = { face: 'D', turn: "'" };
    const kq = layDinhDangMatNgang(buoc_d);

    expect(kq.is_ngang).toBe(true);
    expect(kq.huong_hien_thi).toBe('horizontal');
    expect(kq.mo_ta).toContain('Xoay ngang mặt dưới');
    expect(kq.mo_ta).toContain('90° CCW');
  });

  it('tra ve thuoc tinh vertical cho buoc R2 mat dung', () => {
    const buoc_r2: Move = { face: 'R', turn: '2' };
    const kq = layDinhDangMatNgang(buoc_r2);

    expect(kq.is_ngang).toBe(false);
    expect(kq.huong_hien_thi).toBe('vertical');
    expect(kq.mo_ta).toContain('Xoay đứng mặt phải');
    expect(kq.mo_ta).toContain('180°');
  });
});
