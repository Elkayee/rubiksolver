# PLAN — Rubik Solver 3x3 3D

## 1. Mục tiêu

Tạo một tool giải Rubik 3x3 có mô hình cube 3D tương tác, cho phép:

- Xem và xoay cube 3D.
- Thực hiện các move chuẩn: `U D L R F B`, hậu tố `'` và `2`.
- Nhập scramble hoặc trạng thái màu của cube.
- Kiểm tra trạng thái cube có hợp lệ hay không.
- Tính lời giải cho cube hợp lệ.
- Phát lại lời giải từng bước trên mô hình 3D.
- Reset, scramble, undo/redo các thao tác cơ bản.

Phạm vi MVP chỉ là Rubik 3x3. Không mở rộng 2x2, 4x4, timer, account, cloud sync hoặc multiplayer.

## 2. Giả định và lựa chọn kỹ thuật

Repository hiện đang trống, chưa có stack bắt buộc.

Baseline mặc định:

- Runtime/UI: Web local.
- Ngôn ngữ: TypeScript.
- Build tool: Vite.
- 3D: Three.js.
- UI: HTML/CSS/TypeScript thuần trước; chỉ thêm framework UI nếu code thực tế chứng minh cần thiết.
- Solver: two-phase/Kociemba thông qua một `SolverAdapter`.

Lý do:

- Three.js đủ cho cube 3D, camera và animation mà không cần game engine.
- TypeScript giúp khóa kiểu dữ liệu cho move, face, cubie và cube state.
- Solver tách qua adapter để UI/model không phụ thuộc một package cụ thể.
- MVP nên dùng implementation Kociemba đã được kiểm chứng thay vì tự viết thuật toán tìm kiếm từ đầu.

Trước khi khóa dependency solver, phải kiểm tra: license, khả năng chạy browser, thời gian khởi tạo và kết quả trên test vector. Nếu dependency không phù hợp, thay implementation phía sau `SolverAdapter`, không thay contract.

## 3. Kiến trúc mục tiêu

### 3.1. Nguyên tắc chính

Logical cube state là source of truth.

Three.js chỉ render và animate từ logical state. Không suy ngược trạng thái logic từ transform của mesh.

Luồng một move:

`User/Solver -> Move parser -> Cube state -> Animation queue -> Three.js view`

Sau mỗi animation, visual state phải khớp logical state.

### 3.2. Module dự kiến

```text
src/
  cube/
    types.ts
    state.ts
    moves.ts
    notation.ts
    validator.ts
  solver/
    solver-adapter.ts
    kociemba-solver.ts
  scene/
    cube-view.ts
    animator.ts
    camera.ts
  ui/
    controls.ts
    color-input.ts
    solution-panel.ts
  app.ts
tests/
  cube/
  solver/
```

Chỉ tạo module khi phase tương ứng cần đến; không scaffold toàn bộ trước.

## 4. Mô hình dữ liệu

Tách hai biểu diễn:

1. Cubie model dùng cho move, validation và render mapping.
2. Facelet string dùng tại boundary với solver nếu solver yêu cầu.

Các center cố định theo hệ màu chuẩn của ứng dụng. Mapping màu phải được khai báo đúng một nơi.

Move type tối thiểu:

```text
Face = U | D | L | R | F | B
Turn = CW | CCW | HALF
Move = Face + Turn
```

Parser hỗ trợ ví dụ:

`R U R' U'`
`F2 L D2`

## 5. Validation trạng thái cube

Trước khi gọi solver phải kiểm tra theo thứ tự:

1. Đủ 54 facelet.
2. Chính xác 6 màu.
3. Mỗi màu có đúng 9 ô.
4. 6 center khớp mapping.
5. Tập corner/edge hợp lệ, không trùng hoặc thiếu piece.
6. Tổng corner orientation hợp lệ.
7. Tổng edge orientation hợp lệ.
8. Permutation parity hợp lệ.

UI phải trả lỗi cụ thể thay vì chỉ báo "invalid cube".

## 6. 3D và interaction

MVP render 27 cubie positions, trong đó sticker chỉ xuất hiện ở mặt ngoài.

Yêu cầu motion bắt buộc:

- Orbit camera bằng chuột.
- Responsive canvas.
- Mỗi move phải xoay đúng layer bằng animation nhìn thấy được; không nhảy tức thì giữa hai trạng thái.
- Trước và trong move, hiển thị mũi tên cong quanh layer/mặt để chỉ rõ chiều CW hoặc CCW.
- Với move `X2`, UI phải thể hiện rõ là xoay 2 quarter-turn / 180°, không để user phải tự suy ra.
- Hiển thị move hiện tại và số lượt xoay, ví dụ `R · 1/1`, `R2 · 1/2`, `R2 · 2/2`.
- Animation chạy tuần tự; move kế tiếp chỉ bắt đầu khi move hiện tại hoàn tất.
- Có speed control áp dụng trực tiếp vào duration của layer rotation cho cả thao tác tay và solver playback.
- Speed phải hỗ trợ quan sát chậm; baseline UI dùng khoảng 0.5×–2×.
- `prefers-reduced-motion` giảm duration còn một cue ngắn, không teleport state và không bỏ qua quarter-turn.
- Highlight move hiện tại khi playback lời giải.
- Một thời điểm chỉ commit một logical move theo animation queue.
- Nút hoặc keyboard cho 18 move cơ bản.

Mũi tên là overlay hướng dẫn và không tham gia cube state. Speed chỉ thay đổi thời lượng animation, không thay đổi thứ tự move hay logical state.

Không đưa drag trực tiếp trên sticker để xoay layer vào MVP đầu tiên. Đây là interaction phức tạp hơn và không cần thiết để chứng minh solver hoạt động.

## 7. Solver

Contract:

```ts
interface SolverAdapter {
  solve(state: CubeState): Promise<Move[]>;
}
```

Solver phải:

- Chỉ nhận cube đã qua validator.
- Trả về move notation chuẩn.
- Không trực tiếp thay đổi scene.
- Có thể khởi tạo bảng tìm kiếm một lần và tái sử dụng.

Không đặt yêu cầu "optimal solution" cho MVP. Mục tiêu là lời giải đúng, thời gian hợp lý và ổn định.

## 8. Playback lời giải

Solution panel hiển thị toàn bộ move.

Controls tối thiểu:

- Solve
- Play/Pause
- Previous
- Next
- Reset
- Scramble

Playback phải dùng chính move engine của thao tác thủ công; không tạo code path thứ hai cho solver animation.

## 8.1. Session persistence

Lưu session hiện tại trong `localStorage` để reload không làm mất công người dùng:

- Cube facelet state, kể cả state đang chỉnh dở và chưa hợp lệ.
- Scramble input.
- Solution notation và playback step hiện tại.
- Snapshot lỗi hoặc không đúng schema phải bị bỏ qua an toàn.

Persistence không thay thế logical state và không mở rộng thành account/cloud sync.

## 9. Các phase triển khai

### Phase 01 — Project skeleton + cube logic

Thực hiện:

- Khởi tạo Vite + TypeScript.
- Định nghĩa cube state và move notation.
- Implement 18 move cơ bản.
- Unit test move invariants.

Hoàn thành khi:

- 4 lần cùng một quarter-turn trả cube về trạng thái ban đầu.
- Move + inverse trả trạng thái ban đầu.
- Parser round-trip được chuỗi move chuẩn.
- Test chạy pass.

### Phase 02 — 3D renderer

Thực hiện:

- Tạo scene, camera, lights.
- Render cube solved.
- Map logical pieces sang visual cubies.
- Animate từng layer.
- Hiển thị rotation arrow theo face và chiều xoay.
- Hiển thị quarter-turn progress cho move hiện tại.
- Cho phép duration animation nhận từ speed control thay vì hard-code.

Hoàn thành khi:

- Mọi move từ logical engine hiển thị đúng mặt/layer.
- CW/CCW có arrow đúng chiều và `X2` hiện `1/2 -> 2/2`.
- Có thể nhìn rõ layer chuyển động ở tốc độ chậm.
- Reduced-motion vẫn có cue ngắn nhìn thấy được, nhưng ít chuyển động hơn bình thường.
- Thay đổi speed làm thay đổi duration thật của layer rotation.
- Sau một sequence và inverse sequence, visual + logical đều về solved.
- Không tích lũy sai số transform qua nhiều move.

### Phase 03 — Input + validator

Thực hiện:

- Scramble input.
- Color editor 6 mặt.
- Cube legality validator.
- Error display.

Hoàn thành khi:

- Solved cube hợp lệ.
- Một số case sai màu, flipped edge, twisted corner và parity lỗi bị từ chối đúng nguyên nhân.
- State hợp lệ chuyển đổi được sang format solver.

### Phase 04 — Solver integration

Thực hiện:

- Chọn implementation Kociemba phù hợp.
- Implement `SolverAdapter`.
- Parse kết quả solver thành `Move[]`.
- Test solver với random scrambles.

Hoàn thành khi:

- Ít nhất 100 scramble hợp lệ ngẫu nhiên được solve và apply về solved state.
- Solver không mutate input state.
- Không có dependency solver rò vào module UI/scene.

### Phase 05 — Playback + UX MVP

Thực hiện:

- Solution panel.
- Play/Pause/Next/Previous.
- Speed control điều khiển trực tiếp animation duration.
- Move HUD: notation hiện tại, chiều xoay và quarter-turn progress.
- Disable action xung đột khi animation đang chạy.
- Lưu/khôi phục session bằng `localStorage`.

Hoàn thành khi:

- User có thể nhập scramble -> Solve -> Play -> cube solved.
- Mỗi bước cho thấy arrow, motion và số lượt xoay trước khi chuyển move tiếp theo.
- Speed thấp/cao thay đổi rõ tốc độ animation nhưng không đổi kết quả.
- Reduced-motion không làm mất animation layer hoặc làm lệch logical state.
- Step index và trạng thái cube luôn đồng bộ.
- Reset đưa app về solved state ổn định.
- Reload khôi phục state, scramble input và playback snapshot nếu dữ liệu còn hợp lệ về schema.

### Phase 06 — Hardening

Thực hiện:

- Test random sequence dài.
- Rà memory/performance.
- Rà responsive.
- Build production.

Hoàn thành khi:

- `npm test` pass.
- `npm run build` pass.
- Không có console error trong luồng MVP.
- Manual smoke test toàn bộ happy path pass.

## 10. Tiêu chí nghiệm thu MVP

MVP được coi là đạt khi có thể thực hiện end-to-end:

1. Mở tool.
2. Nhập scramble hợp lệ.
3. Cube 3D phản ánh đúng scramble.
4. Nhấn Solve.
5. Nhận chuỗi move lời giải.
6. Phát từng bước hoặc autoplay.
7. Mỗi move hiển thị arrow chỉ chiều, layer quay có motion, và số lượt xoay/quarter-turn rõ ràng.
8. User có thể chỉnh speed để quan sát chậm hoặc tăng tốc playback.
9. Cube kết thúc ở solved state.

Ngoài ra:

- Invalid cube không được gửi sang solver.
- Logical state và 3D state không lệch nhau.
- Speed chỉ ảnh hưởng animation duration, không ảnh hưởng logical state.
- Build/test sạch.
- Reload không làm mất session local của người dùng.
- Không có feature ngoài phạm vi làm tăng độ phức tạp trước khi các tiêu chí trên đạt.
