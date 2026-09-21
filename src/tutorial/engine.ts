import type { CubeState, Move } from '../cube/types';
import { applyMove } from '../cube/state';
import type {
  BeginnerSpeedMode,
  CameraPreset,
  TutorialStepDetail,
} from './types';
import { BEGINNER_SPEED_PRESETS } from './types';
import { taoBuocHuongDan } from './detector';

export interface TutorialEngineListener {
  onStepChanged: (buoc: TutorialStepDetail) => void;
  onMoveProgress: (chiSoNuoc: number, tongSoNuoc: number, nuocHienTai?: Move) => void;
  onSpeedChanged: (tocDo: number) => void;
  onCameraCue: (cue: CameraPreset) => void;
  onStatusMessage: (msgVn: string, msgEn: string) => void;
}

/**
 * Lớp điều phối luồng học Beginner Guided Mode (Orchestration Layer).
 * Tự động đồng bộ với CubeState và hàng đợi animation hiện có.
 */
export class TutorialEngine {
  private ttHienTai: CubeState;
  private buocHienTai: TutorialStepDetail;
  private chiSoNuocHienTai = 0;
  private dangPhat = false;
  private tapThuocCongThuc = new Set<string>();
  private tocDoCheDo: BeginnerSpeedMode = 'normal';
  private cacLangNghe: TutorialEngineListener[] = [];
  private khoaGocNhinGiaiDoan8 = false;

  constructor(ttBanDau: CubeState) {
    this.ttHienTai = ttBanDau;
    this.buocHienTai = taoBuocHuongDan(ttBanDau);
    this.khoaGocNhinGiaiDoan8 = this.buocHienTai.stageId === 'TWIST_FINAL_CORNERS';
  }

  public dangKyLangNghe(ln: TutorialEngineListener): void {
    this.cacLangNghe.push(ln);
    // Bắn sự kiện khởi tạo ngay lập tức
    ln.onStepChanged(this.buocHienTai);
    ln.onSpeedChanged(this.layGiaTriTocDo());
    ln.onCameraCue(this.buocHienTai.cameraCue);
    this.thongBaoTienDoNuoc();
  }

  public layBuocHienTai(): TutorialStepDetail {
    return this.buocHienTai;
  }

  public layChiSoNuoc(): number {
    return this.chiSoNuocHienTai;
  }

  public layGiaTriTocDo(): number {
    return BEGINNER_SPEED_PRESETS[this.tocDoCheDo];
  }

  public layCheDoTocDo(): BeginnerSpeedMode {
    return this.tocDoCheDo;
  }

  public datCheDoTocDo(cd: BeginnerSpeedMode): void {
    this.tocDoCheDo = cd;
    const tocDo = this.layGiaTriTocDo();
    for (const ln of this.cacLangNghe) {
      ln.onSpeedChanged(tocDo);
    }
  }

  public daHocCongThuc(tenCongThuc?: string): boolean {
    if (!tenCongThuc) return true;
    return this.tapThuocCongThuc.has(tenCongThuc);
  }

  public danhDauDaHoc(tenCongThuc?: string): void {
    if (tenCongThuc) {
      this.tapThuocCongThuc.add(tenCongThuc);
    }
  }

  /**
   * Cập nhật trạng thái logic cube mới từ bên ngoài hoặc sau khi xoay.
   */
  public capNhatTrangThaiCube(ttMoi: CubeState): void {
    const laDongBoTrangThaiHienTai = ttMoi.facelets === this.ttHienTai.facelets;
    const giuGiaiDoan8 = this.khoaGocNhinGiaiDoan8
      && laDongBoTrangThaiHienTai;
    this.ttHienTai = ttMoi;
    this.buocHienTai = taoBuocHuongDan(ttMoi, giuGiaiDoan8);
    this.chiSoNuocHienTai = 0;

    this.khoaGocNhinGiaiDoan8 = this.buocHienTai.stageId === 'TWIST_FINAL_CORNERS';

    for (const ln of this.cacLangNghe) {
      ln.onStepChanged(this.buocHienTai);
      ln.onCameraCue(this.buocHienTai.cameraCue);
    }
    this.thongBaoTienDoNuoc();
  }

  /**
   * Lấy nước đi tiếp theo cần thực hiện trong bước hiện tại.
   */
  public layNuocDiTiepTheo(): Move | undefined {
    const ds = this.buocHienTai.moves;
    if (this.chiSoNuocHienTai >= ds.length) return undefined;
    return ds[this.chiSoNuocHienTai];
  }

  /**
   * Ghi nhận đã chạy xong 1 nước đi đơn lẻ trong bước hiện tại.
   */
  public ghiNhanDaXoayXongMotNuoc(nuocDaChay: Move): void {
    this.ttHienTai = applyMove(this.ttHienTai, nuocDaChay);
    this.chiSoNuocHienTai += 1;

    // Nếu đã hoàn thành toàn bộ nước đi của bước này
    if (this.chiSoNuocHienTai >= this.buocHienTai.moves.length) {
      if (this.buocHienTai.algorithmName) {
        this.danhDauDaHoc(this.buocHienTai.algorithmName);
      }
      // Tính toán bước tiếp theo từ trạng thái mới
      this.capNhatTrangThaiCube(this.ttHienTai);
    } else {
      this.thongBaoTienDoNuoc();
    }
  }

  /**
   * Lặp lại nước đi vừa qua (Repeat Move).
   */
  public lapLaiNuocDi(): void {
    if (this.chiSoNuocHienTai > 0) {
      this.chiSoNuocHienTai -= 1;
      this.thongBaoTienDoNuoc();
    }
  }

  /**
   * Lặp lại toàn bộ thuật toán của bước hiện tại (Repeat Algorithm).
   */
  public lapLaiCongThuc(): void {
    this.chiSoNuocHienTai = 0;
    this.thongBaoTienDoNuoc();
  }

  public laKhoaGocNhin(): boolean {
    return this.khoaGocNhinGiaiDoan8;
  }

  private thongBaoTienDoNuoc(): void {
    const tong = this.buocHienTai.moves.length;
    const nuocHienTai = this.layNuocDiTiepTheo();
    for (const ln of this.cacLangNghe) {
      ln.onMoveProgress(this.chiSoNuocHienTai, tong, nuocHienTai);
    }
  }
}
