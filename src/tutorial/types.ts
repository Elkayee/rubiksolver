import type { Face, Move } from '../cube/types';

/**
 * Danh sách 8 giai đoạn chính theo BEGINNER_GUIDE.md kèm ORIENTATION và SOLVED.
 */
export type TutorialStageId =
  | 'ORIENTATION'
  | 'DAISY'
  | 'WHITE_CROSS'
  | 'WHITE_CORNERS'
  | 'SECOND_LAYER'
  | 'YELLOW_CROSS'
  | 'ALIGN_YELLOW_EDGES'
  | 'POSITION_YELLOW_CORNERS'
  | 'TWIST_FINAL_CORNERS'
  | 'SOLVED';

/**
 * Tên và thông tin hiển thị của từng giai đoạn.
 */
export interface StageMeta {
  id: TutorialStageId;
  stepNumber: number;
  nameVn: string;
  nameEn: string;
  goalVn: string;
  goalEn: string;
}

export const STAGE_METAS: Record<TutorialStageId, StageMeta> = {
  ORIENTATION: {
    id: 'ORIENTATION',
    stepNumber: 0,
    nameVn: 'Giai đoạn 0 — Làm quen góc nhìn',
    nameEn: 'Stage 0 — Orientation',
    goalVn: 'Nhận diện tâm vàng và quy ước 6 mặt',
    goalEn: 'Find the yellow center and view convention',
  },
  DAISY: {
    id: 'DAISY',
    stepNumber: 1,
    nameVn: 'Giai đoạn 1 — Tạo hoa cúc Daisy',
    nameEn: 'Stage 1 — Build the Daisy',
    goalVn: 'Tạo 4 cánh trắng quanh tâm vàng ở mặt trên',
    goalEn: 'Form 4 white petals around yellow center on top',
  },
  WHITE_CROSS: {
    id: 'WHITE_CROSS',
    stepNumber: 2,
    nameVn: 'Giai đoạn 2 — Đưa hoa cúc về chữ thập trắng',
    nameEn: 'Stage 2 — Daisy to White Cross',
    goalVn: 'Khớp màu cạnh với tâm bên rồi hạ xuống đáy',
    goalEn: 'Match side color to center and rotate down to bottom',
  },
  WHITE_CORNERS: {
    id: 'WHITE_CORNERS',
    stepNumber: 3,
    nameVn: 'Giai đoạn 3 — Giải tầng 1 (White Layer)',
    nameEn: 'Stage 3 — Solve the White Layer',
    goalVn: 'Kẹp góc trắng giữa hai tâm và dùng Righty move để đưa vào',
    goalEn: 'Sandwich white corner and insert with Righty move',
  },
  SECOND_LAYER: {
    id: 'SECOND_LAYER',
    stepNumber: 4,
    nameVn: 'Giai đoạn 4 — Giải tầng 2 (Middle Layer)',
    nameEn: 'Stage 4 — Solve the Second Layer',
    goalVn: 'Đưa 4 cạnh không có màu vàng vào tầng giữa',
    goalEn: 'Insert 4 non-yellow edges into the middle layer',
  },
  YELLOW_CROSS: {
    id: 'YELLOW_CROSS',
    stepNumber: 5,
    nameVn: 'Giai đoạn 5 — Tạo chữ thập vàng',
    nameEn: 'Stage 5 — Make the Yellow Cross',
    goalVn: 'Tạo chữ thập vàng trên đỉnh qua Dot, L-shape hoặc Line',
    goalEn: 'Make yellow cross on top via Dot, L-shape, or Line',
  },
  ALIGN_YELLOW_EDGES: {
    id: 'ALIGN_YELLOW_EDGES',
    stepNumber: 6,
    nameVn: 'Giai đoạn 6 — Khớp cạnh chữ thập vàng',
    nameEn: 'Stage 6 — Match Yellow Cross to Side Centers',
    goalVn: 'Dùng công thức Sune để đưa cả 4 cạnh vàng khớp với tâm bên',
    goalEn: 'Use Sune algorithm to match all 4 yellow edges to centers',
  },
  POSITION_YELLOW_CORNERS: {
    id: 'POSITION_YELLOW_CORNERS',
    stepNumber: 7,
    nameVn: 'Giai đoạn 7 — Đưa góc vàng về đúng vị trí',
    nameEn: 'Stage 7 — Put Yellow Corners in Correct Positions',
    goalVn: 'Tìm Good Corner và dùng công thức Niklas để hoán vị các góc',
    goalEn: 'Find Good Corner and use Niklas algorithm to position corners',
  },
  TWIST_FINAL_CORNERS: {
    id: 'TWIST_FINAL_CORNERS',
    stepNumber: 8,
    nameVn: 'Giai đoạn 8 — Xoay góc vàng hoàn thiện Rubik',
    nameEn: 'Stage 8 — Twist the Final Corners',
    goalVn: 'Giữ cố định khối Rubik, dùng Righty và D để xoay từng góc vàng',
    goalEn: 'Lock orientation, repeat Righty and D to twist each corner',
  },
  SOLVED: {
    id: 'SOLVED',
    stepNumber: 9,
    nameVn: 'Hoàn thành — Rubik Solved!',
    nameEn: 'Complete — Rubik Solved!',
    goalVn: 'Chúc mừng bạn đã hoàn thành khối Rubik 3x3!',
    goalEn: 'Congratulations, the 3x3 Rubik cube is fully solved!',
  },
};

/**
 * Hướng dẫn chi tiết cho từng nước xoay quarter-turn.
 */
export interface BeginnerMoveInstruction {
  move: Move;
  actionNameEn: string;
  actionNameVn: string;
  quarterIndex: number;
  totalQuarters: number;
  arrowDir: 'cw' | 'ccw';
}

/**
 * Preset camera view cho Beginner Tutorial.
 */
export type CameraPreset =
  | 'default'
  | 'top'
  | 'bottom'
  | 'front'
  | 'front-right'
  | 'front-left'
  | 'stage8-lock';

/**
 * Bước hướng dẫn hiện tại do Tutorial Engine tạo ra.
 */
export interface TutorialStepDetail {
  stageId: TutorialStageId;
  caseId: string;
  titleVn: string;
  titleEn: string;
  explanationVn: string;
  explanationEn: string;
  lookTarget?: string;
  algorithmName?: string;
  repeatCount?: number;
  moves: Move[];
  moveInstructions: BeginnerMoveInstruction[];
  cameraCue: CameraPreset;
  warning?: string;
  isComplete: boolean;
}

/**
 * Cấu hình tốc độ chuẩn cho Beginner Mode.
 */
export const BEGINNER_SPEED_PRESETS = {
  slow: 0.35,
  normal: 0.6,
  fast: 1.0,
} as const;

export type BeginnerSpeedMode = keyof typeof BEGINNER_SPEED_PRESETS;
