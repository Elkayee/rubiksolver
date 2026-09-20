import { describe, expect, it } from 'vitest';
import { animationDurationForSpeed, BASE_ANIMATION_DURATION_MS, REDUCED_MOTION_FACTOR } from '../src/scene/cube-view-modern';

describe('layer animation timing', () => {
  it('scales duration inversely with speed', () => {
    expect(animationDurationForSpeed(1, false)).toBe(BASE_ANIMATION_DURATION_MS);
    expect(animationDurationForSpeed(0.5, false)).toBe(BASE_ANIMATION_DURATION_MS * 2);
    expect(animationDurationForSpeed(2, false)).toBe(BASE_ANIMATION_DURATION_MS / 2);
  });

  it('honors reduced motion without changing the speed contract', () => {
    expect(animationDurationForSpeed(0.5, true)).toBe(BASE_ANIMATION_DURATION_MS * REDUCED_MOTION_FACTOR * 2);
    expect(animationDurationForSpeed(2, true)).toBe(BASE_ANIMATION_DURATION_MS * REDUCED_MOTION_FACTOR / 2);
  });
});
