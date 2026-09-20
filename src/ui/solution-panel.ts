import type { Move } from '../cube/types';
import { formatMove } from '../cube/notation';

export interface SolutionPanelCallbacks {
  onSolve: () => Promise<void>;
  onPlayToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export class SolutionPanel {
  private phan_tu: HTMLElement;
  private callbacks: SolutionPanelCallbacks;
  private danh_sach_buoc: Move[] = [];
  private buoc_hien_tai: number = 0;
  private dang_chay: boolean = false;
  private dang_tinh_toan: boolean = false;

  constructor(khung_chua: HTMLElement, callbacks: SolutionPanelCallbacks) {
    this.callbacks = callbacks;
    this.phan_tu = document.createElement('div');
    this.phan_tu.className = 'bang-loi-giai';
    khung_chua.appendChild(this.phan_tu);

    this.render();
  }

  public setSolution(ds_buoc: Move[]): void {
    this.danh_sach_buoc = ds_buoc;
    this.buoc_hien_tai = 0;
    this.dang_chay = false;
    this.renderDanhSachBuoc();
    this.capNhatNutBam();
  }

  public setActiveStep(vi_tri: number): void {
    this.buoc_hien_tai = vi_tri;
    this.capNhatHighlight();
    this.capNhatNutBam();
  }

  public setPlaying(dang_phat: boolean): void {
    this.dang_chay = dang_phat;
    this.capNhatNutBam();
  }

  public setSolving(dang_tinh: boolean): void {
    this.dang_tinh_toan = dang_tinh;
    const nut_giai = this.phan_tu.querySelector<HTMLButtonElement>('#nut-giai-rubik');
    if (nut_giai) {
      nut_giai.disabled = dang_tinh;
      nut_giai.textContent = dang_tinh ? 'Đang tính toán...' : '⚡ Giải Rubik (Solve)';
    }
  }

  private render(): void {
    this.phan_tu.innerHTML = `
      <div class="nhom-chuc-nang">
        <div class="tieu-de-hang">
          <h3>Lời giải tự động (Solver Playback)</h3>
          <button id="nut-giai-rubik" class="nut nut-dac-biet">⚡ Giải Rubik (Solve)</button>
        </div>

        <div class="hop-danh-sach-buoc">
          <div id="vung-the-buoc" class="vung-the-buoc">
            <span class="chu-thich-trong">Chưa có lời giải. Hãy xoay/scramble rồi nhấn "Giải Rubik".</span>
          </div>
        </div>

        <div class="dong-dieu-khien-playback">
          <div class="cum-nut-playback">
            <button id="nut-playback-prev" class="nut nut-phu nut-tron" title="Lùi lại 1 bước" disabled>⏮</button>
            <button id="nut-playback-play" class="nut nut-chinh nut-tron" title="Phát / Dừng" disabled>▶</button>
            <button id="nut-playback-next" class="nut nut-phu nut-tron" title="Tiến tới 1 bước" disabled>⏭</button>
          </div>
          <span id="chi-so-buoc" class="nhan-chi-so">Bước: 0 / 0</span>
        </div>
      </div>
    `;

    const nut_giai = this.phan_tu.querySelector<HTMLButtonElement>('#nut-giai-rubik')!;
    const nut_prev = this.phan_tu.querySelector<HTMLButtonElement>('#nut-playback-prev')!;
    const nut_play = this.phan_tu.querySelector<HTMLButtonElement>('#nut-playback-play')!;
    const nut_next = this.phan_tu.querySelector<HTMLButtonElement>('#nut-playback-next')!;

    nut_giai.addEventListener('click', () => {
      this.callbacks.onSolve();
    });

    nut_play.addEventListener('click', () => {
      this.callbacks.onPlayToggle();
    });

    nut_next.addEventListener('click', () => {
      this.callbacks.onNext();
    });

    nut_prev.addEventListener('click', () => {
      this.callbacks.onPrev();
    });
  }

  private renderDanhSachBuoc(): void {
    const vung = this.phan_tu.querySelector('#vung-the-buoc')!;
    if (this.danh_sach_buoc.length === 0) {
      vung.innerHTML = '<span class="chu-thich-trong">Cube đã ở trạng thái Solved! Không cần giải.</span>';
      return;
    }

    vung.innerHTML = this.danh_sach_buoc
      .map((buoc, index) => {
        const xau_buoc = formatMove(buoc);
        return `<span class="the-buoc" data-step="${index}">${xau_buoc}</span>`;
      })
      .join('');

    this.capNhatHighlight();
  }

  private capNhatHighlight(): void {
    const the_buoc = this.phan_tu.querySelectorAll<HTMLElement>('.the-buoc');
    the_buoc.forEach((the, index) => {
      if (index === this.buoc_hien_tai) {
        the.classList.add('active');
        the.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else if (index < this.buoc_hien_tai) {
        the.classList.remove('active');
        the.classList.add('da-qua');
      } else {
        the.classList.remove('active', 'da-qua');
      }
    });

    const nhan_chi_so = this.phan_tu.querySelector('#chi-so-buoc')!;
    nhan_chi_so.textContent = `Bước: ${this.buoc_hien_tai} / ${this.danh_sach_buoc.length}`;
  }

  private capNhatNutBam(): void {
    const nut_prev = this.phan_tu.querySelector<HTMLButtonElement>('#nut-playback-prev')!;
    const nut_play = this.phan_tu.querySelector<HTMLButtonElement>('#nut-playback-play')!;
    const nut_next = this.phan_tu.querySelector<HTMLButtonElement>('#nut-playback-next')!;

    const co_buoc = this.danh_sach_buoc.length > 0;
    const chua_het = this.buoc_hien_tai < this.danh_sach_buoc.length;
    const co_the_lui = this.buoc_hien_tai > 0;

    nut_prev.disabled = !co_buoc || !co_the_lui || this.dang_chay;
    nut_next.disabled = !co_buoc || !chua_het || this.dang_chay;
    nut_play.disabled = !co_buoc || (!chua_het && !this.dang_chay);

    nut_play.textContent = this.dang_chay ? '⏸' : '▶';
  }
}
