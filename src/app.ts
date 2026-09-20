import type { CubeState, Move } from './cube/types';
import { applyMove, applyMoves, createState, isSolved } from './cube/state';
import { inverseMove } from './cube/notation';
import { CubeView } from './scene/cube-view';
import { Controls } from './ui/controls';
import { ColorInput } from './ui/color-input';
import { SolutionPanel } from './ui/solution-panel';
import { CubeJsSolverAdapter } from './solver/cubejs-solver';

export class App {
  private trang_thai: CubeState;
  private cube_view: CubeView;
  private solver: CubeJsSolverAdapter;
  private controls: Controls;
  private color_input: ColorInput;
  private solution_panel: SolutionPanel;

  private loi_giai: Move[] = [];
  private buoc_hien_tai: number = 0;
  private dang_tu_chay: boolean = false;
  private thoi_gian_dung: boolean = false;

  constructor(khung_app: HTMLElement) {
    this.trang_thai = createState();
    this.solver = new CubeJsSolverAdapter();

    khung_app.innerHTML = `
      <header class="tieu-de-trang">
        <h1>Rubik Lab 3D — Kociemba Solver</h1>
        <p>Mô phỏng 3D Rubik 3x3 • Giải tối ưu bằng thuật toán Two-Phase Kociemba</p>
      </header>
      <main class="bo-cuc-chinh">
        <section class="vung-3d-wrapper">
          <div id="canvas-3d-container" class="canvas-3d-container"></div>
          <div class="chu-thich-xoay-chuot">
            🖱️ Chuột trái: Xoay góc nhìn • Chuột phải: Di chuyển • Con lăn: Phóng to/Thu nhỏ
          </div>
        </section>
        <aside class="vung-dieu-khien-wrapper" id="khung-dieu-khien"></aside>
      </main>
    `;

    const khung_3d = khung_app.querySelector<HTMLElement>('#canvas-3d-container')!;
    const khung_dk = khung_app.querySelector<HTMLElement>('#khung-dieu-khien')!;

    // Khoi tao 3D View
    this.cube_view = new CubeView(khung_3d);
    this.cube_view.capNhatTrangThai(this.trang_thai);

    // Khoi tao Bang Solution
    this.solution_panel = new SolutionPanel(khung_dk, {
      onSolve: () => this.xuLySolve(),
      onPlayToggle: () => this.xuLyPlayToggle(),
      onNext: () => this.xuLyStepNext(),
      onPrev: () => this.xuLyStepPrev(),
    });

    // Khoi tao Controls
    this.controls = new Controls(khung_dk, {
      onMove: (buoc) => this.thucHienMove(buoc),
      onScramble: (ds_buoc) => this.thucHienScramble(ds_buoc),
      onReset: () => this.thucHienReset(),
      onSpeedChange: (toc_do) => this.cube_view.datTocDo(toc_do),
    });

    // Khoi tao Color Input
    this.color_input = new ColorInput(khung_dk, {
      onApply: (trang_thai_moi) => this.apDungTrangThaiMoi(trang_thai_moi),
      layTrangThaiHienTai: () => this.trang_thai,
    });
  }

  // Thuc hien 1 move don le tu nguoi dung
  private async thucHienMove(buoc: Move): Promise<void> {
    if (this.cube_view.dangBan()) return;

    this.dungTuChay();
    this.trang_thai = applyMove(this.trang_thai, buoc);
    await this.cube_view.quayMat(buoc);
    this.cube_view.capNhatTrangThai(this.trang_thai);
    this.color_input.dongBoTuState(this.trang_thai);
  }

  // Thuc hien chuoi scramble
  private async thucHienScramble(ds_buoc: Move[]): Promise<void> {
    this.dungTuChay();
    this.controls.setDisabled(true);

    for (const buoc of ds_buoc) {
      this.trang_thai = applyMove(this.trang_thai, buoc);
      await this.cube_view.quayMat(buoc);
    }

    this.cube_view.capNhatTrangThai(this.trang_thai);
    this.color_input.dongBoTuState(this.trang_thai);
    this.controls.setDisabled(false);

    // Tu dong xoa loi giai cu neu co
    this.loi_giai = [];
    this.buoc_hien_tai = 0;
    this.solution_panel.setSolution([]);
  }

  // Reset cube ve solved
  private thucHienReset(): void {
    this.dungTuChay();
    this.trang_thai = createState();
    this.cube_view.capNhatTrangThai(this.trang_thai);
    this.color_input.dongBoTuState(this.trang_thai);
    this.loi_giai = [];
    this.buoc_hien_tai = 0;
    this.solution_panel.setSolution([]);
  }

  // Ap dung mau tu Color Editor
  private apDungTrangThaiMoi(trang_thai_moi: CubeState): void {
    this.dungTuChay();
    this.trang_thai = trang_thai_moi;
    this.cube_view.capNhatTrangThai(this.trang_thai);
    this.loi_giai = [];
    this.buoc_hien_tai = 0;
    this.solution_panel.setSolution([]);
  }

  // Tinh toan loi giai
  private async xuLySolve(): Promise<void> {
    this.dungTuChay();
    if (isSolved(this.trang_thai)) {
      this.solution_panel.setSolution([]);
      return;
    }

    try {
      this.solution_panel.setSolving(true);
      const ket_qua = await this.solver.solve(this.trang_thai);
      this.loi_giai = ket_qua;
      this.buoc_hien_tai = 0;
      this.solution_panel.setSolution(ket_qua);
    } catch (loi) {
      alert('Không thể giải: ' + (loi as Error).message);
    } finally {
      this.solution_panel.setSolving(false);
    }
  }

  // Bat / Tat che do tu dong chay loi giai
  private xuLyPlayToggle(): void {
    if (this.dang_tu_chay) {
      this.dungTuChay();
    } else {
      this.batDauTuChay();
    }
  }

  private async batDauTuChay(): Promise<void> {
    if (this.buoc_hien_tai >= this.loi_giai.length) {
      return;
    }

    this.dang_tu_chay = true;
    this.thoi_gian_dung = false;
    this.solution_panel.setPlaying(true);
    this.controls.setDisabled(true);

    while (this.dang_tu_chay && this.buoc_hien_tai < this.loi_giai.length) {
      const buoc = this.loi_giai[this.buoc_hien_tai];
      this.trang_thai = applyMove(this.trang_thai, buoc);
      await this.cube_view.quayMat(buoc);
      this.buoc_hien_tai += 1;
      this.solution_panel.setActiveStep(this.buoc_hien_tai);
      this.color_input.dongBoTuState(this.trang_thai);

      // Nghi ngan giua cac buoc
      await new Promise((r) => setTimeout(r, 60));
    }

    this.dungTuChay();
    this.cube_view.capNhatTrangThai(this.trang_thai);
  }

  private dungTuChay(): void {
    this.dang_tu_chay = false;
    this.solution_panel.setPlaying(false);
    this.controls.setDisabled(false);
  }

  // Tien 1 buoc trong loi giai
  private async xuLyStepNext(): Promise<void> {
    if (this.cube_view.dangBan() || this.buoc_hien_tai >= this.loi_giai.length) return;

    const buoc = this.loi_giai[this.buoc_hien_tai];
    this.trang_thai = applyMove(this.trang_thai, buoc);
    await this.cube_view.quayMat(buoc);
    this.buoc_hien_tai += 1;
    this.solution_panel.setActiveStep(this.buoc_hien_tai);
    this.cube_view.capNhatTrangThai(this.trang_thai);
    this.color_input.dongBoTuState(this.trang_thai);
  }

  // Lui 1 buoc trong loi giai (thuc hien buoc nghich dao)
  private async xuLyStepPrev(): Promise<void> {
    if (this.cube_view.dangBan() || this.buoc_hien_tai <= 0) return;

    this.buoc_hien_tai -= 1;
    const buoc_truoc = this.loi_giai[this.buoc_hien_tai];
    const buoc_nghich_dao = inverseMove(buoc_truoc);

    this.trang_thai = applyMove(this.trang_thai, buoc_nghich_dao);
    await this.cube_view.quayMat(buoc_nghich_dao);
    this.solution_panel.setActiveStep(this.buoc_hien_tai);
    this.cube_view.capNhatTrangThai(this.trang_thai);
    this.color_input.dongBoTuState(this.trang_thai);
  }
}
