# TASK — Rubik Solver 3x3 3D

Trạng thái ban đầu: repository trống.

## P0 — Nền tảng bắt buộc

- [x] Khởi tạo Vite + TypeScript tối giản.
  - Verify: dev server chạy được.
  - Verify: production build chạy được.

- [x] Tạo cube domain model.
  - [x] Face, color, edge, corner, move types.
  - [x] Solved state.
  - Verify: solved state có đủ piece/sticker theo model đã chọn.

- [x] Implement move engine.
  - [x] U / U' / U2
  - [x] D / D' / D2
  - [x] L / L' / L2
  - [x] R / R' / R2
  - [x] F / F' / F2
  - [x] B / B' / B2
  - Verify: move + inverse = identity.
  - Verify: 4 quarter-turn = identity.

- [x] Implement notation parser.
  - Verify: parse được `R U R' U'`.
  - Verify: reject token ngoài notation MVP.

## P0 — Cube 3D

- [x] Tạo Three.js scene + camera + renderer.
  - Verify: solved cube 3D hiển thị đúng 6 màu.

- [x] Map logical cube sang visual cubies.
  - Verify: mỗi move logic chọn đúng layer visual.

- [x] Tạo animation queue.
  - Verify: spam input không làm overlap animation hoặc lệch state.
  - Verify: sequence + inverse sequence trả visual cube về solved.

- [x] Thêm OrbitControls.
  - Verify: camera orbit không thay đổi cube state.

### P0 — Motion guidance phải bổ sung

- [x] Thêm rotation-arrow overlay cho layer/mặt sắp xoay.
  - Verify: CW và CCW hiển thị mũi tên ngược chiều nhau.
  - Verify: arrow bám đúng face/layer khi camera orbit.
  - Verify: arrow tự ẩn sau khi move hoàn tất.

- [x] Hiển thị move hiện tại và số quarter-turn.
  - Verify: `R` hiển thị `1/1`.
  - Verify: `R2` hiển thị lần lượt `1/2` rồi `2/2`.
  - Verify: notation có `'` thể hiện đúng chiều ngược.

- [x] Làm layer rotation đủ chậm để quan sát được motion.
  - Verify: cubie của layer quay liên tục theo góc, không teleport sang trạng thái cuối.
  - Verify: move kế tiếp chỉ chạy sau khi move hiện tại kết thúc.

- [x] Nối speed control vào duration thật của renderer đang active.
  - Verify: thay đổi speed làm thay đổi thời gian quay layer ngay ở move kế tiếp.
  - Verify: speed áp dụng giống nhau cho manual move và solver playback.
  - Verify: speed không thay đổi logical result của sequence.
  - Verify: browser smoke đo được khoảng 1049ms ở 0.5× và 266ms ở 2×; reduced-motion dùng cue ngắn khoảng 188–192ms thay vì teleport.

## P0 — Input và validation

- [x] Thêm scramble text input.
  - Verify: scramble hợp lệ cập nhật cube đúng.

- [x] Thêm color-state editor cho 6 mặt.
  - Verify: user sửa đủ 54 facelet.

- [x] Implement validator.
  - [x] 6 màu x 9.
  - [x] Center mapping.
  - [x] Piece existence/uniqueness.
  - [x] Corner orientation.
  - [x] Edge orientation.
  - [x] Permutation parity.
  - Verify: các trạng thái impossible tiêu biểu bị reject đúng.

## P0 — Solver

- [x] Đánh giá implementation Kociemba/two-phase dùng trong browser.
  - Verify: license phù hợp.
  - Verify: API có thể được bọc sau `SolverAdapter`.

- [x] Implement `SolverAdapter`.
  - Verify: module UI không import trực tiếp package solver.

- [x] Chuyển CubeState <-> solver format.
  - Verify: solved round-trip không đổi state.

- [x] Test 100 random scrambles.
  - Verify: apply(solution, scrambledState) = solved cho toàn bộ test.

## P0 — Solution playback

- [x] Hiển thị solution notation.
- [x] Next.
- [x] Previous.
- [x] Play/Pause.
- [x] Reset.
- [x] Scramble.
- [x] Có speed control trên UI.
- [x] Speed control điều khiển duration của renderer đang active.
  - Verify: step index, logical state và visual state luôn khớp.
  - Verify: 0.5× chậm hơn rõ ràng so với 1× và 2× nhanh hơn rõ ràng so với 1×.

## P1 — UX sau khi MVP đúng

- [x] Keyboard shortcuts cho các face move.
- [x] Highlight move đang chạy.
- [x] Responsive layout desktop/mobile.
- [x] Thông báo validation rõ từng nguyên nhân.
- [x] Loading state khi solver khởi tạo.

- [x] Lưu session local bằng `localStorage`.
  - [x] Cube facelet state và scramble input.
  - [x] Solution notation và playback step.
  - [x] Bỏ qua snapshot hỏng/không đúng schema an toàn.
  - Verify: reload khôi phục state và input đã làm dở.

## P2 — Chỉ làm khi có yêu cầu riêng

- [ ] Drag trực tiếp sticker để xoay layer.
- [ ] Import state bằng camera/image recognition.
- [ ] Timer/speedcubing statistics.
- [ ] 2x2/4x4/5x5.
- [ ] Account/cloud persistence.
- [ ] Optimal solver.

## Definition of Done

Một task chỉ đánh dấu hoàn tất khi:

1. Code path thực tế đã chạy.
2. Test liên quan pass.
3. Không làm hỏng test đang pass trước đó.
4. Nếu task ảnh hưởng render 3D, có smoke test trực tiếp trên UI.
5. Nếu task ảnh hưởng cube state, có test chứng minh invariant tương ứng.

## Verification evidence — 2026-09-20

- `npm test` — 21 tests pass, including 100 deterministic scrambles, invalid corner/edge/parity states, session-storage round-trips, blocked-storage handling, motion timing, and arrow guidance.
- `npm run build` — TypeScript check and Vite production build pass.
- Browser smoke test — dev server, 3D render, `D` scramble, solve, autoplay to `SOLVED`, color-editor validation/reset, 375px viewport, and axe WCAG audit (0 violations).
- Local persistence smoke test — scramble `R U`, reload, and recover `SCRAMBLED` state plus input text from `localStorage`.
- Motion smoke test — `R2` reports `1/2` then `2/2`; arrow direction records `cw` and `ccw`; speed timing differs at 0.5×/2×; axe reports 0 violations.
- Playback regression smoke test — with reduced-motion enabled, `Solve → Play` still records 9 visible animation durations (~188–192ms) and reaches `SOLVED` at `9/9`.
