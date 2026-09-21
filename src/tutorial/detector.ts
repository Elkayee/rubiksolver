import type { CubeState, Face, Move } from '../cube/types';
import { applyMove, applyMoves, isSolved } from '../cube/state';
import type {
  BeginnerMoveInstruction,
  CameraPreset,
  TutorialStageId,
  TutorialStepDetail,
} from './types';
import { STAGE_METAS } from './types';

// ==============================================================================
// 1. Chỉ số sticker trên CubeState (54 ô)
// ==============================================================================
// Tâm: U=4, R=13, F=22, D=31, L=40, B=49
// Quy ước chuẩn: 'U' = Vàng (Mặt trên), 'D' = Trắng (Mặt đáy)
const TAM_U = 4;
const TAM_R = 13;
const TAM_F = 22;
const TAM_D = 31;
const TAM_L = 40;
const TAM_B = 49;

// 4 cạnh mặt U: UR(5,10), UF(7,19), UL(3,37), UB(1,46)
export const CANH_U_DS = [
  { uIdx: 5, sideIdx: 10, sideFace: 'R' as Face },
  { uIdx: 7, sideIdx: 19, sideFace: 'F' as Face },
  { uIdx: 3, sideIdx: 37, sideFace: 'L' as Face },
  { uIdx: 1, sideIdx: 46, sideFace: 'B' as Face },
];

// 4 cạnh mặt D: DR(32,16), DF(28,25), DL(30,43), DB(34,52)
export const CANH_D_DS = [
  { dIdx: 32, sideIdx: 16, sideFace: 'R' as Face },
  { dIdx: 28, sideIdx: 25, sideFace: 'F' as Face },
  { dIdx: 30, sideIdx: 43, sideFace: 'L' as Face },
  { dIdx: 34, sideIdx: 52, sideFace: 'B' as Face },
];

// 4 cạnh tầng giữa (Second Layer): FR(23,12), FL(21,41), BL(50,39), BR(48,14)
export const CANH_GIUA_DS = [
  { f1: 23, f2: 12, face1: 'F' as Face, face2: 'R' as Face },
  { f1: 21, f2: 41, face1: 'F' as Face, face2: 'L' as Face },
  { f1: 50, f2: 39, face1: 'B' as Face, face2: 'L' as Face },
  { f1: 48, f2: 14, face1: 'B' as Face, face2: 'R' as Face },
];

// 4 góc mặt U: URF(8,9,20), UFL(6,18,38), ULB(0,36,47), UBR(2,45,11)
export const GOC_U_DS = [
  { uIdx: 8, f1Idx: 9, f2Idx: 20, face1: 'R' as Face, face2: 'F' as Face },
  { uIdx: 6, f1Idx: 18, f2Idx: 38, face1: 'F' as Face, face2: 'L' as Face },
  { uIdx: 0, f1Idx: 36, f2Idx: 47, face1: 'L' as Face, face2: 'B' as Face },
  { uIdx: 2, f1Idx: 45, f2Idx: 11, face1: 'B' as Face, face2: 'R' as Face },
];

// 4 góc mặt D: DFR(29,26,15), DLF(27,44,24), DBL(33,53,42), DRB(35,17,51)
export const GOC_D_DS = [
  { dIdx: 29, f1Idx: 26, f2Idx: 15, face1: 'F' as Face, face2: 'R' as Face },
  { dIdx: 27, f1Idx: 44, f2Idx: 24, face1: 'L' as Face, face2: 'F' as Face },
  { dIdx: 33, f1Idx: 53, f2Idx: 42, face1: 'B' as Face, face2: 'L' as Face },
  { dIdx: 35, f1Idx: 17, f2Idx: 51, face1: 'R' as Face, face2: 'B' as Face },
];

// ==============================================================================
// 2. Các hàm kiểm tra điều kiện hoàn thành từng giai đoạn
// ==============================================================================

/**
 * Kiểm tra Daisy (Hoa cúc): Cả 4 ô cạnh của mặt U đều có màu trắng ('D').
 */
export function laDaisyXong(tt: CubeState): boolean {
  const f = tt.facelets;
  return CANH_U_DS.every((c) => f[c.uIdx] === 'D');
}

/**
 * Kiểm tra White Cross (Chữ thập trắng ở đáy): Cả 4 cạnh D đều có 'D' và khớp tâm bên.
 */
export function laWhiteCrossXong(tt: CubeState): boolean {
  const f = tt.facelets;
  return CANH_D_DS.every((c) => f[c.dIdx] === 'D' && f[c.sideIdx] === c.sideFace);
}

/**
 * Kiểm tra trạng thái đang giải White Cross:
 * Tất cả 4 cạnh trắng đều nằm trên U (hoa cúc) hoặc đã nằm đúng vị trí ở chữ thập đáy D.
 */
export function laDangGiaiWhiteCross(tt: CubeState): boolean {
  if (laWhiteCrossXong(tt)) return false;
  const f = tt.facelets;
  const soPetalTrenU = CANH_U_DS.filter((c) => f[c.uIdx] === 'D').length;
  const soCrossDungO_D = CANH_D_DS.filter((c) => f[c.dIdx] === 'D' && f[c.sideIdx] === c.sideFace).length;
  return soPetalTrenU + soCrossDungO_D === 4 && soPetalTrenU > 0;
}

/**
 * Kiểm tra Tầng 1 (White Layer): Chữ thập trắng xong + 4 góc D đều đúng màu.
 */
export function laTang1Xong(tt: CubeState): boolean {
  if (!laWhiteCrossXong(tt)) return false;
  const f = tt.facelets;
  return GOC_D_DS.every(
    (g) => f[g.dIdx] === 'D' && f[g.f1Idx] === g.face1 && f[g.f2Idx] === g.face2
  );
}

/**
 * Kiểm tra Tầng 2 (Second Layer): Tầng 1 xong + 4 cạnh giữa đều đúng màu.
 */
export function laTang2Xong(tt: CubeState): boolean {
  if (!laTang1Xong(tt)) return false;
  const f = tt.facelets;
  return CANH_GIUA_DS.every(
    (c) => f[c.f1] === c.face1 && f[c.f2] === c.face2
  );
}

/**
 * Kiểm tra Chữ thập vàng (Yellow Cross trên mặt U): Tầng 2 xong + 4 cạnh U đều có 'U'.
 */
export function laYellowCrossXong(tt: CubeState): boolean {
  if (!laTang2Xong(tt)) return false;
  const f = tt.facelets;
  return CANH_U_DS.every((c) => f[c.uIdx] === 'U');
}

/**
 * Kiểm tra Khớp cạnh vàng (Align Yellow Edges): Chữ thập vàng xong + 4 cạnh U khớp tâm bên.
 */
export function laYellowEdgesXong(tt: CubeState): boolean {
  if (!laYellowCrossXong(tt)) return false;
  const f = tt.facelets;
  return CANH_U_DS.every((c) => f[c.sideIdx] === c.sideFace);
}

/**
 * Kiểm tra Vị trí góc vàng (Position Yellow Corners): 4 góc vàng nằm đúng vị trí 3 tâm kề.
 */
export function laGoodCornersXong(tt: CubeState): boolean {
  if (!laYellowEdgesXong(tt)) return false;
  const f = tt.facelets;
  return GOC_U_DS.every((g) => {
    const mauGoc = [f[g.uIdx], f[g.f1Idx], f[g.f2Idx]].sort().join('');
    const mauDung = ['U', g.face1, g.face2].sort().join('');
    return mauGoc === mauDung;
  });
}

/**
 * Xác định giai đoạn hiện tại của khối Rubik theo State Machine.
 */
export function xacDinhGiaiDoan(tt: CubeState): TutorialStageId {
  if (isSolved(tt)) return 'SOLVED';
  if (laGoodCornersXong(tt)) return 'TWIST_FINAL_CORNERS';
  if (laYellowEdgesXong(tt)) return 'POSITION_YELLOW_CORNERS';
  if (laYellowCrossXong(tt)) return 'ALIGN_YELLOW_EDGES';
  if (laTang2Xong(tt)) return 'YELLOW_CROSS';
  if (laTang1Xong(tt)) return 'SECOND_LAYER';
  if (laWhiteCrossXong(tt)) return 'WHITE_CORNERS';
  if (laDangGiaiWhiteCross(tt) || laDaisyXong(tt)) return 'WHITE_CROSS';
  return 'DAISY';
}

// ==============================================================================
// 3. Helper chuyển đổi Move thành BeginnerMoveInstruction (không dùng X2)
// ==============================================================================

export function taoHuongDanNuocDi(dsNuoc: Move[]): BeginnerMoveInstruction[] {
  // Decompose mọi nước đôi '2' thành 2 nước quarter-turn rời
  const dsDon: Move[] = [];
  for (const n of dsNuoc) {
    if (n.turn === '2') {
      dsDon.push({ face: n.face, turn: '' });
      dsDon.push({ face: n.face, turn: '' });
    } else {
      dsDon.push(n);
    }
  }

  const tong = dsDon.length;
  return dsDon.map((n, i) => {
    const idx = i + 1;
    const isCcw = n.turn === "'";
    const dirStr = isCcw ? 'ngược chiều kim đồng hồ' : 'theo chiều kim đồng hồ';
    const dirStrEn = isCcw ? 'counter-clockwise' : 'clockwise';

    let tenMatVn = 'mặt phải';
    let tenMatEn = 'Right';
    switch (n.face) {
      case 'U': tenMatVn = 'mặt trên'; tenMatEn = 'Top'; break;
      case 'D': tenMatVn = 'mặt đáy'; tenMatEn = 'Bottom'; break;
      case 'L': tenMatVn = 'mặt trái'; tenMatEn = 'Left'; break;
      case 'R': tenMatVn = 'mặt phải'; tenMatEn = 'Right'; break;
      case 'F': tenMatVn = 'mặt trước'; tenMatEn = 'Front'; break;
      case 'B': tenMatVn = 'mặt sau'; tenMatEn = 'Back'; break;
    }

    return {
      move: n,
      quarterIndex: idx,
      totalQuarters: tong,
      arrowDir: isCcw ? 'ccw' : 'cw',
      actionNameVn: `Xoay ${tenMatVn} 90° ${dirStr}`,
      actionNameEn: `Turn ${tenMatEn} 90° ${dirStrEn}`,
    };
  });
}

// ==============================================================================
// 4. Case Detector và Step Generator chi tiết cho từng giai đoạn
// ==============================================================================

function demSoCanhTrangDungDuoiDay(tt: CubeState): number {
  return CANH_D_DS.filter((c) => tt.facelets[c.dIdx] === 'D' && tt.facelets[c.sideIdx] === c.sideFace).length;
}

function timNuocUXoaySlotTrong(tt: CubeState, slotDich: number): Move[] {
  const cacLuaChon: Move[][] = [
    [],
    [{ face: 'U', turn: '' }],
    [{ face: 'U', turn: '' }, { face: 'U', turn: '' }],
    [{ face: 'U', turn: "'" }],
  ];
  for (const nuoc of cacLuaChon) {
    const sau = applyMoves(tt, nuoc);
    if (sau.facelets[slotDich] !== 'D') {
      return nuoc;
    }
  }
  return [];
}

interface CauHinhGocTrang {
  top: (typeof GOC_U_DS)[number];
  bottom: (typeof GOC_D_DS)[number];
  moves: Move[];
}

const CAC_CAU_HINH_GOC_TRANG: CauHinhGocTrang[] = [
  {
    top: GOC_U_DS[0],
    bottom: GOC_D_DS[0],
    moves: [
      { face: 'R', turn: '' }, { face: 'U', turn: '' },
      { face: 'R', turn: "'" }, { face: 'U', turn: "'" },
    ],
  },
  {
    top: GOC_U_DS[1],
    bottom: GOC_D_DS[1],
    moves: [
      { face: 'L', turn: "'" }, { face: 'U', turn: "'" },
      { face: 'L', turn: '' }, { face: 'U', turn: '' },
    ],
  },
  {
    top: GOC_U_DS[2],
    bottom: GOC_D_DS[2],
    moves: [
      { face: 'B', turn: "'" }, { face: 'U', turn: "'" },
      { face: 'B', turn: '' }, { face: 'U', turn: '' },
    ],
  },
  {
    top: GOC_U_DS[3],
    bottom: GOC_D_DS[3],
    moves: [
      { face: 'B', turn: '' }, { face: 'U', turn: '' },
      { face: 'B', turn: "'" }, { face: 'U', turn: "'" },
    ],
  },
];

function maGoc(ds: { uIdx?: number; dIdx?: number; f1Idx: number; f2Idx: number }, f: string): string {
  const stickers = [
    ds.uIdx === undefined ? f[ds.dIdx!] : f[ds.uIdx],
    f[ds.f1Idx],
    f[ds.f2Idx],
  ];
  return stickers.sort().join('');
}

function lapLaiNuoc(ds: Move[], soLan: number): Move[] {
  return Array.from({ length: soLan }, () => ds).flat();
}

function taoBuocGocTrang(tt: CubeState): TutorialStepDetail {
  const f = tt.facelets;
  const cauHinhDich = CAC_CAU_HINH_GOC_TRANG.find(
    (c) => !(f[c.bottom.dIdx] === 'D' && f[c.bottom.f1Idx] === c.bottom.face1 && f[c.bottom.f2Idx] === c.bottom.face2),
  );

  if (!cauHinhDich) {
    return {
      stageId: 'WHITE_CORNERS',
      caseId: 'WHITE_CORNER_CHECK',
      titleVn: 'Kiểm tra góc trắng',
      titleEn: 'Check white corners',
      explanationVn: 'Kiểm tra lại các góc trắng trước khi tiếp tục.',
      explanationEn: 'Check the white corners before continuing.',
      moves: [],
      moveInstructions: [],
      cameraCue: 'front-right',
      isComplete: false,
    };
  }

  const keyDich = ['D', cauHinhDich.bottom.face1, cauHinhDich.bottom.face2].sort().join('');
  const topPosition = CAC_CAU_HINH_GOC_TRANG.findIndex((c) => maGoc(c.top, f) === keyDich);

  if (topPosition >= 0) {
    let uMoves: Move[] = [];
    let ttTam = tt;
    for (let i = 0; i < 4 && maGoc(cauHinhDich.top, ttTam.facelets) !== keyDich; i += 1) {
      uMoves.push({ face: 'U', turn: '' });
      ttTam = applyMove(ttTam, { face: 'U', turn: '' });
    }

    for (let soLan = 1; soLan <= 3; soLan += 1) {
      const moves = [...uMoves, ...lapLaiNuoc(cauHinhDich.moves, soLan)];
      const after = applyMoves(tt, moves);
      if (
        after.facelets[cauHinhDich.bottom.dIdx] === 'D'
        && after.facelets[cauHinhDich.bottom.f1Idx] === cauHinhDich.bottom.face1
        && after.facelets[cauHinhDich.bottom.f2Idx] === cauHinhDich.bottom.face2
      ) {
        return {
          stageId: 'WHITE_CORNERS',
          caseId: 'WHITE_CORNER_INSERT',
          titleVn: 'Chèn góc trắng vào tầng 1',
          titleEn: 'Insert white corner to layer 1',
          algorithmName: soLan === 1 ? 'Corner insertion' : 'Corner insertion (repeat)',
          explanationVn: 'Đưa góc trắng lên trên vị trí đúng rồi lặp Righty hoặc Lefty đến khi góc nằm đúng hướng.',
          explanationEn: 'Place the white corner above its slot, then repeat Righty or Lefty until it is solved.',
          moves,
          moveInstructions: taoHuongDanNuocDi(moves),
          cameraCue: 'front-right',
          isComplete: false,
        };
      }
    }

    const moves = [...uMoves, ...cauHinhDich.moves];
    return {
      stageId: 'WHITE_CORNERS',
      caseId: 'WHITE_CORNER_INSERT',
      titleVn: 'Chèn góc trắng vào tầng 1',
      titleEn: 'Insert white corner to layer 1',
      algorithmName: 'Corner insertion',
      explanationVn: 'Đưa góc trắng lên trên vị trí đúng rồi thực hiện công thức chèn.',
      explanationEn: 'Place the white corner above its slot, then perform the insertion algorithm.',
      moves,
      moveInstructions: taoHuongDanNuocDi(moves),
      cameraCue: 'front-right',
      isComplete: false,
    };
  }

  const bottomPosition = CAC_CAU_HINH_GOC_TRANG.findIndex((c) => maGoc(c.bottom, f) === keyDich);
  const cauHinhBat = bottomPosition >= 0 ? CAC_CAU_HINH_GOC_TRANG[bottomPosition] : cauHinhDich;
  return {
    stageId: 'WHITE_CORNERS',
    caseId: 'WHITE_CORNER_POP',
    titleVn: 'Lấy góc trắng kẹt ở tầng dưới lên',
    titleEn: 'Pop out stuck corner',
    algorithmName: 'Corner insertion',
    explanationVn: 'Góc trắng đang ở tầng dưới nhưng chưa đúng vị trí. Thực hiện công thức tại vị trí của nó để đưa lên tầng trên.',
    explanationEn: 'The white corner is in the bottom layer but misplaced. Use the insertion algorithm at its slot to bring it up.',
    moves: cauHinhBat.moves,
    moveInstructions: taoHuongDanNuocDi(cauHinhBat.moves),
    cameraCue: 'front-right',
    isComplete: false,
  };
}

const CAC_CONG_THUC_TANG_HAI: Move[][] = [
  [
    { face: 'U', turn: '' }, { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'R', turn: "'" },
    { face: 'U', turn: "'" }, { face: 'F', turn: "'" }, { face: 'U', turn: '' }, { face: 'F', turn: '' },
  ],
  [
    { face: 'U', turn: "'" }, { face: 'L', turn: "'" }, { face: 'U', turn: '' }, { face: 'L', turn: '' },
    { face: 'U', turn: '' }, { face: 'F', turn: '' }, { face: 'U', turn: "'" }, { face: 'F', turn: "'" },
  ],
  [
    { face: 'U', turn: '' }, { face: 'B', turn: '' }, { face: 'U', turn: "'" }, { face: 'B', turn: "'" },
    { face: 'U', turn: "'" }, { face: 'R', turn: "'" }, { face: 'U', turn: '' }, { face: 'R', turn: '' },
  ],
  [
    { face: 'U', turn: "'" }, { face: 'R', turn: "'" }, { face: 'U', turn: '' }, { face: 'R', turn: '' },
    { face: 'U', turn: '' }, { face: 'B', turn: '' }, { face: 'U', turn: "'" }, { face: 'B', turn: "'" },
  ],
  [
    { face: 'U', turn: '' }, { face: 'L', turn: '' }, { face: 'U', turn: "'" }, { face: 'L', turn: "'" },
    { face: 'U', turn: "'" }, { face: 'B', turn: "'" }, { face: 'U', turn: '' }, { face: 'B', turn: '' },
  ],
  [
    { face: 'U', turn: "'" }, { face: 'B', turn: "'" }, { face: 'U', turn: '' }, { face: 'B', turn: '' },
    { face: 'U', turn: '' }, { face: 'L', turn: '' }, { face: 'U', turn: "'" }, { face: 'L', turn: "'" },
  ],
  [
    { face: 'U', turn: '' }, { face: 'F', turn: '' }, { face: 'U', turn: "'" }, { face: 'F', turn: "'" },
    { face: 'U', turn: "'" }, { face: 'L', turn: "'" }, { face: 'U', turn: '' }, { face: 'L', turn: '' },
  ],
  [
    { face: 'U', turn: "'" }, { face: 'F', turn: "'" }, { face: 'U', turn: '' }, { face: 'F', turn: '' },
    { face: 'U', turn: '' }, { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'R', turn: "'" },
  ],
];

function demSoCanhTangGiuaDung(tt: CubeState): number {
  const f = tt.facelets;
  return CANH_GIUA_DS.filter((c) => f[c.f1] === c.face1 && f[c.f2] === c.face2).length;
}

function demSoCanhKhongVangTrenU(tt: CubeState): number {
  const f = tt.facelets;
  return CANH_U_DS.filter((c) => f[c.uIdx] !== 'U' && f[c.sideIdx] !== 'U').length;
}

function taoBuocTangHai(tt: CubeState): TutorialStepDetail {
  const before = demSoCanhTangGiuaDung(tt);
  const beforeTop = demSoCanhKhongVangTrenU(tt);
  const cacLuaChonU: Move[][] = [
    [],
    [{ face: 'U', turn: '' }],
    [{ face: 'U', turn: '' }, { face: 'U', turn: '' }],
    [{ face: 'U', turn: "'" }],
  ];

  let bestMoves: Move[] | undefined;
  let bestScore = before;
  let bestTop = beforeTop;
  for (const prefix of cacLuaChonU) {
    for (const formula of CAC_CONG_THUC_TANG_HAI) {
      const moves = [...prefix, ...formula];
      const after = applyMoves(tt, moves);
      if (!laTang1Xong(after)) continue;
      const score = demSoCanhTangGiuaDung(after);
      const top = demSoCanhKhongVangTrenU(after);
      if (score > bestScore || (score === bestScore && top > bestTop)) {
        bestMoves = moves;
        bestScore = score;
        bestTop = top;
      }
    }
  }

  if (!bestMoves) {
    for (const prefix of cacLuaChonU) {
      for (const formula of CAC_CONG_THUC_TANG_HAI) {
        const moves = [...prefix, ...formula];
        const after = applyMoves(tt, moves);
        if (laTang1Xong(after) && after.facelets !== tt.facelets) {
          const score = demSoCanhTangGiuaDung(after);
          const top = demSoCanhKhongVangTrenU(after);
          if (!bestMoves || score > bestScore || (score === bestScore && top > bestTop)) {
            bestMoves = moves;
            bestScore = score;
            bestTop = top;
          }
        }
      }
    }
  }

  const moves = bestMoves ?? CAC_CONG_THUC_TANG_HAI[0];
  return {
    stageId: 'SECOND_LAYER',
    caseId: bestScore > before ? 'SECOND_LAYER_INSERT' : 'SECOND_LAYER_POP',
    titleVn: bestScore > before ? 'Chèn cạnh vào tầng 2' : 'Đẩy cạnh kẹt ở tầng 2 lên đỉnh',
    titleEn: bestScore > before ? 'Insert edge into layer 2' : 'Pop out stuck edge',
    algorithmName: 'Layer 2 insertion',
    explanationVn: bestScore > before
      ? 'Đưa cạnh không có màu vàng vào đúng vị trí tầng giữa.'
      : 'Dùng công thức chèn để đưa một cạnh sai lên đỉnh rồi tiếp tục.',
    explanationEn: bestScore > before
      ? 'Insert the non-yellow edge into its correct middle-layer slot.'
      : 'Use the insertion algorithm to bring a misplaced edge to the top, then continue.',
    moves,
    moveInstructions: taoHuongDanNuocDi(moves),
    cameraCue: 'front-right',
    isComplete: false,
  };
}

interface LuaChonCongThuc {
  moves: Move[];
  name: string;
}

function timNuocDatMucTieu(
  tt: CubeState,
  congThuc: LuaChonCongThuc[],
  datMucTieu: (state: CubeState) => boolean,
  giuTrangThai: (state: CubeState) => boolean,
  doSauToiDa: number,
): Move[] | undefined {
  if (datMucTieu(tt)) return [];

  const daThay = new Set([tt.facelets]);
  const hangDoi: Array<{ state: CubeState; depth: number; path: Move[] }> = [
    { state: tt, depth: 0, path: [] },
  ];

  while (hangDoi.length > 0) {
    const hienTai = hangDoi.shift()!;
    if (hienTai.depth >= doSauToiDa) continue;

    for (const luaChon of congThuc) {
      const moi = applyMoves(hienTai.state, luaChon.moves);
      if (!giuTrangThai(moi)) continue;

      const duongDi = [...hienTai.path, ...luaChon.moves];
      if (datMucTieu(moi)) return duongDi;
      if (daThay.has(moi.facelets)) continue;

      daThay.add(moi.facelets);
      hangDoi.push({ state: moi, depth: hienTai.depth + 1, path: duongDi });
    }
  }

  return undefined;
}

const CAC_NUOC_XOAY_U: LuaChonCongThuc[] = [
  { moves: [{ face: 'U', turn: '' }], name: 'Up' },
  { moves: [{ face: 'U', turn: '2' }], name: 'Up twice' },
  { moves: [{ face: 'U', turn: "'" }], name: 'Up back' },
];

const CONG_THUC_SUNE: LuaChonCongThuc[] = [
  {
    name: 'Sune algorithm',
    moves: [
      { face: 'R', turn: '' }, { face: 'U', turn: '' }, { face: 'R', turn: "'" },
      { face: 'U', turn: '' }, { face: 'R', turn: '' }, { face: 'U', turn: '2' },
      { face: 'R', turn: "'" },
    ],
  },
  {
    name: 'Sune reverse',
    moves: [
      { face: 'R', turn: '' }, { face: 'U', turn: '2' }, { face: 'R', turn: "'" },
      { face: 'U', turn: "'" }, { face: 'R', turn: '' }, { face: 'U', turn: "'" },
      { face: 'R', turn: "'" },
    ],
  },
];

const CONG_THUC_NIKLAS: LuaChonCongThuc[] = [
  {
    name: 'Niklas algorithm',
    moves: [
      { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'L', turn: "'" },
      { face: 'U', turn: '' }, { face: 'R', turn: "'" }, { face: 'U', turn: "'" },
      { face: 'L', turn: '' }, { face: 'U', turn: '' },
    ],
  },
  {
    name: 'Niklas reverse',
    moves: [
      { face: 'U', turn: "'" }, { face: 'L', turn: "'" }, { face: 'U', turn: '' },
      { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'L', turn: '' },
      { face: 'U', turn: '' }, { face: 'R', turn: "'" },
    ],
  },
];

/**
 * Sinh bước hướng dẫn tiếp theo cho người học Rubik theo BEGINNER_GUIDE.md.
 * Đảm bảo tính tất định, không bao giờ loop vô hạn trên mặt U.
 */
export function taoBuocHuongDan(
  tt: CubeState,
  giuGiaiDoan8 = false,
): TutorialStepDetail {
  const gd = giuGiaiDoan8 && !isSolved(tt)
    ? 'TWIST_FINAL_CORNERS'
    : xacDinhGiaiDoan(tt);
  const meta = STAGE_METAS[gd];
  const f = tt.facelets;

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 1: DAISY (Tạo hoa cúc trắng trên đỉnh vàng)
  // ----------------------------------------------------------------------------
  if (gd === 'DAISY') {
    // 1. Tầng giữa (Middle layer):
    // FR_F (23) -> slot 5 (UR) bang R
    if (f[23] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 5);
      const ds: Move[] = [...uNuoc, { face: 'R', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_FR_F',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay R để đưa lên hoa cúc." : "Xoay R để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn R to bring to daisy." : "Turn R to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // FR_R (12) -> slot 7 (UF) bang F'
    if (f[12] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 7);
      const ds: Move[] = [...uNuoc, { face: 'F', turn: "'" }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_FR_R',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay F' để đưa lên hoa cúc." : "Xoay F' để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn F' to bring to daisy." : "Turn F' to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // FL_F (21) -> slot 3 (UL) bang L'
    if (f[21] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 3);
      const ds: Move[] = [...uNuoc, { face: 'L', turn: "'" }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_FL_F',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay L' để đưa lên hoa cúc." : "Xoay L' để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn L' to bring to daisy." : "Turn L' to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // FL_L (41) -> slot 7 (UF) bang F
    if (f[41] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 7);
      const ds: Move[] = [...uNuoc, { face: 'F', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_FL_L',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay F để đưa lên hoa cúc." : "Xoay F để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn F to bring to daisy." : "Turn F to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // BR_B (48) -> slot 5 (UR) bang R'
    if (f[48] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 5);
      const ds: Move[] = [...uNuoc, { face: 'R', turn: "'" }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_BR_B',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay R' để đưa lên hoa cúc." : "Xoay R' để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn R' to bring to daisy." : "Turn R' to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // BR_R (14) -> slot 1 (UB) bang B
    if (f[14] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 1);
      const ds: Move[] = [...uNuoc, { face: 'B', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_BR_R',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay B để đưa lên hoa cúc." : "Xoay B để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn B to bring to daisy." : "Turn B to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // BL_B (50) -> slot 3 (UL) bang L
    if (f[50] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 3);
      const ds: Move[] = [...uNuoc, { face: 'L', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_BL_B',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay L để đưa lên hoa cúc." : "Xoay L để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn L to bring to daisy." : "Turn L to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    // BL_L (39) -> slot 1 (UB) bang B'
    if (f[39] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 1);
      const ds: Move[] = [...uNuoc, { face: 'B', turn: "'" }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_MID_BL_L',
        titleVn: 'Đưa cạnh trắng tầng giữa lên hoa cúc',
        titleEn: 'Move middle white edge to daisy',
        explanationVn: uNuoc.length > 0 ? "Xoay U để né cánh hoa cũ, rồi xoay B' để đưa lên hoa cúc." : "Xoay B' để đưa cánh hoa trắng lên đỉnh hoa cúc.",
        explanationEn: uNuoc.length > 0 ? "Turn U to clear slot, then turn B' to bring to daisy." : "Turn B' to bring white petal to daisy.",
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }

    // 2. Tầng đáy hướng xuống D:
    if (f[28] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 7);
      const ds: Move[] = [...uNuoc, { face: 'F', turn: '' }, { face: 'F', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_BOTTOM_DF',
        titleVn: 'Đưa cạnh trắng từ đáy lên hoa cúc',
        titleEn: 'Bring bottom white edge to daisy',
        explanationVn: uNuoc.length > 0 ? 'Xoay U để né cánh hoa cũ, rồi xoay F 180° để đưa lên hoa cúc.' : 'Xoay F 180° để đưa cánh hoa trắng từ đáy lên hoa cúc.',
        explanationEn: uNuoc.length > 0 ? 'Turn U to clear slot, then turn F 180°.' : 'Turn F 180° to bring bottom white edge to daisy.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[32] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 5);
      const ds: Move[] = [...uNuoc, { face: 'R', turn: '' }, { face: 'R', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_BOTTOM_DR',
        titleVn: 'Đưa cạnh trắng từ đáy lên hoa cúc',
        titleEn: 'Bring bottom white edge to daisy',
        explanationVn: uNuoc.length > 0 ? 'Xoay U để né cánh hoa cũ, rồi xoay R 180° để đưa lên hoa cúc.' : 'Xoay R 180° để đưa cánh hoa trắng từ đáy lên hoa cúc.',
        explanationEn: uNuoc.length > 0 ? 'Turn U to clear slot, then turn R 180°.' : 'Turn R 180° to bring bottom white edge to daisy.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[34] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 1);
      const ds: Move[] = [...uNuoc, { face: 'B', turn: '' }, { face: 'B', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_BOTTOM_DB',
        titleVn: 'Đưa cạnh trắng từ đáy lên hoa cúc',
        titleEn: 'Bring bottom white edge to daisy',
        explanationVn: uNuoc.length > 0 ? 'Xoay U để né cánh hoa cũ, rồi xoay B 180° để đưa lên hoa cúc.' : 'Xoay B 180° để đưa cánh hoa trắng từ đáy lên hoa cúc.',
        explanationEn: uNuoc.length > 0 ? 'Turn U to clear slot, then turn B 180°.' : 'Turn B 180° to bring bottom white edge to daisy.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[30] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 3);
      const ds: Move[] = [...uNuoc, { face: 'L', turn: '' }, { face: 'L', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_BOTTOM_DL',
        titleVn: 'Đưa cạnh trắng từ đáy lên hoa cúc',
        titleEn: 'Bring bottom white edge to daisy',
        explanationVn: uNuoc.length > 0 ? 'Xoay U để né cánh hoa cũ, rồi xoay L 180° để đưa lên hoa cúc.' : 'Xoay L 180° để đưa cánh hoa trắng từ đáy lên hoa cúc.',
        explanationEn: uNuoc.length > 0 ? 'Turn U to clear slot, then turn L 180°.' : 'Turn L 180° to bring bottom white edge to daisy.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }

    // 3. Tầng đáy nhưng trắng ở mặt bên:
    if (f[25] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 7);
      const ds: Move[] = [...uNuoc, { face: 'F', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_BOTTOM_F',
        titleVn: 'Đưa cạnh trắng đáy sang tầng giữa',
        titleEn: 'Move bottom edge to middle',
        explanationVn: 'Xoay F để đưa cạnh trắng lên tầng giữa.',
        explanationEn: 'Turn F to move white edge to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[16] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 5);
      const ds: Move[] = [...uNuoc, { face: 'R', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_BOTTOM_R',
        titleVn: 'Đưa cạnh trắng đáy sang tầng giữa',
        titleEn: 'Move bottom edge to middle',
        explanationVn: 'Xoay R để đưa cạnh trắng lên tầng giữa.',
        explanationEn: 'Turn R to move white edge to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[52] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 1);
      const ds: Move[] = [...uNuoc, { face: 'B', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_BOTTOM_B',
        titleVn: 'Đưa cạnh trắng đáy sang tầng giữa',
        titleEn: 'Move bottom edge to middle',
        explanationVn: 'Xoay B để đưa cạnh trắng lên tầng giữa.',
        explanationEn: 'Turn B to move white edge to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[43] === 'D') {
      const uNuoc = timNuocUXoaySlotTrong(tt, 3);
      const ds: Move[] = [...uNuoc, { face: 'L', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_BOTTOM_L',
        titleVn: 'Đưa cạnh trắng đáy sang tầng giữa',
        titleEn: 'Move bottom edge to middle',
        explanationVn: 'Xoay L để đưa cạnh trắng lên tầng giữa.',
        explanationEn: 'Turn L to move white edge to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }

    // 4. Tầng trên bị lật ngược (trắng ở mặt bên):
    if (f[19] === 'D') {
      const ds: Move[] = [{ face: 'F', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_TOP_F',
        titleVn: 'Lật cạnh trắng ở mặt trên sang tầng giữa',
        titleEn: 'Flip top white edge to middle',
        explanationVn: 'Xoay F để đưa cánh hoa trắng sang tầng giữa.',
        explanationEn: 'Turn F to move white petal to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[10] === 'D') {
      const ds: Move[] = [{ face: 'R', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_TOP_R',
        titleVn: 'Lật cạnh trắng ở mặt trên sang tầng giữa',
        titleEn: 'Flip top white edge to middle',
        explanationVn: 'Xoay R để đưa cánh hoa trắng sang tầng giữa.',
        explanationEn: 'Turn R to move white petal to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[46] === 'D') {
      const ds: Move[] = [{ face: 'B', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_TOP_B',
        titleVn: 'Lật cạnh trắng ở mặt trên sang tầng giữa',
        titleEn: 'Flip top white edge to middle',
        explanationVn: 'Xoay B để đưa cánh hoa trắng sang tầng giữa.',
        explanationEn: 'Turn B to move white petal to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[37] === 'D') {
      const ds: Move[] = [{ face: 'L', turn: '' }];
      return {
        stageId: 'DAISY',
        caseId: 'DAISY_FLIP_TOP_L',
        titleVn: 'Lật cạnh trắng ở mặt trên sang tầng giữa',
        titleEn: 'Flip top white edge to middle',
        explanationVn: 'Xoay L để đưa cánh hoa trắng sang tầng giữa.',
        explanationEn: 'Turn L to move white petal to middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 2: WHITE CROSS (Đưa hoa cúc về chữ thập trắng ở đáy)
  // ----------------------------------------------------------------------------
  if (gd === 'WHITE_CROSS') {
    const demCrossHienTai = demSoCanhTrangDungDuoiDay(tt);
    const cacLuaChonU: Move[][] = [
      [],
      [{ face: 'U', turn: '' }],
      [{ face: 'U', turn: '' }, { face: 'U', turn: '' }],
      [{ face: 'U', turn: "'" }],
    ];

    for (const uNuoc of cacLuaChonU) {
      const tt_sau_u = applyMoves(tt, uNuoc);
      for (const c of CANH_U_DS) {
        if (tt_sau_u.facelets[c.uIdx] === 'D' && tt_sau_u.facelets[c.sideIdx] === c.sideFace) {
          const dsHa: Move[] = [{ face: c.sideFace, turn: '' }, { face: c.sideFace, turn: '' }];
          const ds = [...uNuoc, ...dsHa];
          const tt_moi = applyMoves(tt, ds);
          if (demSoCanhTrangDungDuoiDay(tt_moi) > demCrossHienTai) {
            return {
              stageId: 'WHITE_CROSS',
              caseId: uNuoc.length === 0 ? 'CROSS_DROP_PETAL' : 'CROSS_MATCH_AND_DROP',
              titleVn: `Đưa cạnh trắng-${c.sideFace} xuống đáy`,
              titleEn: `Drop white-${c.sideFace} to bottom`,
              explanationVn: uNuoc.length === 0
                ? `Cạnh trắng-${c.sideFace} đã khớp tâm bên! Xoay ${c.sideFace} 180° để đưa xuống chữ thập đáy.`
                : `Xoay U để khớp cạnh trắng-${c.sideFace} với tâm bên, rồi xoay ${c.sideFace} 180° xuống chữ thập đáy.`,
              explanationEn: uNuoc.length === 0
                ? `White-${c.sideFace} matched side center! Turn ${c.sideFace} 180° to drop to bottom cross.`
                : `Turn U to match white-${c.sideFace} with side center, then turn ${c.sideFace} 180° to drop to bottom cross.`,
              moves: ds,
              moveInstructions: taoHuongDanNuocDi(ds),
              cameraCue: 'front-right',
              isComplete: false,
            };
          }
        }
      }
    }
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 3: WHITE CORNERS (Giải tầng 1 / White Layer)
  // ----------------------------------------------------------------------------
  if (gd === 'WHITE_CORNERS') {
    return taoBuocGocTrang(tt);
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 4: SECOND LAYER (Giải tầng 2)
  // ----------------------------------------------------------------------------
  if (gd === 'SECOND_LAYER') {
    return taoBuocTangHai(tt);
    /*
    const canhKhongVang = CANH_U_DS.find((c) => f[c.uIdx] !== 'U' && f[c.sideIdx] !== 'U');
    if (canhKhongVang) {
      const mauTren = f[canhKhongVang.uIdx] as Face;
      const mauBen = f[canhKhongVang.sideIdx] as Face;

      let uMoves: Move[] = [];
      let tt_tam = tt;
      for (let s = 0; s < 4; s += 1) {
        const canhHienTai = CANH_U_DS.find((c) => tt_tam.facelets[c.uIdx] === mauTren && tt_tam.facelets[c.sideIdx] === mauBen);
        if (canhHienTai && canhHienTai.sideFace === mauBen) {
          break;
        }
        uMoves.push({ face: 'U', turn: '' });
        tt_tam = applyMove(tt_tam, { face: 'U', turn: '' });
      }

      let insertMoves: Move[] = [
        { face: 'U', turn: '' }, { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'R', turn: "'" },
        { face: 'U', turn: "'" }, { face: 'F', turn: "'" }, { face: 'U', turn: '' }, { face: 'F', turn: '' }
      ];

      if (mauBen === 'F' && mauTren === 'L') {
        insertMoves = [
          { face: 'U', turn: "'" }, { face: 'L', turn: "'" }, { face: 'U', turn: '' }, { face: 'L', turn: '' },
          { face: 'U', turn: '' }, { face: 'F', turn: '' }, { face: 'U', turn: "'" }, { face: 'F', turn: "'" }
        ];
      } else if (mauBen === 'R' && mauTren === 'F') {
        insertMoves = [
          { face: 'U', turn: "'" }, { face: 'F', turn: "'" }, { face: 'U', turn: '' }, { face: 'F', turn: '' },
          { face: 'U', turn: '' }, { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'R', turn: "'" }
        ];
      } else if (mauBen === 'R' && mauTren === 'B') {
        insertMoves = [
          { face: 'U', turn: '' }, { face: 'B', turn: '' }, { face: 'U', turn: "'" }, { face: 'B', turn: "'" },
          { face: 'U', turn: "'" }, { face: 'R', turn: "'" }, { face: 'U', turn: '' }, { face: 'R', turn: '' }
        ];
      } else if (mauBen === 'B' && mauTren === 'R') {
        insertMoves = [
          { face: 'U', turn: "'" }, { face: 'R', turn: "'" }, { face: 'U', turn: '' }, { face: 'R', turn: '' },
          { face: 'U', turn: '' }, { face: 'B', turn: '' }, { face: 'U', turn: "'" }, { face: 'B', turn: "'" }
        ];
      } else if (mauBen === 'B' && mauTren === 'L') {
        insertMoves = [
          { face: 'U', turn: '' }, { face: 'L', turn: '' }, { face: 'U', turn: "'" }, { face: 'L', turn: "'" },
          { face: 'U', turn: "'" }, { face: 'B', turn: "'" }, { face: 'U', turn: '' }, { face: 'B', turn: '' }
        ];
      } else if (mauBen === 'L' && mauTren === 'B') {
        insertMoves = [
          { face: 'U', turn: "'" }, { face: 'B', turn: "'" }, { face: 'U', turn: '' }, { face: 'B', turn: '' },
          { face: 'U', turn: '' }, { face: 'L', turn: '' }, { face: 'U', turn: "'" }, { face: 'L', turn: "'" }
        ];
      } else if (mauBen === 'L' && mauTren === 'F') {
        insertMoves = [
          { face: 'U', turn: '' }, { face: 'F', turn: '' }, { face: 'U', turn: "'" }, { face: 'F', turn: "'" },
          { face: 'U', turn: "'" }, { face: 'L', turn: "'" }, { face: 'U', turn: '' }, { face: 'L', turn: '' }
        ];
      }

      const ds: Move[] = [...uMoves, ...insertMoves];
      return {
        stageId: 'SECOND_LAYER',
        caseId: 'SECOND_LAYER_INSERT',
        titleVn: 'Chèn cạnh vào tầng 2',
        titleEn: 'Insert edge into layer 2',
        algorithmName: 'Layer 2 insertion',
        explanationVn: 'Khớp cạnh với tâm và thực hiện công thức chèn cạnh vào tầng giữa.',
        explanationEn: 'Align edge with center and insert into middle layer.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'front-right',
        isComplete: false,
      };
    }

    const popFR: Move[] = [
      { face: 'U', turn: '' }, { face: 'R', turn: '' }, { face: 'U', turn: "'" }, { face: 'R', turn: "'" },
      { face: 'U', turn: "'" }, { face: 'F', turn: "'" }, { face: 'U', turn: '' }, { face: 'F', turn: '' }
    ];
    return {
      stageId: 'SECOND_LAYER',
      caseId: 'SECOND_LAYER_POP',
      titleVn: 'Đẩy cạnh kẹt ở tầng 2 lên đỉnh',
      titleEn: 'Pop out stuck edge',
      algorithmName: 'Layer 2 insertion',
      explanationVn: 'Dùng công thức chèn để đẩy cạnh sai hướng từ tầng 2 lên tầng trên.',
      explanationEn: 'Perform insertion to pop stuck edge to top layer.',
      moves: popFR,
      moveInstructions: taoHuongDanNuocDi(popFR),
      cameraCue: 'front-right',
      isComplete: false,
    };
    */
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 5: YELLOW CROSS (Tạo chữ thập vàng)
  // ----------------------------------------------------------------------------
  if (gd === 'YELLOW_CROSS') {
    const yellowCrossAlg: Move[] = [
      { face: 'F', turn: '' },
      { face: 'R', turn: '' },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
      { face: 'U', turn: "'" },
      { face: 'F', turn: "'" },
    ];

    const soVang = CANH_U_DS.filter((c) => f[c.uIdx] === 'U').length;
    if (soVang === 0) {
      return {
        stageId: 'YELLOW_CROSS',
        caseId: 'YELLOW_CROSS_DOT',
        titleVn: 'Dạng Chấm (Dot) mặt vàng',
        titleEn: 'Dot pattern',
        algorithmName: 'F + Righty + F\'',
        explanationVn: 'Thực hiện F -> Righty -> F\' để tạo chữ L vàng.',
        explanationEn: 'Perform F -> Righty -> F\' to form yellow L-shape.',
        moves: yellowCrossAlg,
        moveInstructions: taoHuongDanNuocDi(yellowCrossAlg),
        cameraCue: 'top',
        isComplete: false,
      };
    }

    if (f[3] === 'U' && f[5] === 'U') {
      return {
        stageId: 'YELLOW_CROSS',
        caseId: 'YELLOW_CROSS_LINE',
        titleVn: 'Dạng Đường Thẳng (Line)',
        titleEn: 'Line pattern',
        algorithmName: 'F + Righty + F\'',
        explanationVn: 'Đường thẳng vàng đã nằm ngang. Thực hiện F -> Righty -> F\' để hoàn thành chữ thập.',
        explanationEn: 'Yellow line is horizontal. Perform F -> Righty -> F\' to complete cross.',
        moves: yellowCrossAlg,
        moveInstructions: taoHuongDanNuocDi(yellowCrossAlg),
        cameraCue: 'top',
        isComplete: false,
      };
    }
    if (f[1] === 'U' && f[7] === 'U') {
      const ds: Move[] = [{ face: 'U', turn: '' }, ...yellowCrossAlg];
      return {
        stageId: 'YELLOW_CROSS',
        caseId: 'YELLOW_CROSS_LINE_ALIGN',
        titleVn: 'Xoay đường thẳng vàng nằm ngang',
        titleEn: 'Align line horizontally',
        algorithmName: 'U + (F + Righty + F\')',
        explanationVn: 'Xoay U để đặt đường thẳng nằm ngang, rồi thực hiện F -> Righty -> F\'.',
        explanationEn: 'Turn U to align line horizontally, then perform F -> Righty -> F\'.',
        moves: ds,
        moveInstructions: taoHuongDanNuocDi(ds),
        cameraCue: 'top',
        isComplete: false,
      };
    }

    let uMoves: Move[] = [];
    let tt_tam = tt;
    for (let s = 0; s < 4; s += 1) {
      if (tt_tam.facelets[1] === 'U' && tt_tam.facelets[3] === 'U') {
        break;
      }
      uMoves.push({ face: 'U', turn: '' });
      tt_tam = applyMove(tt_tam, { face: 'U', turn: '' });
    }

    const ds: Move[] = [...uMoves, ...yellowCrossAlg];
    return {
      stageId: 'YELLOW_CROSS',
      caseId: 'YELLOW_CROSS_L',
      titleVn: 'Dạng Chữ L (L-shape)',
      titleEn: 'L-shape pattern',
      algorithmName: 'L-shape algorithm',
      explanationVn: 'Định vị chữ L ở góc trên-trái (9h-12h) và thực hiện F -> Righty -> F\'.',
      explanationEn: 'Position L-shape at top-left and perform F -> Righty -> F\'.',
      moves: ds,
      moveInstructions: taoHuongDanNuocDi(ds),
      cameraCue: 'top',
      isComplete: false,
    };
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 6: ALIGN YELLOW EDGES (Khớp cạnh chữ thập vàng)
  // ----------------------------------------------------------------------------
  if (gd === 'ALIGN_YELLOW_EDGES') {
    const cacCongThuc = [...CAC_NUOC_XOAY_U, ...CONG_THUC_SUNE];
    const ds = timNuocDatMucTieu(
      tt,
      cacCongThuc,
      laYellowEdgesXong,
      laTang2Xong,
      6,
    ) ?? CONG_THUC_SUNE[0].moves;
    return {
      stageId: 'ALIGN_YELLOW_EDGES',
      caseId: 'ALIGN_EDGES_SUNE',
      titleVn: 'Khớp cạnh vàng bằng thuật toán Sune',
      titleEn: 'Align yellow edges with Sune',
      algorithmName: 'Sune algorithm',
      explanationVn: 'Dùng Sune và xoay U để đưa bốn cạnh vàng khớp với tâm bên.',
      explanationEn: 'Use Sune and U turns to match all four yellow edges with the side centers.',
      moves: ds,
      moveInstructions: taoHuongDanNuocDi(ds),
      cameraCue: 'top',
      isComplete: false,
    };
    /*
    const suneAlg: Move[] = [
      { face: 'R', turn: '' },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
      { face: 'U', turn: '' },
      { face: 'R', turn: '' },
      { face: 'U', turn: '' },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
    ];

    for (const uTest of [[], [{ face: 'U', turn: '' }], [{ face: 'U', turn: '' }, { face: 'U', turn: '' }], [{ face: 'U', turn: "'" }]] as Move[][]) {
      const tt_thu = applyMoves(tt, uTest);
      const demKhop = CANH_U_DS.filter((c) => tt_thu.facelets[c.sideIdx] === c.sideFace).length;
      if (demKhop === 4) {
        return {
          stageId: 'ALIGN_YELLOW_EDGES',
          caseId: 'ALIGN_EDGES_ALL_MATCHED',
          titleVn: 'Xoay khớp toàn bộ cạnh vàng',
          titleEn: 'Align all yellow edges',
          explanationVn: 'Chỉ cần xoay U để cả 4 cạnh vàng khớp hoàn hảo với các tâm bên.',
          explanationEn: 'Just turn U to align all 4 yellow edges with side centers.',
          moves: uTest,
          moveInstructions: taoHuongDanNuocDi(uTest),
          cameraCue: 'top',
          isComplete: false,
        };
      }
    }

    let uChoSune: Move[] = [];
    for (const uTest of [[], [{ face: 'U', turn: '' }], [{ face: 'U', turn: '' }, { face: 'U', turn: '' }], [{ face: 'U', turn: "'" }]] as Move[][]) {
      const tt_thu = applyMoves(tt, uTest);
      const khopBR = tt_thu.facelets[46] === 'B' && tt_thu.facelets[10] === 'R';
      const khopFB = tt_thu.facelets[19] === 'F' && tt_thu.facelets[46] === 'B';
      if (khopBR || khopFB) {
        uChoSune = uTest;
        break;
      }
    }

    const ds: Move[] = [...uChoSune, ...suneAlg];
    return {
      stageId: 'ALIGN_YELLOW_EDGES',
      caseId: 'ALIGN_EDGES_SUNE',
      titleVn: 'Khớp cạnh vàng bằng thuật toán Sune',
      titleEn: 'Align yellow edges with Sune',
      algorithmName: 'Sune algorithm',
      explanationVn: 'Định vị các cạnh đúng và thực hiện Sune: R U R\' U R (Up, Up) R\'.',
      explanationEn: 'Position matched edges and perform Sune: R U R\' U R (Up, Up) R\'.',
      moves: ds,
      moveInstructions: taoHuongDanNuocDi(ds),
      cameraCue: 'top',
      isComplete: false,
    };
    */
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 7: POSITION YELLOW CORNERS (Đưa góc vàng về đúng vị trí)
  // ----------------------------------------------------------------------------
  if (gd === 'POSITION_YELLOW_CORNERS') {
    const cacCongThuc = [...CAC_NUOC_XOAY_U, ...CONG_THUC_NIKLAS];
    const ds = timNuocDatMucTieu(
      tt,
      cacCongThuc,
      laGoodCornersXong,
      laYellowCrossXong,
      8,
    ) ?? CONG_THUC_NIKLAS[0].moves;
    return {
      stageId: 'POSITION_YELLOW_CORNERS',
      caseId: 'POSITION_CORNERS_NIKLAS',
      titleVn: 'Hoán vị góc bằng thuật toán Niklas',
      titleEn: 'Position corners with Niklas',
      algorithmName: 'Niklas algorithm',
      explanationVn: 'Dùng Niklas và xoay U để đưa các góc vàng về đúng vị trí.',
      explanationEn: 'Use Niklas and U turns to place all yellow corners correctly.',
      moves: ds,
      moveInstructions: taoHuongDanNuocDi(ds),
      cameraCue: 'front-right',
      isComplete: false,
    };
    /*
    const niklasAlg: Move[] = [
      { face: 'R', turn: '' },
      { face: 'U', turn: "'" },
      { face: 'L', turn: "'" },
      { face: 'U', turn: '' },
      { face: 'R', turn: "'" },
      { face: 'U', turn: "'" },
      { face: 'L', turn: '' },
      { face: 'U', turn: '' },
    ];

    return {
      stageId: 'POSITION_YELLOW_CORNERS',
      caseId: 'POSITION_CORNERS_NIKLAS',
      titleVn: 'Hoán vị góc bằng thuật toán Niklas',
      titleEn: 'Position corners with Niklas',
      algorithmName: 'Niklas algorithm',
      explanationVn: 'Thực hiện Niklas: R U\' L\' U R\' U\' L U để đưa các góc về đúng vị trí.',
      explanationEn: 'Perform Niklas: R U\' L\' U R\' U\' L U to position all corners.',
      moves: niklasAlg,
      moveInstructions: taoHuongDanNuocDi(niklasAlg),
      cameraCue: 'front-right',
      isComplete: false,
    };
    */
  }

  // ----------------------------------------------------------------------------
  // GIAI ĐOẠN 8: TWIST FINAL CORNERS (Xoay góc vàng hoàn thiện)
  // ----------------------------------------------------------------------------
  if (gd === 'TWIST_FINAL_CORNERS') {
    const cornerTwist: Move[] = [
      { face: 'R', turn: "'" },
      { face: 'D', turn: "'" },
      { face: 'R', turn: '' },
      { face: 'D', turn: '' },
    ];
    const cacLuaChonU: Move[][] = [
      [{ face: 'U', turn: '' }],
      [{ face: 'U', turn: '' }, { face: 'U', turn: '' }],
      [{ face: 'U', turn: "'" }],
    ];

    if (f[8] !== 'U') {
      let moves = cornerTwist;
      for (let soLan = 1; soLan <= 6; soLan += 1) {
        const ungVien = lapLaiNuoc(cornerTwist, soLan);
        if (applyMoves(tt, ungVien).facelets[8] === 'U') {
          moves = ungVien;
          break;
        }
      }
      return {
        stageId: 'TWIST_FINAL_CORNERS',
        caseId: 'TWIST_WORKING_CORNER',
        titleVn: 'Xoay hướng vàng cho góc làm việc',
        titleEn: 'Twist working corner',
        algorithmName: 'Corner twist',
        explanationVn: 'Lặp R\' D\' R D tại góc Trước-Phải đến khi màu vàng hướng lên trên.',
        explanationEn: 'Repeat R\' D\' R D at the front-right corner until yellow faces up.',
        warning: '⚠️ KHÔNG XOAY TOÀN BỘ KHỐI RUBIK! Giữ nguyên góc nhìn và chỉ xoay theo lệnh.',
        moves,
        moveInstructions: taoHuongDanNuocDi(moves),
        cameraCue: 'stage8-lock',
        isComplete: false,
      };
    } else {
      const conGocChuaXong = GOC_U_DS.some((g) => f[g.uIdx] !== 'U');
      if (conGocChuaXong) {
        const quayU = cacLuaChonU.find(
          (moves) => applyMoves(tt, moves).facelets[8] !== 'U',
        ) ?? cacLuaChonU[0];
        return {
          stageId: 'TWIST_FINAL_CORNERS',
          caseId: 'TWIST_NEXT_CORNER',
          titleVn: 'Đưa góc tiếp theo vào vị trí làm việc',
          titleEn: 'Bring next corner to slot',
          explanationVn: 'Góc này đã xong! Xoay U để đưa góc chưa xong tiếp theo vào vị trí Trước-Phải.',
          explanationEn: 'Corner done! Turn U to bring next unsolved corner into working slot.',
          warning: '⚠️ KHÔNG XOAY TOÀN BỘ KHỐI RUBIK! Chỉ xoay mặt trên để đổi góc.',
          moves: quayU,
          moveInstructions: taoHuongDanNuocDi(quayU),
          cameraCue: 'stage8-lock',
          isComplete: false,
        };
      } else {
        let uMoves: Move[] = [];
        for (const uTest of [[], [{ face: 'U', turn: '' }], [{ face: 'U', turn: '' }, { face: 'U', turn: '' }], [{ face: 'U', turn: "'" }]] as Move[][]) {
          if (isSolved(applyMoves(tt, uTest))) {
            uMoves = uTest;
            break;
          }
        }
        return {
          stageId: 'TWIST_FINAL_CORNERS',
          caseId: 'TWIST_FINAL_ALIGN',
          titleVn: 'Căn chỉnh hoàn tất khối Rubik',
          titleEn: 'Final alignment to solve',
          explanationVn: 'Xoay U lần cuối để căn chỉnh toàn bộ khối Rubik về trạng thái hoàn thành.',
          explanationEn: 'Final U turn to align solved cube.',
          moves: uMoves,
          moveInstructions: taoHuongDanNuocDi(uMoves),
          cameraCue: 'default',
          isComplete: false,
        };
      }
    }
  }

  // ----------------------------------------------------------------------------
  // ĐÃ HOÀN THÀNH (SOLVED)
  // ----------------------------------------------------------------------------
  return {
    stageId: 'SOLVED',
    caseId: 'SOLVED',
    titleVn: 'Khối Rubik đã được giải hoàn tất!',
    titleEn: 'Cube is fully solved!',
    explanationVn: 'Xin chúc mừng! Bạn đã hoàn thành việc giải khối Rubik 3x3 theo phương pháp Beginner.',
    explanationEn: 'Congratulations! You have completed the 3x3 Rubik cube using the Beginner method.',
    moves: [],
    moveInstructions: [],
    cameraCue: 'default',
    isComplete: true,
  };
}
