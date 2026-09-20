import type { Move } from '../cube/types';
import { generateScramble } from '../cube/state';
import { parseNotation, formatMoves } from '../cube/notation';

export interface ControlsCallbacks {
  onMove: (buoc: Move) => void;
  onScramble: (ds_buoc: Move[]) => void;
  onReset: () => void;
  onSpeedChange: (toc_do_ms: number) => void;
}

export class Controls {
  private phan_tu: HTMLElement;
  private callbacks: ControlsCallbacks;
  private cac_nut_move: HTMLButtonElement[] = [];

  constructor(khung_chua: HTMLElement, callbacks: ControlsCallbacks) {
    this.callbacks = callbacks;
    this.phan_tu = document.createElement('div');
    this.phan_tu.className = 'bang-dieu-khien';
    khung_chua.appendChild(this.phan_tu);

    this.render();
    this.ganPhimTat();
  }

  private render(): void {
    this.phan_tu.innerHTML = `
      <div class="nhom-chuc-nang">
        <h3>Thao tác xoay Rubik (18 moves)</h3>
        <div class="luoi-nut-xoay">
          ${this.taoNutXoay('U')}
          ${this.taoNutXoay('D')}
          ${this.taoNutXoay('L')}
          ${this.taoNutXoay('R')}
          ${this.taoNutXoay('F')}
          ${this.taoNutXoay('B')}
        </div>
      </div>

      <div class="nhom-chuc-nang">
        <h3>Scramble & Trạng thái</h3>
        <div class="dong-scramble">
          <input type="text" id="o-nhap-scramble" placeholder="Nhập công thức (VD: R U R' U' F2 L)..." />
          <button id="nut-chay-scramble" class="nut nut-chinh">Chạy Scramble</button>
          <button id="nut-tao-scramble" class="nut nut-phu">Tạo ngẫu nhiên</button>
          <button id="nut-reset-cube" class="nut nut-nguy-hiem">Reset về Solved</button>
        </div>
      </div>

      <div class="nhom-chuc-nang">
        <h3>Tốc độ quay 3D</h3>
        <div class="dong-toc-do">
          <button class="nut-toc-do" data-speed="400">Chậm (400ms)</button>
          <button class="nut-toc-do active" data-speed="200">Chuẩn (200ms)</button>
          <button class="nut-toc-do" data-speed="80">Nhanh (80ms)</button>
          <button class="nut-toc-do" data-speed="0">Tức thì (0ms)</button>
        </div>
      </div>
    `;

    // Gan su kien cho cac nut xoay
    const cac_nut = this.phan_tu.querySelectorAll<HTMLButtonElement>('.nut-move');
    cac_nut.forEach((nut) => {
      this.cac_nut_move.push(nut);
      nut.addEventListener('click', () => {
        const ky_hieu = nut.dataset.move;
        if (!ky_hieu) return;
        try {
          const [buoc] = parseNotation(ky_hieu);
          this.callbacks.onMove(buoc);
        } catch (loi) {
          console.error('Lỗi khi thực hiện move:', loi);
        }
      });
    });

    // Gan su kien Scramble
    const o_nhap = this.phan_tu.querySelector<HTMLInputElement>('#o-nhap-scramble')!;
    const nut_chay_scramble = this.phan_tu.querySelector<HTMLButtonElement>('#nut-chay-scramble')!;
    const nut_tao_scramble = this.phan_tu.querySelector<HTMLButtonElement>('#nut-tao-scramble')!;
    const nut_reset = this.phan_tu.querySelector<HTMLButtonElement>('#nut-reset-cube')!;

    nut_chay_scramble.addEventListener('click', () => {
      const noi_dung = o_nhap.value.trim();
      if (!noi_dung) return;
      try {
        const ds_buoc = parseNotation(noi_dung);
        this.callbacks.onScramble(ds_buoc);
      } catch (loi) {
        alert('Công thức scramble không hợp lệ: ' + (loi as Error).message);
      }
    });

    nut_tao_scramble.addEventListener('click', () => {
      const ds_buoc = generateScramble(20);
      o_nhap.value = formatMoves(ds_buoc);
      this.callbacks.onScramble(ds_buoc);
    });

    nut_reset.addEventListener('click', () => {
      o_nhap.value = '';
      this.callbacks.onReset();
    });

    // Gan su kien toc do
    const cac_nut_td = this.phan_tu.querySelectorAll<HTMLButtonElement>('.nut-toc-do');
    cac_nut_td.forEach((nut) => {
      nut.addEventListener('click', () => {
        cac_nut_td.forEach((n) => n.classList.remove('active'));
        nut.classList.add('active');
        const toc_do = parseInt(nut.dataset.speed || '200', 10);
        this.callbacks.onSpeedChange(toc_do);
      });
    });
  }

  private taoNutXoay(mat: string): string {
    return `
      <div class="cum-nut-mat">
        <button class="nut-move" data-move="${mat}">${mat}</button>
        <button class="nut-move" data-move="${mat}'">${mat}'</button>
        <button class="nut-move" data-move="${mat}2">${mat}2</button>
      </div>
    `;
  }

  private ganPhimTat(): void {
    window.addEventListener('keydown', (su_kien) => {
      // Khong kich hoat khi dang go trong input text
      const target = su_kien.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const phim = su_kien.key.toUpperCase();
      const danh_sach_mat = ['U', 'D', 'L', 'R', 'F', 'B'];
      if (!danh_sach_mat.includes(phim)) return;

      su_kien.preventDefault();
      let ky_hieu = phim;
      if (su_kien.shiftKey) ky_hieu += "'";

      try {
        const [buoc] = parseNotation(ky_hieu);
        this.callbacks.onMove(buoc);
      } catch {
        // Bo qua loi
      }
    });
  }

  public setDisabled(khoa: boolean): void {
    this.cac_nut_move.forEach((nut) => (nut.disabled = khoa));
  }
}
