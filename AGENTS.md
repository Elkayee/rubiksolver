# AGENTS.md

## Mission

Xây dựng Rubik Solver 3x3 3D theo `PLAN.md` và theo dõi tiến độ trong `TASK.md`.

Đọc `PLAN.md` khi cần quyết định phạm vi, kiến trúc hoặc tiêu chí nghiệm thu. Đọc `TASK.md` trước khi chọn việc tiếp theo hoặc đánh dấu hoàn thành.

## Core rule

Logical cube state là source of truth. Three.js chỉ render/animate từ state này.

Mọi thao tác — user move, scramble, solver playback, undo/redo — phải đi qua cùng move engine.

## Working loop

1. Chọn đúng một task chưa hoàn thành trong `TASK.md`.
2. Đọc code liên quan trước khi sửa.
3. Tạo hoặc cập nhật test để có tiêu chí kiểm chứng.
4. Thực hiện thay đổi nhỏ nhất để task pass.
5. Chạy test liên quan.
6. Chạy toàn bộ test nếu thay đổi chạm cube state, notation, validator hoặc solver boundary.
7. Với thay đổi 3D/UI, thực hiện smoke test luồng bị ảnh hưởng.
8. Chỉ đánh dấu task hoàn tất khi các verify của task đều đạt.

## Architecture boundaries

### cube/

Chứa domain logic thuần:

- Cube state.
- Move engine.
- Notation.
- Validation.

Module này không import Three.js, DOM hoặc solver package.

### scene/

Chứa Three.js renderer và animation.

Scene nhận state/move từ domain. Transform của mesh không được dùng làm nguồn dữ liệu để quyết định cube state.

Motion contract:

- Mỗi move render thành chuyển động layer nhìn thấy được.
- Hiển thị rotation arrow cho face/layer và chiều xoay hiện tại.
- Move `X2` phải biểu diễn được tiến độ `1/2` rồi `2/2`.
- Speed control phải điều khiển duration thật của renderer đang active.
- Manual move và solver playback dùng cùng animation path.
- Arrow, progress label và speed là presentation state; chúng không được trở thành source of truth của cube.

### solver/

Package solver chỉ được truy cập thông qua `SolverAdapter`.

UI và scene không import trực tiếp implementation Kociemba.

### ui/

UI điều phối input và hiển thị. Business rules về cube legality hoặc move transformation thuộc `cube/`, không đặt trong event handler.

## State invariants

Sau mọi thay đổi cube logic, giữ các invariant sau bằng test:

- 4 quarter-turn cùng face = identity.
- Move rồi inverse = identity.
- Sequence rồi inverse(sequence) = identity.
- Solved state được validator chấp nhận.
- Solver solution khi apply phải đưa state về solved.
- Visual animation hoàn tất phải biểu diễn đúng logical state.

## Simplicity

Ưu tiên implementation ngắn và trực tiếp.

Chỉ tạo abstraction khi có ít nhất một boundary thực sự cần tách, ví dụ `SolverAdapter` để cô lập dependency solver.

Không thêm framework UI, state manager, backend, database hoặc service nếu MVP chưa cần.

Không mở rộng ngoài 3x3 trước khi Definition of Done của MVP đạt.

## Surgical changes

Mỗi thay đổi chỉ chạm phần cần thiết cho task đang làm.

Giữ style hiện có khi repository đã có code.

Nếu thấy vấn đề ngoài phạm vi, ghi lại trong `TASK.md` dưới mục phù hợp thay vì refactor kèm theo.

## Testing

Cube domain phải test được không cần browser.

Ưu tiên test deterministic. Với random scramble test, seed generator để lỗi có thể tái hiện.

Các bug về move/state phải có regression test trước hoặc cùng lúc với fix.

## Solver dependency

Trước khi thêm solver package:

1. Kiểm tra package chạy được trong browser.
2. Kiểm tra license.
3. Kiểm tra output notation.
4. Kiểm tra thời gian khởi tạo.
5. Bọc package sau `SolverAdapter`.

Nếu package không đáp ứng, thay implementation phía sau adapter; không sửa UI để thích nghi với package.

## Completion

MVP chỉ hoàn thành khi happy path sau chạy end-to-end:

`input scramble -> update 3D cube -> validate -> solve -> playback -> solved`

Đồng thời:

- Invalid cube không đi vào solver.
- Logical và visual state không lệch.
- Tests pass.
- Production build pass.
