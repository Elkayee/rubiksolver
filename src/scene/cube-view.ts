import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CubeState, Face, Move } from '../cube/types';

// Bang mau chuan WCA cho 6 mat Rubik
export const BANG_MAU: Record<Face, number> = {
  U: 0xffffff, // Trang
  R: 0xc41e3a, // Do
  F: 0x009e60, // Xanh la
  D: 0xffd500, // Vang
  L: 0xff5800, // Cam
  B: 0x0051ba, // Xanh duong
};

const MAU_NHUA_TRONG = 0x181818; // Mau den nhua ben trong khoi

// Anh xa vi tri 3D (x, y, z) va phap tuyen mat sang chi so facelet (0..53)
const CHISO_MAT: Record<Face, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

function layChiSoFacelet(x: number, y: number, z: number, huong_mat: Face): number {
  let hang = 0;
  let cot = 0;
  if (huong_mat === 'U') {
    hang = z + 1;
    cot = x + 1;
  } else if (huong_mat === 'R') {
    hang = 1 - y;
    cot = 1 - z;
  } else if (huong_mat === 'F') {
    hang = 1 - y;
    cot = x + 1;
  } else if (huong_mat === 'D') {
    hang = 1 - z;
    cot = x + 1;
  } else if (huong_mat === 'L') {
    hang = 1 - y;
    cot = z + 1;
  } else if (huong_mat === 'B') {
    hang = 1 - y;
    cot = 1 - x;
  }
  return CHISO_MAT[huong_mat] * 9 + hang * 3 + cot;
}

export class CubeView {
  private khung_chua: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private nhom_cube: THREE.Group;
  private cac_khoi: THREE.Mesh[] = [];
  private dang_quay: boolean = false;
  private hang_doi_quay: Array<{ buoc: Move; xong: () => void }> = [];
  private toc_do: number = 250; // Thoi gian quay 1 buoc (ms)

  constructor(khung_chua: HTMLElement) {
    this.khung_chua = khung_chua;

    // Khoi tao scene Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f141c);

    // Khoi tao camera
    const rong = khung_chua.clientWidth || 600;
    const cao = khung_chua.clientHeight || 500;
    this.camera = new THREE.PerspectiveCamera(45, rong / cao, 0.1, 100);
    this.camera.position.set(4.5, 4, 6);

    // Khoi tao renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(rong, cao);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    khung_chua.appendChild(this.renderer.domElement);

    // Khoi tao dieu khien camera
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;

    // Anh sang
    const anh_sang_mt = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(anh_sang_mt);

    const den_chieu = new THREE.DirectionalLight(0xffffff, 0.9);
    den_chieu.position.set(10, 15, 10);
    this.scene.add(den_chieu);

    const den_phu = new THREE.DirectionalLight(0xffffff, 0.4);
    den_phu.position.set(-10, -10, -10);
    this.scene.add(den_phu);

    // Tao nhom chua 27 vien cubie
    this.nhom_cube = new THREE.Group();
    this.scene.add(this.nhom_cube);

    this.khoiTaoCacVien();

    // Lang nghe su kien co gian man hinh
    window.addEventListener('resize', this.onResize);

    // Vong lap render
    this.animate();
  }

  private khoiTaoCacVien(): void {
    const kich_thuoc = 0.94;
    const hinh_hoc = new THREE.BoxGeometry(kich_thuoc, kich_thuoc, kich_thuoc);

    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          // 6 mat: +X (R), -X (L), +Y (U), -Y (D), +Z (F), -Z (B)
          const vat_lieu = [
            new THREE.MeshStandardMaterial({ color: MAU_NHUA_TRONG, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: MAU_NHUA_TRONG, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: MAU_NHUA_TRONG, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: MAU_NHUA_TRONG, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: MAU_NHUA_TRONG, roughness: 0.2 }),
            new THREE.MeshStandardMaterial({ color: MAU_NHUA_TRONG, roughness: 0.2 }),
          ];

          const vien_mesh = new THREE.Mesh(hinh_hoc, vat_lieu);
          vien_mesh.position.set(x, y, z);
          vien_mesh.userData = { gocX: x, gocY: y, gocZ: z };

          this.nhom_cube.add(vien_mesh);
          this.cac_khoi.push(vien_mesh);
        }
      }
    }
  }

  // Cap nhat mau cac sticker tu trang thai CubeState logic
  public capNhatTrangThai(trang_thai: CubeState): void {
    const xau_facelets = trang_thai.facelets;

    for (const vien of this.cac_khoi) {
      const x = Math.round(vien.position.x);
      const y = Math.round(vien.position.y);
      const z = Math.round(vien.position.z);

      const ds_vat_lieu = vien.material as THREE.MeshStandardMaterial[];

      // Mat R (+X): x = 1
      if (x === 1) {
        const cs = layChiSoFacelet(x, y, z, 'R');
        const mat_mau = xau_facelets[cs] as Face;
        ds_vat_lieu[0].color.setHex(BANG_MAU[mat_mau] ?? MAU_NHUA_TRONG);
      } else {
        ds_vat_lieu[0].color.setHex(MAU_NHUA_TRONG);
      }

      // Mat L (-X): x = -1
      if (x === -1) {
        const cs = layChiSoFacelet(x, y, z, 'L');
        const mat_mau = xau_facelets[cs] as Face;
        ds_vat_lieu[1].color.setHex(BANG_MAU[mat_mau] ?? MAU_NHUA_TRONG);
      } else {
        ds_vat_lieu[1].color.setHex(MAU_NHUA_TRONG);
      }

      // Mat U (+Y): y = 1
      if (y === 1) {
        const cs = layChiSoFacelet(x, y, z, 'U');
        const mat_mau = xau_facelets[cs] as Face;
        ds_vat_lieu[2].color.setHex(BANG_MAU[mat_mau] ?? MAU_NHUA_TRONG);
      } else {
        ds_vat_lieu[2].color.setHex(MAU_NHUA_TRONG);
      }

      // Mat D (-Y): y = -1
      if (y === -1) {
        const cs = layChiSoFacelet(x, y, z, 'D');
        const mat_mau = xau_facelets[cs] as Face;
        ds_vat_lieu[3].color.setHex(BANG_MAU[mat_mau] ?? MAU_NHUA_TRONG);
      } else {
        ds_vat_lieu[3].color.setHex(MAU_NHUA_TRONG);
      }

      // Mat F (+Z): z = 1
      if (z === 1) {
        const cs = layChiSoFacelet(x, y, z, 'F');
        const mat_mau = xau_facelets[cs] as Face;
        ds_vat_lieu[4].color.setHex(BANG_MAU[mat_mau] ?? MAU_NHUA_TRONG);
      } else {
        ds_vat_lieu[4].color.setHex(MAU_NHUA_TRONG);
      }

      // Mat B (-Z): z = -1
      if (z === -1) {
        const cs = layChiSoFacelet(x, y, z, 'B');
        const mat_mau = xau_facelets[cs] as Face;
        ds_vat_lieu[5].color.setHex(BANG_MAU[mat_mau] ?? MAU_NHUA_TRONG);
      } else {
        ds_vat_lieu[5].color.setHex(MAU_NHUA_TRONG);
      }
    }
  }

  // Thuc hien animation quay 1 mat Rubik
  public quayMat(buoc: Move, onXong?: () => void): Promise<void> {
    return new Promise((resolve) => {
      const callback = () => {
        if (onXong) onXong();
        resolve();
      };

      if (this.toc_do <= 0) {
        // Che do tuc thi (instant), khong can hieu ung animation
        callback();
        return;
      }

      this.hang_doi_quay.push({ buoc, xong: callback });
      if (!this.dang_quay) {
        this.xuLyHangDoi();
      }
    });
  }

  private xuLyHangDoi(): void {
    if (this.hang_doi_quay.length === 0) {
      this.dang_quay = false;
      return;
    }

    this.dang_quay = true;
    const { buoc, xong } = this.hang_doi_quay.shift()!;

    // Chon truc va toa do de loc cac vien thuoc layer can quay
    const mat = buoc.face;
    let truc = new THREE.Vector3(0, 1, 0);
    let he_so_chieu = -1; // mac dinh kim dong ho cho goc quay

    const cac_vien_layer: THREE.Mesh[] = [];
    const nguong = 0.4;

    if (mat === 'U') {
      truc = new THREE.Vector3(0, 1, 0);
      he_so_chieu = -1;
      this.cac_khoi.forEach((v) => { if (v.position.y > nguong) cac_vien_layer.push(v); });
    } else if (mat === 'D') {
      truc = new THREE.Vector3(0, -1, 0);
      he_so_chieu = -1;
      this.cac_khoi.forEach((v) => { if (v.position.y < -nguong) cac_vien_layer.push(v); });
    } else if (mat === 'R') {
      truc = new THREE.Vector3(1, 0, 0);
      he_so_chieu = -1;
      this.cac_khoi.forEach((v) => { if (v.position.x > nguong) cac_vien_layer.push(v); });
    } else if (mat === 'L') {
      truc = new THREE.Vector3(-1, 0, 0);
      he_so_chieu = -1;
      this.cac_khoi.forEach((v) => { if (v.position.x < -nguong) cac_vien_layer.push(v); });
    } else if (mat === 'F') {
      truc = new THREE.Vector3(0, 0, 1);
      he_so_chieu = -1;
      this.cac_khoi.forEach((v) => { if (v.position.z > nguong) cac_vien_layer.push(v); });
    } else if (mat === 'B') {
      truc = new THREE.Vector3(0, 0, -1);
      he_so_chieu = -1;
      this.cac_khoi.forEach((v) => { if (v.position.z < -nguong) cac_vien_layer.push(v); });
    }

    // Tinh goc quay theo chieu Turn ('', "'", '2')
    let so_vong = 1;
    if (buoc.turn === "'") so_vong = -1;
    else if (buoc.turn === '2') so_vong = 2;

    const tong_goc = he_so_chieu * so_vong * (Math.PI / 2);

    // Tao pivot xoay
    const pivot = new THREE.Group();
    this.scene.add(pivot);

    cac_vien_layer.forEach((vien) => {
      pivot.attach(vien);
    });

    const thoi_gian_dau = performance.now();
    const thoi_luong = this.toc_do;

    const animateRotation = (thoi_gian_hien_tai: number) => {
      const tien_do = Math.min((thoi_gian_hien_tai - thoi_gian_dau) / thoi_luong, 1);
      // Ham noi suy euler easeInOutCubic
      const ty_le_muot = tien_do < 0.5 ? 4 * tien_do * tien_do * tien_do : 1 - Math.pow(-2 * tien_do + 2, 3) / 2;

      pivot.setRotationFromAxisAngle(truc, tong_goc * ty_le_muot);

      if (tien_do < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        // Hoan tat quay: tra cac vien ve nhom_cube va lam tron toa do
        pivot.setRotationFromAxisAngle(truc, tong_goc);
        pivot.updateMatrixWorld(true);

        cac_vien_layer.forEach((vien) => {
          this.nhom_cube.attach(vien);
          vien.position.set(
            Math.round(vien.position.x),
            Math.round(vien.position.y),
            Math.round(vien.position.z),
          );
        });

        this.scene.remove(pivot);
        xong();
        this.xuLyHangDoi();
      }
    };

    requestAnimationFrame(animateRotation);
  }

  public datTocDo(ms: number): void {
    this.toc_do = ms;
  }

  public dangBan(): boolean {
    return this.dang_quay || this.hang_doi_quay.length > 0;
  }

  private onResize = (): void => {
    const rong = this.khung_chua.clientWidth || 600;
    const cao = this.khung_chua.clientHeight || 500;
    this.camera.aspect = rong / cao;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rong, cao);
  };

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public huy(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
