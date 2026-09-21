import type { CubeState, Face } from '../cube/types';
import { createState } from '../cube/state';
import { validateCubeState } from '../cube/validator';

export interface ColorInputCallbacks {
  onApply: (trang_thai: CubeState) => void;
  layTrangThaiHienTai: () => CubeState;
}

const MAU_HEX: Record<Face, string> = {
  U: '#ffd500',
  R: '#c41e3a',
  F: '#009e60',
  D: '#ffffff',
  L: '#ff5800',
  B: '#0051ba',
};

const TEN_MAT: Record<Face, string> = {
  U: 'Vàng (U)',
  R: 'Đỏ (R)',
  F: 'Xanh lá (F)',
  D: 'Trắng (D)',
  L: 'Cam (L)',
  B: 'Xanh dương (B)',
};

const THU_TU_MAT: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export class ColorInput {
  private phan_tu: HTMLElement;
  private callbacks: ColorInputCallbacks;
  private facelets_tam: string[];
  private mau_dang_chon: Face = 'U';
  private hop_thong_bao: HTMLElement | null = null;

  constructor(khung_chua: HTMLElement, callbacks: ColorInputCallbacks) {
    this.callbacks = callbacks;
    this.facelets_tam = [...callbacks.layTrangThaiHienTai().facelets];

    this.phan_tu = document.createElement('div');
    this.phan_tu.className = 'bang-chinh-mau';
    khung_chua.appendChild(this.phan_tu);

    this.render();
  }

  public dongBoTuState(trang_thai: CubeState): void {
    this.facelets_tam = [...trang_thai.facelets];
    this.capNhatLuoiO();
    this.xoaLoi();
  }

  private render(): void {
    this.phan_tu.innerHTML = `
      <div class="nhom-chuc-nang">
        <div class="tieu-de-hang">
          <h3>Chỉnh màu 54 ô (Color Editor)</h3>
          <button id="nut-dong-bo-mau" class="nut nut-phu nut-nho">Lấy màu từ 3D</button>
        </div>

        <div class="bang-chon-mau-ve">
          <span class="nhan">Chọn màu để tô:</span>
          <div class="danh-sach-mau">
            ${THU_TU_MAT.map(
              (mat) => `
              <button class="nut-chon-mau ${mat === this.mau_dang_chon ? 'active' : ''}" data-color="${mat}" style="background-color: ${MAU_HEX[mat]}">
                ${mat}
              </button>
            `,
            ).join('')}
          </div>
          <span id="ten-mau-hien-tai" class="chu-thich-mau">${TEN_MAT[this.mau_dang_chon]}</span>
        </div>

        <div class="so-do-trai-rubik">
          <div class="hang-net hang-tren">
            <div class="o-trong"></div>
            ${this.taoMatHtml('U')}
            <div class="o-trong"></div>
            <div class="o-trong"></div>
          </div>
          <div class="hang-net hang-giua">
            ${this.taoMatHtml('L')}
            ${this.taoMatHtml('F')}
            ${this.taoMatHtml('R')}
            ${this.taoMatHtml('B')}
          </div>
          <div class="hang-net hang-duoi">
            <div class="o-trong"></div>
            ${this.taoMatHtml('D')}
            <div class="o-trong"></div>
            <div class="o-trong"></div>
          </div>
        </div>

        <div id="hop-thong-bao-loi" class="hop-loi an"></div>

        <div class="hang-hanh-dong-mau">
          <button id="nut-kiem-tra-ap-dung" class="nut nut-chinh">Kiểm tra & Áp dụng</button>
          <button id="nut-ve-mac-dinh" class="nut nut-phu">Đặt về Solved</button>
        </div>
      </div>
    `;

    this.hop_thong_bao = this.phan_tu.querySelector('#hop-thong-bao-loi');

    // Gan su kien chon mau to
    const cac_nut_mau = this.phan_tu.querySelectorAll<HTMLButtonElement>('.nut-chon-mau');
    const chu_thich = this.phan_tu.querySelector<HTMLElement>('#ten-mau-hien-tai')!;
    cac_nut_mau.forEach((nut) => {
      nut.addEventListener('click', () => {
        cac_nut_mau.forEach((n) => n.classList.remove('active'));
        nut.classList.add('active');
        this.mau_dang_chon = nut.dataset.color as Face;
        chu_thich.textContent = TEN_MAT[this.mau_dang_chon];
      });
    });

    // Gan su kien to mau vao tung o
    this.ganSuKienToO();

    // Gan nut kiem tra & ap dung
    const nut_ap_dung = this.phan_tu.querySelector<HTMLButtonElement>('#nut-kiem-tra-ap-dung')!;
    nut_ap_dung.addEventListener('click', () => {
      const xau = this.facelets_tam.join('');
      const trang_thai = createState(xau);
      const ket_qua = validateCubeState(trang_thai);

      if (!ket_qua.valid) {
        this.hienThiLoi(ket_qua.errors);
      } else {
        this.xoaLoi();
        this.callbacks.onApply(trang_thai);
      }
    });

    // Gan nut dong bo
    const nut_dong_bo = this.phan_tu.querySelector<HTMLButtonElement>('#nut-dong-bo-mau')!;
    nut_dong_bo.addEventListener('click', () => {
      this.dongBoTuState(this.callbacks.layTrangThaiHienTai());
    });

    // Nut ve mac dinh
    const nut_ve_mac_dinh = this.phan_tu.querySelector<HTMLButtonElement>('#nut-ve-mac-dinh')!;
    nut_ve_mac_dinh.addEventListener('click', () => {
      this.dongBoTuState(createState());
    });
  }

  private taoMatHtml(mat: Face): string {
    const bat_dau = THU_TU_MAT.indexOf(mat) * 9;
    let html_o = '';
    for (let i = 0; i < 9; i += 1) {
      const cs = bat_dau + i;
      const mau = this.facelets_tam[cs] as Face;
      const la_tam = i === 4;
      html_o += `
        <button class="o-sticker ${la_tam ? 'tam' : ''}" data-index="${cs}" style="background-color: ${MAU_HEX[mau]};" title="${mat}[${i}]">
          ${la_tam ? mat : ''}
        </button>
      `;
    }

    return `
      <div class="khung-mat-net" data-face="${mat}">
        <span class="ten-mat-net">${mat}</span>
        <div class="luoi-3x3">
          ${html_o}
        </div>
      </div>
    `;
  }

  private ganSuKienToO(): void {
    const cac_o = this.phan_tu.querySelectorAll<HTMLButtonElement>('.o-sticker');
    cac_o.forEach((o) => {
      o.addEventListener('click', () => {
        const cs = parseInt(o.dataset.index || '0', 10);
        // Khong doi mau center de giu nguyen mapping goc toa do
        if (cs % 9 === 4) return;

        this.facelets_tam[cs] = this.mau_dang_chon;
        o.style.backgroundColor = MAU_HEX[this.mau_dang_chon];
      });
    });
  }

  private capNhatLuoiO(): void {
    const cac_o = this.phan_tu.querySelectorAll<HTMLButtonElement>('.o-sticker');
    cac_o.forEach((o) => {
      const cs = parseInt(o.dataset.index || '0', 10);
      const mau = this.facelets_tam[cs] as Face;
      o.style.backgroundColor = MAU_HEX[mau] || '#333';
    });
  }

  private hienThiLoi(danh_sach_loi: string[]): void {
    if (!this.hop_thong_bao) return;
    this.hop_thong_bao.classList.remove('an');
    this.hop_thong_bao.innerHTML = `
      <strong>Trạng thái Rubik không hợp lệ:</strong>
      <ul>
        ${danh_sach_loi.map((loi) => `<li>${loi}</li>`).join('')}
      </ul>
    `;
  }

  private xoaLoi(): void {
    if (!this.hop_thong_bao) return;
    this.hop_thong_bao.classList.add('an');
    this.hop_thong_bao.innerHTML = '';
  }
}
