import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Kiem tra dat bang Beginner Guide ben ngoai khung cube', () => {
  it('bang beginner-hud khong con nam ben trong khung cube-stage ma nam o aside control-column', () => {
    // 1. Doc noi dung tep src/main.ts
    const duong_dan = path.resolve(__dirname, '../src/main.ts');
    const noi_dung = fs.readFileSync(duong_dan, 'utf-8');

    // 2. Tim vi tri cua the cube-stage va the ket thuc cua no
    const vt_stage_mo = noi_dung.indexOf('<div id="cube-stage"');
    const vt_stage_dong = noi_dung.indexOf('<div class="viewer-hint"');
    expect(vt_stage_mo).toBeGreaterThan(0);
    expect(vt_stage_dong).toBeGreaterThan(vt_stage_mo);

    // 3. Cat doan ma ben trong khung cube-stage
    const doan_cube = noi_dung.substring(vt_stage_mo, vt_stage_dong);

    // 4. Xac nhan bang beginner-hud hoan toan KHONG nam ben trong khung cube-stage
    expect(doan_cube.includes('id="beginner-hud"')).toBe(false);

    // 5. Tim vi tri cua aside control-column va xac nhan bang beginner-hud nam ben trong cot dieu khien
    const vt_aside = noi_dung.indexOf('<aside class="control-column"');
    const vt_hud = noi_dung.indexOf('id="beginner-hud"');
    expect(vt_aside).toBeGreaterThan(0);
    expect(vt_hud).toBeGreaterThan(vt_aside);
  });

  it('style cua beginner-hud khong dung position absolute de tranh chong de len giao dien 3D', () => {
    // 1. Doc noi dung tep src/style.css
    const duong_dan_css = path.resolve(__dirname, '../src/style.css');
    const css = fs.readFileSync(duong_dan_css, 'utf-8');

    // 2. Trich xuat block css cua beginner-hud
    const vt_css_hud = css.indexOf('.beginner-guide-panel,');
    expect(vt_css_hud).toBeGreaterThan(0);

    const doan_css = css.substring(vt_css_hud, vt_css_hud + 350);

    // 3. Xac nhan khong co position: absolute ma dung position: static hoac luong tu nhien
    expect(doan_css.includes('position: absolute')).toBe(false);
    expect(doan_css.includes('pointer-events: none')).toBe(false);
  });

  it('bang beginner-hud chua day du cac phan tu thong tin cho nguoi moi', () => {
    const duong_dan = path.resolve(__dirname, '../src/main.ts');
    const noi_dung = fs.readFileSync(duong_dan, 'utf-8');

    // Kiem tra cac the thong tin chinh ben trong bang
    expect(noi_dung.includes('id="beginner-stage-name"')).toBe(true);
    expect(noi_dung.includes('id="beginner-stage-badge"')).toBe(true);
    expect(noi_dung.includes('id="beginner-goal"')).toBe(true);
    expect(noi_dung.includes('id="beginner-alg-strip"')).toBe(true);
    expect(noi_dung.includes('id="beginner-inst-vn"')).toBe(true);
    expect(noi_dung.includes('id="beginner-inst-en"')).toBe(true);
    expect(noi_dung.includes('id="beginner-warning"')).toBe(true);
  });
});
