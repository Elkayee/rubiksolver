# BEGINNER_GUIDE.md — Guided Beginner Mode

## Mục tiêu

Mode này dạy người mới giải Rubik 3x3 theo đúng flow của script nguồn, không chỉ phát một lời giải Kociemba.

Người học phải thấy và hiểu từng thao tác:

1. Tool xác định mục tiêu hiện tại.
2. Tool định hướng cube/camera về đúng tư thế.
3. Tool highlight piece cần xử lý.
4. Tool hiển thị mũi tên xoay.
5. Tool đọc tên thao tác bằng ngôn ngữ người mới.
6. Tool xoay chậm từng quarter-turn.
7. Tool dừng sau mỗi move hoặc mỗi cụm ngắn để người học quan sát.
8. Tool kiểm tra điều kiện đạt trước khi sang bước tiếp.

Guided Mode dùng cùng logical cube state, move engine, arrow overlay, animation queue và speed control hiện có.

## Ngôn ngữ hướng dẫn

Ưu tiên tên dễ nhớ từ script:

- Righty move = `R U R' U'`.
- Lefty move = `L' U' L U`.
- Daisy = bông hoa trắng quanh tâm vàng.
- Sandwiching = đưa corner trắng vào giữa hai center cùng màu với corner.
- Good corner = corner nằm đúng vị trí theo bộ ba center, chưa cần đúng orientation.
- Sune = `R U R' U R U2 R'`.
- Niklas = `R U' L' U R' U' L U`.

UI có thể hiện notation nhỏ bên dưới, nhưng lời hướng dẫn chính dùng tên beginner trước.

## Quy tắc presentation

Mỗi action trong tutorial có 4 pha:

### 1. LOOK

Không xoay ngay.

- Highlight piece/layer cần chú ý.
- Làm mờ nhẹ phần cube không liên quan.
- Hiện câu ngắn: người học cần nhìn gì.

### 2. AIM

- Camera tự xoay chậm về góc nhìn chuẩn nếu cần.
- Hiện arrow ghost trước khi cube chuyển động.
- Hiện tên move và chiều xoay.

### 3. TURN

- Chạy đúng một quarter-turn tại một thời điểm.
- Duration lấy từ tutorial speed.
- Mặc định Beginner nên chậm hơn mode solver bình thường.
- Trong Tutor không hiển thị notation `X2` hoặc lời kiểu `Right ×2`. Tách thành hai action quarter-turn giống nhau, ví dụ `Right → Right`, mỗi action có arrow và motion riêng.

### 4. CHECK

- Tạm dừng ngắn.
- Highlight kết quả vừa tạo.
- Kiểm tra condition của step.
- Nếu chưa đạt, chọn case tiếp theo; nếu đạt, chuyển stage.

Không autoplay xuyên nhiều algorithm ở lần đầu. Lần đầu học một algorithm phải dừng theo từng move; sau khi user đã xem ít nhất một lần có thể cho tùy chọn “Play algorithm”.

## Controls của Beginner Mode

- Previous explanation
- Show next move
- Play this move
- Play algorithm
- Pause
- Repeat move
- Repeat algorithm
- Slow / Normal / Fast
- “I understand / Continue”
- Reset camera
- Exit tutorial

Baseline speed:

- Slow: 0.35×
- Normal beginner: 0.6×
- Fast: 1×
- Solver mode có thể tiếp tục dùng dải speed riêng hiện có.

## HUD bắt buộc

Ví dụ khi đang dạy Righty move:

```text
STEP 3 — WHITE LAYER
Righty move · move 2 / 4

U
Turn the TOP with your right finger
↶
```

HUD phải hiển thị đồng thời:

- Stage.
- Tên algorithm nếu có.
- Move hiện tại.
- Move index / số move của algorithm.
- Với double turn, hiển thị hai move lặp riêng trong sequence, ví dụ `Right · move 1/2` rồi `Right · move 2/2`; không hiện `Right ×2`.
- Câu hướng dẫn beginner.
- Arrow chỉ layer và chiều.
- Speed hiện tại.

---

# Stage 0 — Orientation

## Mục tiêu

Dạy quy ước nhìn cube trước khi bắt đầu.

## Kịch bản

1. Highlight yellow center.
2. Text: “Find the yellow center.”
3. Camera orbit chậm để yellow center nằm trên TOP.
4. Text: “Keep yellow on top for the first part.”
5. Highlight edge và corner mẫu để giải thích khác nhau.
6. Chỉ 5 vùng tìm white edge theo góc nhìn hiện tại.

## Thành công

- Yellow center ở U.
- User đã xem cue phân biệt edge/corner.

---

# Stage 1 — Build the Daisy

## Mục tiêu

Tạo 4 white edges quanh yellow center.

## Detector

Tìm white edge chưa nằm ở U layer quanh yellow center.

Mỗi lần chọn đúng một edge và phân loại case.

## Case 1A — White edge ở side

Kịch bản:

1. LOOK: highlight white edge.
2. Text: “This is an edge. Bring it up to the daisy.”
3. Nếu ô đích trên U đang trống, AIM arrow cho face turn cần thiết.
4. TURN từng quarter-turn.
5. CHECK white edge đã nằm cạnh yellow center.

Nếu ô đích bị chiếm:

1. Highlight white edge đã nằm trên daisy có nguy cơ bị đá ra.
2. Text: “Do not break a piece already in the daisy.”
3. Arrow trên U.
4. TURN U đến một slot trống.
5. Sau đó mới bring white edge up.

## Case 1B — White edge ở front-bottom

Kịch bản:

1. LOOK: highlight edge.
2. Text: “First move it to the side.”
3. TURN front face một quarter-turn để edge chuyển sang side case.
4. CHECK.
5. Chạy lại logic Case 1A.

## Case 1C — White edge ở bottom

Kịch bản:

1. LOOK: highlight edge ở D.
2. Text: “Bring the bottom edge up.”
3. Nếu đường lên sẽ phá daisy, TURN U đến slot trống trước.
4. TURN face/layer cần thiết để đưa edge lên.
5. CHECK.

## Hoàn thành Stage 1

- 4 white edges bao quanh yellow center.
- Highlight toàn bộ daisy.
- Text: “Daisy complete.”

---

# Stage 2 — Daisy to White Cross

## Mục tiêu

Đưa từng white edge từ U xuống white center và đồng thời match side color.

## Loop cho từng petal

1. LOOK side color của white edge hiện tại.
2. Highlight edge color và center cùng màu.
3. Text: “Match the side color to its center.”
4. TURN U từng quarter-turn cho đến khi match.
5. CHECK side color = center.
6. AIM arrow trên face tương ứng.
7. Text: “Turn this face twice.”
8. TURN cùng một face hai lần, không hiện `X2`:
   - lần 1: ví dụ `Front` / `Right`
   - pause ngắn
   - lần 2: lặp lại `Front` / `Right`
   - UI đọc thành `Front, Front` hoặc `Right, Right`.
9. CHECK white edge xuống D và side color vẫn match.
10. Orbit sang petal tiếp theo nếu cần.

## Hoàn thành Stage 2

- White cross hoàn chỉnh ở D.
- Bốn side edge match center.

---

# Stage 3 — Solve the White Layer

## Mục tiêu

Đưa 4 white corners vào đúng chỗ.

Giữ yellow center ở U, white cross ở D.

## Case 3A — Có white corner ở top layer

1. LOOK: highlight một white corner ở U layer.
2. Hiện hai màu còn lại.
3. Highlight hai center tương ứng.
4. Text: “Sandwich this corner between these two centers.”
5. TURN U cho đến khi corner nằm giữa đúng hai center.
6. CHECK sandwich position.
7. Giới thiệu Righty move nếu là lần đầu.

### Teach Righty Move

Notation: `R U R' U'`.

Phát từng move:

1. `R` — “Right side up.”
2. `U` — “Turn the top with your right finger.”
3. `R'` — “Right side down.”
4. `U'` — “Flick the top back with your left finger.”

Sau 4 move:

- CHECK white sticker/corner đã vào đúng vị trí chưa.
- Nếu chưa: text “Same position. Do the Righty move again.”
- Đếm repeat: `Righty 1×`, `2×`, `3×`...
- Lặp cho đến khi solved.

## Case 3B — Không còn white corner ở top

1. Scan bottom layer.
2. Highlight white corner đang bị kẹt.
3. Orbit để corner ở phía phải của người xem.
4. Text: “Take it out with one Righty move.”
5. Chạy `R U R' U'`.
6. CHECK corner đã lên U.
7. Quay về Case 3A.

## Hoàn thành Stage 3

- Toàn bộ white face solved.
- Hàng màu đầu tiên ở bốn side cũng match.
- UI nhấn mạnh khác biệt giữa “white side” và “white layer”.

---

# Stage 4 — Solve the Second Layer

## Mục tiêu

Đưa 4 edge không có yellow vào middle layer.

## Chọn edge

1. LOOK trên U layer.
2. Highlight edge không có yellow.
3. TURN U để màu phía trước match front center.
4. Nhìn màu còn lại ở top.
5. Xác định piece phải đi RIGHT hay LEFT.

## Case 4A — Piece goes Right

Theo teaching flow của script:

1. Text: “Move the edge away to the right.”
2. TURN U theo cue.
3. Chạy Righty move `R U R' U'`.
4. Orbit/rotate viewpoint để vùng chèn còn lại nằm trước người học.
5. Giới thiệu Lefty move nếu lần đầu.
6. Chạy Lefty move `L' U' L U`.
7. CHECK middle edge solved.

## Case 4B — Piece goes Left

1. Text: “Move the edge away to the left.”
2. TURN U theo cue.
3. Chạy Lefty move `L' U' L U`.
4. Orbit/rotate viewpoint.
5. Chạy Righty move `R U R' U'`.
6. CHECK.

## Case 4C — Middle layer chưa xong nhưng top chỉ còn yellow edges

1. Highlight middle edge sai cần lấy ra.
2. Highlight một yellow edge dùng làm temporary piece.
3. Xác định edge sai nằm bên RIGHT hoặc LEFT.
4. Chạy insertion tương ứng để đẩy edge sai lên U.
5. CHECK edge cần xử lý đã ở top.
6. Quay lại Case 4A/4B.

## Hoàn thành Stage 4

- Hai layer đầu solved.

---

# Stage 5 — Make the Yellow Cross

Bỏ qua yellow corners khi nhận diện pattern.

## Case 5A — Dot

1. Highlight 4 edge positions và làm mờ corners.
2. Text: “You have a dot.”
3. Chạy:
   - `F`
   - Righty `R U R' U'`
   - `F'`
4. CHECK pattern mới.

## Case 5B — L shape

1. Highlight yellow L.
2. Orbit để L nằm ở top-left theo góc nhìn hướng dẫn.
3. Chạy `F R U R' U' F'`.
4. CHECK.

## Case 5C — Line

1. Highlight yellow line.
2. Orbit để line nằm ngang như “train tracks”.
3. Chạy `F R U R' U' F'`.
4. CHECK yellow cross.

## Hoàn thành Stage 5

- Yellow cross có đủ 4 yellow edges hướng lên.

---

# Stage 6 — Match the Yellow Cross to Side Centers

## Chuẩn bị

TURN U để match được nhiều edge side-color nhất có thể.

Detector phân loại:

- 4 match → skip stage.
- 2 opposite.
- 2 adjacent.

## Case 6A — Opposite matches

1. Highlight hai edge matched đối diện nhau.
2. Orbit để matched pieces ở front/back theo flow tutorial.
3. Giới thiệu Sune.
4. Chạy từng move:
   `R U R' U R U2 R'`
5. Với bước logic tương đương `U2`, Tutor phải phát `Up, Up`: hai `U` riêng, mỗi lần một arrow/motion; không hiển thị `U2`.
6. TURN U để tìm case 2 adjacent.
7. CHECK.

## Case 6B — Adjacent matches

1. Highlight hai matched edges cạnh nhau.
2. Orbit để chúng nằm back + right; unsolved ở front + left.
3. Chạy Sune `R U R' U R U2 R'`.
4. TURN U để align.
5. CHECK cả 4 edge match center.

## Hoàn thành Stage 6

- Yellow cross và cả bốn side centers match.

---

# Stage 7 — Put Yellow Corners in the Correct Positions

## Khái niệm Good Corner

Good corner = ba màu của corner trùng với ba center bao quanh vị trí đó, dù yellow sticker chưa hướng lên.

UI phải:

- Highlight 3 sticker của corner.
- Highlight 3 center tương ứng.
- Hiện GOOD / NOT YET.

## Case 7A — One good corner

1. Đưa good corner về LEFT theo góc nhìn của script.
2. Giới thiệu Niklas.
3. Chạy từng move:
   `R U' L' U R' U' L U`
4. CHECK lại 4 corners.

## Case 7B — Zero good corners

1. Text: “No good corner yet. Do Niklas once.”
2. Chạy `R U' L' U R' U' L U`.
3. CHECK tìm một good corner.
4. Khi có, orbit để nó ở LEFT.
5. Chạy Niklas lại.
6. CHECK.

## Hoàn thành Stage 7

- Tất cả 4 yellow corners nằm đúng vị trí.

---

# Stage 8 — Twist the Final Corners

Đây là stage cần guardrail rõ nhất.

## Setup

1. Flip orientation để WHITE face ở U.
2. Chọn một yellow corner chưa oriented.
3. Đặt toàn bộ corner đó ở vị trí RIGHT-hand working corner.
4. Lock camera orientation cho đến khi stage kết thúc.

HUD warning:

“Do not rotate the whole cube now. Only use the instructed moves.”

## Loop cho một corner

1. Highlight working corner.
2. Chạy Righty move `R U R' U'` một lần.
3. Đếm: `Righty 1×`.
4. CHECK yellow sticker đã hướng xuống chưa.
5. Nếu chưa, lặp:
   - `Righty 2×`
   - `Righty 3×`
   - ...
6. Khi yellow hướng xuống, highlight corner thành DONE.

Trong lúc lặp, nếu cube trông “bị phá”:

- Không reset.
- Text: “This is expected. Keep the same cube orientation.”

## Chuyển corner tiếp theo

1. Không orbit/rotate whole cube.
2. Dùng `D`; nếu cần 180° thì phát `Down, Down` thành hai move riêng để đưa yellow corner chưa solved tiếp theo vào working corner.
3. Không hiển thị `D2` trong Tutor.
4. Lặp Righty move cho corner mới.

## Hoàn thành Stage 8

- Cube solved.
- Animation cuối orbit nhẹ để show 6 faces.
- Hiện tổng số guided moves đã thực hiện.

---

# State machine đề xuất

```text
ORIENTATION
  -> DAISY
  -> WHITE_CROSS
  -> WHITE_CORNERS
  -> SECOND_LAYER
  -> YELLOW_CROSS
  -> ALIGN_YELLOW_EDGES
  -> POSITION_YELLOW_CORNERS
  -> TWIST_FINAL_CORNERS
  -> SOLVED
```

Mỗi stage có:

```ts
interface TutorialStage {
  id: TutorialStageId;
  detect(state: CubeState): TutorialCase;
  prepareView(case: TutorialCase): ViewInstruction;
  buildActions(case: TutorialCase): TutorialAction[];
  isComplete(state: CubeState): boolean;
}
```

Action tối thiểu:

```ts
type TutorialAction =
  | { type: 'look'; targets: HighlightTarget[]; text: string }
  | { type: 'orient-view'; preset: CameraPreset }
  | { type: 'move'; move: Move; text: string }
  | { type: 'algorithm'; name: string; moves: Move[] }
  | { type: 'check'; predicate: TutorialCheck; successText: string };
```

Không tạo một move engine riêng cho tutorial. `move` và `algorithm` phải enqueue vào animation queue hiện có.

# Tiêu chí nghiệm thu Beginner Mode

Beginner Mode đạt khi:

1. Có thể bắt đầu từ một scramble hợp lệ bất kỳ.
2. Tool tự xác định stage/case hiện tại.
3. Người học luôn biết piece nào đang xử lý.
4. Mỗi quarter-turn có arrow + motion + lời giải thích.
5. Righty, Lefty, Sune và Niklas được dạy từng move ở lần đầu.
6. Algorithm lặp có counter rõ ràng.
7. Camera tự định hướng nhưng không làm thay đổi logical cube state.
8. Stage 8 khóa orientation và cảnh báo không rotate whole cube.
9. Người học có thể Pause/Repeat/Previous explanation bất kỳ lúc nào.
10. Speed thay đổi animation nhưng không thay đổi sequence.
11. Kết thúc ở solved state.
