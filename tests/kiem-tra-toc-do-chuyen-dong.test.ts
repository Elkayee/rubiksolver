import { describe, expect, it } from 'vitest';
import {
  animationDurationForSpeed,
  BASE_ANIMATION_DURATION_MS,
  REDUCED_MOTION_FACTOR,
} from '../src/scene/cube-view-modern';

describe('Kiem tra dieu chinh toc do chuyen dong (Speed Control)', () => {
  it('dam bao BASE_ANIMATION_DURATION_MS du cham (it nhat 800ms) de nguoi dung quan sat', () => {
    // Thoi luong chuan 1x phai du cham
    expect(BASE_ANIMATION_DURATION_MS).toBeGreaterThanOrEqual(800);
    expect(BASE_ANIMATION_DURATION_MS).toBe(850);
  });

  it('dam bao toc do 0.5x co thoi luong it nhat 1700ms (chậm rõ rệt)', () => {
    const toc_do = 0.5;
    const tg_quay = animationDurationForSpeed(toc_do, false);

    // O toc do 0.5x, thoi luong phai la 1700ms (gap doi thoi luong chuan 850ms)
    expect(tg_quay).toBe(1700);
    expect(tg_quay).toBeGreaterThanOrEqual(1500);
  });

  it('ho tro cac muc toc do sieu cham 0.25x va 0.1x', () => {
    // Muc 0.25x: 3400ms (3.4 giay)
    const tg_025 = animationDurationForSpeed(0.25, false);
    expect(tg_025).toBe(3400);

    // Muc 0.1x: 8500ms (8.5 giay - sieu cham de phan tich tung vien)
    const tg_01 = animationDurationForSpeed(0.1, false);
    expect(tg_01).toBe(8500);
  });

  it('ti le nghich chuan xac voi he so toc do', () => {
    const tg_1x = animationDurationForSpeed(1, false);
    const tg_05x = animationDurationForSpeed(0.5, false);
    const tg_2x = animationDurationForSpeed(2, false);

    expect(tg_05x).toBe(tg_1x * 2);
    expect(tg_2x).toBe(tg_1x / 2);
  });

  it('tuong thich che do giam chuyen dong reduced motion', () => {
    const tg_giam = animationDurationForSpeed(0.5, true);
    expect(tg_giam).toBe(1700 * REDUCED_MOTION_FACTOR);
  });
});
