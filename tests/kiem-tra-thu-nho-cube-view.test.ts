import { describe, it, expect } from 'vitest';
import { CAU_HINH_CAMERA, CAMERA_CONFIG } from '../src/scene/cube-view-modern';

/**
 * Tinh khoang cach tu goc toa do (0, 0, 0) den vi tri camera (x, y, z)
 */
function tinhKhoangCach(vt: [number, number, number]): number {
  const [x, y, z] = vt;
  return Math.sqrt(x * x + y * y + z * z);
}

describe('Kiem tra thu nho Cube View de quan sat toan bo khoi Rubik 3D', () => {
  it('cau hinh camera fov va khoang cach lui xa giup cube nho gon, vua van man hinh', () => {
    // 1. Kiem tra truong fov da duoc mo rong tu 34 len it nhat 40 do
    expect(CAU_HINH_CAMERA.fov).toBeGreaterThanOrEqual(40);

    // 2. Kiem tra gioi han zoom out (maxDistance) cho phep nguoi dung zoom xa
    expect(CAU_HINH_CAMERA.maxDistance).toBeGreaterThanOrEqual(16);

    // 3. Kiem tra khoang cach mac dinh cua camera lui xa >= 9.5 don vi
    const kc_md = tinhKhoangCach(CAU_HINH_CAMERA.viTriMacDinh);
    expect(kc_md).toBeGreaterThanOrEqual(9.5);

    // 4. Kiem tra CAMERA_CONFIG la alias cua CAU_HINH_CAMERA
    expect(CAMERA_CONFIG).toBe(CAU_HINH_CAMERA);
  });

  it('tat ca cac goc nhin preset deu co khoang cach camera lui xa du de bao quat toan bo khoi', () => {
    // Danh sach tat ca preset can thiet cho ung dung va huong dan beginner
    const ds_preset = ['top', 'bottom', 'front', 'front-right', 'front-left', 'stage8-lock'];

    for (const ten of ds_preset) {
      const vi_tri = CAU_HINH_CAMERA.gocNhin[ten];
      expect(vi_tri).toBeDefined();

      // Khoang cach cua moi preset phai >= 8.8 don vi de Rubik khong bi sat mep man hinh
      const kc = tinhKhoangCach(vi_tri);
      expect(kc).toBeGreaterThanOrEqual(8.8);
    }
  });

  it('preset top co goc nhin 3D nang du cao de nhin ro mat U dong thoi quan sat ca F va R', () => {
    const vi_tri_top = CAU_HINH_CAMERA.gocNhin['top'];
    const [x, y, z] = vi_tri_top;

    // Do cao y phai lon hon x va z nhung van co thanh phan x > 0 va z > 0 (khong bi phang 2D)
    expect(y).toBeGreaterThan(x);
    expect(y).toBeGreaterThan(z);
    expect(x).toBeGreaterThan(0);
    expect(z).toBeGreaterThan(0);
  });
});
