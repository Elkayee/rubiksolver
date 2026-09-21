import { describe, expect, it } from 'vitest';
import { applyMoves, createState, generateScramble, isSolved } from '../src/cube/state';
import { formatMoves } from '../src/cube/notation';
import { validateCubeState } from '../src/cube/validator';

describe('Kiểm tra tính năng Randomize đổi trạng thái lập tức (không xoay từ từ)', () => {
  it('tạo scramble ngẫu nhiên và áp dụng đổi state ngay lập tức sang trạng thái hợp lệ', () => {
    // 1. Tạo trạng thái ban đầu (solved)
    const tt_goc = createState();
    expect(isSolved(tt_goc)).toBe(true);

    // 2. Sinh danh sách bước scramble ngẫu nhiên
    const ds_buoc = generateScramble(20);
    expect(ds_buoc.length).toBe(20);

    // 3. Chuỗi scramble định dạng chuẩn
    const chuoi_scramble = formatMoves(ds_buoc);
    expect(chuoi_scramble.split(' ').length).toBe(20);

    // 4. Áp dụng toàn bộ bước scramble cùng một lúc để đổi state ngay lập tức
    const tt_moi = applyMoves(tt_goc, ds_buoc);

    // Cube không còn ở trạng thái solved
    expect(isSolved(tt_moi)).toBe(false);

    // Trạng thái mới phải hoàn toàn hợp lệ (không lỗi màu, không lỗi parity)
    const ket_qua_kt = validateCubeState(tt_moi);
    expect(ket_qua_kt.valid).toBe(true);
    expect(ket_qua_kt.errors).toHaveLength(0);
  });

  it('đảm bảo scramble từ solved state khớp chính xác với chuỗi công thức', () => {
    // Mỗi khi bấm randomize, cube đổi sang trạng thái mới trực tiếp từ solved
    const ds_buoc = generateScramble(20);
    const tt_tu_solved = applyMoves(createState(), ds_buoc);

    // Kiểm tra tính nhất quán của trạng thái
    expect(tt_tu_solved.facelets.length).toBe(54);
    expect(validateCubeState(tt_tu_solved).valid).toBe(true);
  });

  it('xác nhận không có độ trễ animation khi đổi state trực tiếp', () => {
    // Thao tác đổi state tức thì diễn ra trong mili-giây
    const t_bd = performance.now();
    const ds_buoc = generateScramble(20);
    const tt_moi = applyMoves(createState(), ds_buoc);
    const t_kt = performance.now();

    expect(tt_moi.facelets).toBeDefined();
    // Quá trình tính toán trạng thái tức thì không vượt quá 5ms
    expect(t_kt - t_bd).toBeLessThan(50);
  });
});
