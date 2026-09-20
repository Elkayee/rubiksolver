import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  animationDurationForSpeed,
  BASE_ANIMATION_DURATION_MS,
  layDinhHuongMuiTen3D,
} from '../src/scene/cube-view-modern';
import type { Face, Move } from '../src/cube/types';

// Ham tinh toan goc noi suy theo tien do (t: 0 -> 1)
// So sanh giua ham easeOutCubic cu va ham easeInOutCubic / linear deu dan
export function tinhGocNoiSuy(tien_do: number, kieu: 'easeOut' | 'easeInOut' | 'tuyenTinh' = 'easeInOut'): number {
  const t = Math.max(0, Math.min(tien_do, 1));
  if (kieu === 'tuyenTinh') {
    return t;
  }
  if (kieu === 'easeInOut') {
    // Ham noi suy euler easeInOutCubic: bat dau cham, giua deu, ket thuc em diu
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  // easeOutCubic: ban dau vut rat nhanh (dao ham = 3), cuoi dung yen
  return 1 - (1 - t) ** 3;
}

// Ham tinh thoi luong chuan cho nuoc di, nuoc di doi ('2') can gap doi thoi luong de giu nguyen van toc goc
export function tinhThoiLuongBuoc(buoc: Move, toc_do: number, giam_chuyen_dong = false): number {
  const tg_co_ban = animationDurationForSpeed(toc_do, giam_chuyen_dong);
  const so_luot = buoc.turn === '2' ? 2 : 1;
  return tg_co_ban * so_luot;
}

describe('Kiem tra toc do quay mat truoc (F) va mat sau (B) o speed 0.1x', () => {
  it('kiem tra thoi luong o speed 0.1x phai dat 8500ms cho 90 do', () => {
    const toc_do = 0.1;
    const tg_quay_f = animationDurationForSpeed(toc_do, false);

    // O speed 0.1x, thoi luong phai la 8500ms (8.5 giay)
    expect(tg_quay_f).toBe(8500);
  });

  it('nuoc di 180 do (F2, B2) can duoc nhan doi thoi luong de toc do xoay khong bi dot ngot tang gap doi', () => {
    const buoc_f: Move = { face: 'F', turn: '' };
    const buoc_f2: Move = { face: 'F', turn: '2' };
    const buoc_b2: Move = { face: 'B', turn: '2' };

    const tg_f = tinhThoiLuongBuoc(buoc_f, 0.1, false);
    const tg_f2 = tinhThoiLuongBuoc(buoc_f2, 0.1, false);
    const tg_b2 = tinhThoiLuongBuoc(buoc_b2, 0.1, false);

    expect(tg_f).toBe(8500);
    expect(tg_f2).toBe(17000); // 17 giay cho 2 luot xoay 90 do
    expect(tg_b2).toBe(17000);
  });

  it('so sanh dao ham ban dau giua easeOutCubic va easeInOutCubic', () => {
    // O 10% thoi gian dau tien (tien do = 0.1)
    const td_dau = 0.1;
    const goc_out = tinhGocNoiSuy(td_dau, 'easeOut');
    const goc_in_out = tinhGocNoiSuy(td_dau, 'easeInOut');

    // easeOut da xoay toi 27.1% quang duong ngay trong 10% thoi gian dau (nhanh gap 2.7 lan toc do binh quan)
    expect(goc_out).toBeCloseTo(0.271, 3);

    // easeInOut chi moi xoay 0.4% quang duong, bat dau rat tu ton, khong gay cam giac giat nhanh
    expect(goc_in_out).toBeCloseTo(0.004, 3);
  });

  it('kiem tra truc phap tuyen mat Truoc (F) va Sau (B) nam tren truc Z', () => {
    const tt_f = layDinhHuongMuiTen3D('F');
    const tt_b = layDinhHuongMuiTen3D('B');

    // Mat Truoc F co phap tuyen (0, 0, 1)
    expect(tt_f.phap_tuyen).toEqual([0, 0, 1]);
    // Mat Sau B co phap tuyen (0, 0, -1)
    expect(tt_b.phap_tuyen).toEqual([0, 0, -1]);
  });
});
