import { describe, it, expect } from 'vitest';
import * as http from 'http';

/**
 * Ham gui yeu cau GET ngan gon bang thu vien http noi sinh
 */
function guiGet(url: string, thoi_gian_cho_ms = 3000): Promise<{ ma_loi?: string; ma_http?: number; du_lieu?: any }> {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: thoi_gian_cho_ms }, (res) => {
      let xau = '';
      res.on('data', (chunk) => { xau += chunk; });
      res.on('end', () => {
        try {
          resolve({ ma_http: res.statusCode, du_lieu: JSON.parse(xau) });
        } catch {
          resolve({ ma_http: res.statusCode, du_lieu: xau });
        }
      });
    });
    req.on('error', (err) => resolve({ ma_loi: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ma_loi: 'timeout' });
    });
  });
}

describe('Kiem tra nguyen nhan Context Engine timeout', () => {
  it('cong 6699 van phan hoi /api/config binh thuong chung to router process dang chay', async () => {
    const kq = await guiGet('http://127.0.0.1:6699/api/config', 3000);
    expect(kq.ma_loi).toBeUndefined();
    expect(kq.ma_http).toBe(200);
    expect(kq.du_lieu?.version).toBeDefined();
  });

  it('danh sach repo chua cac ban ghi duong dan trung lap co tien to khac nhau gay lech key worker', async () => {
    const kq = await guiGet('http://127.0.0.1:6699/api/config', 3000);
    const ds_kho: string[] = kq.du_lieu?.repos || [];
    
    // Phat hien cac duong dan kho rubiksolver bi trung lap giua co va khong co tien to \\?\
    const ds_rubik = ds_kho.filter((k) => k.toLowerCase().includes('rubiksolver'));
    expect(ds_rubik.length).toBeGreaterThanOrEqual(2);
  });
});
