import { describe, expect, it } from 'vitest';
import { animationDurationForSpeed, BASE_ANIMATION_DURATION_MS } from '../src/scene/cube-view-modern';

describe('Kiem tra thoi luong quay layer Rubik (Motion Timing)', () => {
  it('luon co thoi gian quay lon hon 0 khi tat reduced motion', () => {
    // toc_do: he so toc do do nguoi dung chon tren thanh truot UI (0.5x, 1x, 2x)
    const toc_do_chuan = 1;
    const tg_quay_chuan = animationDurationForSpeed(toc_do_chuan, false);
    expect(tg_quay_chuan).toBe(BASE_ANIMATION_DURATION_MS);
    expect(tg_quay_chuan).toBeGreaterThan(0);

    // toc_do cham 0.5x
    const toc_do_cham = 0.5;
    const tg_quay_cham = animationDurationForSpeed(toc_do_cham, false);
    expect(tg_quay_cham).toBe(BASE_ANIMATION_DURATION_MS * 2);
    expect(tg_quay_cham).toBeGreaterThan(0);

    // toc_do nhanh 2x
    const toc_do_nhanh = 2;
    const tg_quay_nhanh = animationDurationForSpeed(toc_do_nhanh, false);
    expect(tg_quay_nhanh).toBe(BASE_ANIMATION_DURATION_MS / 2);
    expect(tg_quay_nhanh).toBeGreaterThan(0);
  });
});
