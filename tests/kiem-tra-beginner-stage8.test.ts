import { describe, expect, it } from 'vitest';
import { applyMove, createState, isSolved } from '../src/cube/state';
import { TutorialEngine } from '../src/tutorial/engine';

describe('Beginner Stage 8', () => {
  it('giu Stage 8 trong cac trang thai trung gian va giai den SOLVED', () => {
    let state = createState(
      'UUBUUULUURRURRRRRRUFFFFFFFFDDDDDDDDDLLFLLLLLLRBBBBBBBB',
    );
    const tutorial = new TutorialEngine(state);

    expect(tutorial.layBuocHienTai().stageId).toBe('TWIST_FINAL_CORNERS');

    for (let action = 0; action < 10 && !isSolved(state); action += 1) {
      const detail = tutorial.layBuocHienTai();
      expect(detail.stageId).toBe('TWIST_FINAL_CORNERS');
      expect(detail.moves.length).toBeGreaterThan(0);

      for (const move of detail.moves) {
        state = applyMove(state, move);
        tutorial.ghiNhanDaXoayXongMotNuoc(move);
      }
    }

    expect(isSolved(state)).toBe(true);
    expect(tutorial.layBuocHienTai().stageId).toBe('SOLVED');
  });
});
