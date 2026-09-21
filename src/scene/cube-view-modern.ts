import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CubeState, Face, Move } from '../cube/types';

const CUBIE_GAP = 1.06;
export const BASE_ANIMATION_DURATION_MS = 850;
export const REDUCED_MOTION_FACTOR = 0.35;
const FACE_COLORS: Record<Face, number> = {
  U: 0xf2c94c,
  R: 0xe34b4b,
  F: 0x3dbb82,
  D: 0xf6f7f2,
  L: 0xf2994a,
  B: 0x4f83cc,
};
const FACE_NORMALS: Record<Face, [number, number, number]> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};
export const FACE_NAMES_VN: Record<Face, { vn: string; en: string }> = {
  U: { vn: 'Mặt Trên', en: 'Up' },
  D: { vn: 'Mặt Dưới', en: 'Down' },
  L: { vn: 'Mặt Trái', en: 'Left' },
  R: { vn: 'Mặt Phải', en: 'Right' },
  F: { vn: 'Mặt Trước', en: 'Front' },
  B: { vn: 'Mặt Sau', en: 'Back' },
};

// Cấu hình camera tối ưu: lùi xa một chút để nhìn trọn vẹn Rubik và các mũi tên 3D
export const CAU_HINH_CAMERA = {
  fov: 40,
  minDistance: 3.5,
  maxDistance: 18,
  viTriMacDinh: [5.8, 5.0, 6.6] as [number, number, number],
  gocNhin: {
    top: [4.4, 6.4, 5.4] as [number, number, number],
    bottom: [4.4, -6.4, 5.4] as [number, number, number],
    front: [2.0, 3.3, 8.2] as [number, number, number],
    'front-right': [5.8, 4.9, 5.8] as [number, number, number],
    'front-left': [-5.8, 4.9, 5.8] as [number, number, number],
    'stage8-lock': [5.4, 4.5, 6.1] as [number, number, number],
  } as Record<string, [number, number, number]>,
};

export const CAMERA_CONFIG = CAU_HINH_CAMERA;

function faceletIndex(face: Face, x: number, y: number, z: number): number {
  let row: number;
  let column: number;
  switch (face) {
    case 'U': row = z + 1; column = x + 1; break;
    case 'R': row = 1 - y; column = 1 - z; break;
    case 'F': row = 1 - y; column = x + 1; break;
    case 'D': row = 1 - z; column = x + 1; break;
    case 'L': row = 1 - y; column = z + 1; break;
    case 'B': row = 1 - y; column = 1 - x; break;
  }
  return ['U', 'R', 'F', 'D', 'L', 'B'].indexOf(face) * 9 + row * 3 + column;
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
    else if (mesh.material) mesh.material.dispose();
  });
}

function createSticker(face: Face, color: string, position: [number, number, number]): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.82),
    new THREE.MeshBasicMaterial({ color: FACE_COLORS[color as Face], side: THREE.FrontSide }),
  );
  mesh.position.set(...position);
  switch (face) {
    case 'U': mesh.rotation.x = -Math.PI / 2; break;
    case 'D': mesh.rotation.x = Math.PI / 2; break;
    case 'R': mesh.rotation.y = Math.PI / 2; break;
    case 'L': mesh.rotation.y = -Math.PI / 2; break;
    case 'B': mesh.rotation.y = Math.PI; break;
  }
  mesh.renderOrder = 1;
  return mesh;
}

function createCubie(x: number, y: number, z: number, state: CubeState): THREE.Group {
  const cubie = new THREE.Group();
  cubie.position.set(x * CUBIE_GAP, y * CUBIE_GAP, z * CUBIE_GAP);
  cubie.userData.position = { x, y, z };
  cubie.add(new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 0.98, 0.98),
    new THREE.MeshStandardMaterial({ color: 0x10151d, roughness: 0.72, metalness: 0.08 }),
  ));

  const sides: Array<{ face: Face; visible: boolean; offset: [number, number, number] }> = [
    { face: 'U', visible: y === 1, offset: [0, 0.5, 0] },
    { face: 'R', visible: x === 1, offset: [0.5, 0, 0] },
    { face: 'F', visible: z === 1, offset: [0, 0, 0.5] },
    { face: 'D', visible: y === -1, offset: [0, -0.5, 0] },
    { face: 'L', visible: x === -1, offset: [-0.5, 0, 0] },
    { face: 'B', visible: z === -1, offset: [0, 0, -0.5] },
  ];
  for (const side of sides) {
    if (!side.visible) continue;
    cubie.add(createSticker(side.face, state.facelets[faceletIndex(side.face, x, y, z)], side.offset));
  }
  return cubie;
}

function axisForFace(face: Face): THREE.Vector3 {
  return new THREE.Vector3(...FACE_NORMALS[face]);
}

function turnAngle(move: Move): number {
  if (move.turn === "'") return Math.PI / 2;
  if (move.turn === '2') return -Math.PI;
  return -Math.PI / 2;
}

export interface MoveAnimationProgress {
  move: Move;
  progress: number;
  quarter: number;
  totalQuarters: number;
}

export function animationDurationForSpeed(speed: number, reducedMotion: boolean): number {
  const motionScale = reducedMotion ? REDUCED_MOTION_FACTOR : 1;
  return (BASE_ANIMATION_DURATION_MS * motionScale) / Math.max(speed, 0.1);
}

export interface DinhHuongMuiTen3D {
  mat: Face;
  vi_tri: [number, number, number];
  goc_quay: [number, number, number];
  phap_tuyen: [number, number, number];
  mat_phang: 'X-Z' | 'Y-Z' | 'X-Y';
  is_song_song: boolean;
}

export const HE_SO_KC_MUI_TEN = 2.25; // Hệ số khoảng cách mũi tên 3D cách xa tâm Rubik (tạo khoảng hở lớn với mặt Rubik)

// Tinh toan toa do va goc quay 3D de mat mui ten song song 100% voi mat Rubik tuong ung
export function layDinhHuongMuiTen3D(mat: Face): DinhHuongMuiTen3D {
  const kc_tam = CUBIE_GAP * HE_SO_KC_MUI_TEN;
  const normal = FACE_NORMALS[mat];

  let goc_quay: [number, number, number] = [0, 0, 0];
  let mat_phang: 'X-Z' | 'Y-Z' | 'X-Y' = 'X-Y';

  switch (mat) {
    case 'U': // Mat Tren (nam ngang tren mat phang X-Z)
      goc_quay = [-Math.PI / 2, 0, 0];
      mat_phang = 'X-Z';
      break;
    case 'D': // Mat Duoi (nam ngang tren mat phang X-Z)
      goc_quay = [Math.PI / 2, 0, 0];
      mat_phang = 'X-Z';
      break;
    case 'R': // Mat Phai (nam dung tren mat phang Y-Z)
      goc_quay = [0, Math.PI / 2, 0];
      mat_phang = 'Y-Z';
      break;
    case 'L': // Mat Trai (nam dung tren mat phang Y-Z)
      goc_quay = [0, -Math.PI / 2, 0];
      mat_phang = 'Y-Z';
      break;
    case 'B': // Mat Sau (nam dung tren mat phang X-Y)
      goc_quay = [0, Math.PI, 0];
      mat_phang = 'X-Y';
      break;
    case 'F': // Mat Truoc (nam dung tren mat phang X-Y)
      goc_quay = [0, 0, 0];
      mat_phang = 'X-Y';
      break;
  }

  const vi_tri: [number, number, number] = [
    normal[0] * kc_tam,
    normal[1] * kc_tam,
    normal[2] * kc_tam,
  ];

  return {
    mat,
    vi_tri,
    goc_quay,
    phap_tuyen: normal,
    mat_phang,
    is_song_song: true,
  };
}

export class ModernCubeView {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly root = new THREE.Group();
  private readonly container: HTMLElement;
  private readonly motionOverlay: HTMLDivElement;
  private activeMove?: Move;
  private resizeObserver?: ResizeObserver;
  private animationFrame?: number;
  private motionArrowMesh?: THREE.Mesh;
  private motionCanvas?: HTMLCanvasElement;
  private motionCtx?: CanvasRenderingContext2D | null;
  private motionTexture?: THREE.CanvasTexture;
  private vi_tri_render_cu?: string;

  constructor(container: HTMLElement, state: CubeState) {
    this.container = container;
    this.scene.background = new THREE.Color(0x10151d);
    this.camera = new THREE.PerspectiveCamera(CAU_HINH_CAMERA.fov, 1, 0.1, 100);
    this.camera.position.set(...CAU_HINH_CAMERA.viTriMacDinh);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D Rubik cube. Drag to orbit the camera.');
    this.renderer.domElement.className = 'cube-canvas';
    container.appendChild(this.renderer.domElement);
    this.motionOverlay = document.createElement('div');
    this.motionOverlay.className = 'motion-overlay';
    this.motionOverlay.hidden = true;
    this.motionOverlay.style.display = 'none'; // An overlay 2D screen de chi hien thi mui ten 3D song song tren mat cube
    this.motionOverlay.setAttribute('aria-hidden', 'true');
    this.motionOverlay.innerHTML = `
      <div class="motion-ring">
        <svg class="motion-svg" viewBox="0 0 160 160" focusable="false">
          <defs>
            <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="currentColor" flood-opacity="0.9" />
            </filter>
            <marker id="arrowhead-cw" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
              <polygon points="0 1, 10 5, 0 9" fill="#ff9366" />
            </marker>
            <marker id="arrowhead-ccw" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
              <polygon points="0 1, 10 5, 0 9" fill="#35c5b1" />
            </marker>
            <marker id="arrowhead-double" markerWidth="10" markerHeight="10" refX="6" refY="5" orient="auto">
              <polygon points="0 1, 10 5, 0 9" fill="#f2c94c" />
            </marker>
          </defs>
          <!-- Mũi tên cung tròn thuận chiều kim đồng hồ (CW) -->
          <path class="motion-arrow-path motion-arrow-cw" d="M 38 122 A 56 56 0 1 1 126 38" marker-end="url(#arrowhead-cw)" filter="url(#neon-glow)" />
          <!-- Mũi tên cung tròn ngược chiều kim đồng hồ (CCW) -->
          <path class="motion-arrow-path motion-arrow-ccw" d="M 122 122 A 56 56 0 1 0 34 38" marker-end="url(#arrowhead-ccw)" filter="url(#neon-glow)" />
          <!-- 2 Mũi tên đối xứng cho 180 độ (double) -->
          <g class="motion-arrow-double">
            <path class="motion-arrow-path" d="M 38 122 A 56 56 0 0 1 122 38" marker-end="url(#arrowhead-double)" filter="url(#neon-glow)" />
            <path class="motion-arrow-path" d="M 122 38 A 56 56 0 0 1 38 122" marker-end="url(#arrowhead-double)" filter="url(#neon-glow)" />
          </g>
        </svg>
        <div class="motion-center-badge">
          <div class="motion-badge-top">
            <strong class="motion-badge-code">R</strong>
            <span class="motion-badge-direction">CW ↻</span>
          </div>
          <div class="motion-badge-name">Mặt Phải</div>
          <div class="motion-badge-turns">90° (1/4 vòng)</div>
        </div>
      </div>`;
    container.appendChild(this.motionOverlay);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = CAU_HINH_CAMERA.minDistance;
    this.controls.maxDistance = CAU_HINH_CAMERA.maxDistance;
    this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight(0xf7f5ef, 0x171b24, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(4, 7, 5);
    this.scene.add(keyLight);
    this.renderState(state);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    // Khoi tao Mesh mui ten 3D dong tren mat phang song song voi mat Rubik
    if (typeof document !== 'undefined') {
      this.motionCanvas = document.createElement('canvas');
      this.motionCanvas.width = 512;
      this.motionCanvas.height = 512;
      this.motionCtx = this.motionCanvas.getContext('2d');
      this.motionTexture = new THREE.CanvasTexture(this.motionCanvas);
      this.motionTexture.colorSpace = THREE.SRGBColorSpace;

      const vat_lieu = new THREE.MeshBasicMaterial({
        map: this.motionTexture,
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
      });

      this.motionArrowMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), vat_lieu);
      this.motionArrowMesh.renderOrder = 9999;
      this.motionArrowMesh.visible = false;
      this.scene.add(this.motionArrowMesh);
    }

    this.renderLoop();
  }

  // Ve texture mui ten xoay chat luong cao truc tiep len canvas 512x512
  private drawMotionCanvas(buoc: Move, luot = 1, tong_luot = 1): void {
    const ctx = this.motionCtx;
    if (!ctx || !this.motionCanvas) return;

    const rong = this.motionCanvas.width;
    const cao = this.motionCanvas.height;
    const tam_x = rong / 2;
    const tam_y = cao / 2;
    const ban_kinh = 185;

    ctx.clearRect(0, 0, rong, cao);

    const is_ccw = buoc.turn === "'";
    const is_double = buoc.turn === '2';
    const mau_sac = is_ccw ? '#38bdf8' : is_double ? '#facc15' : '#ff9366';

    // 1. Vong tron vien mo lam duong ray
    ctx.save();
    ctx.beginPath();
    ctx.arc(tam_x, tam_y, ban_kinh, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    // 2. Cung mui ten xoay co hieu ung phat sang neon
    ctx.beginPath();
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = mau_sac;
    ctx.shadowColor = mau_sac;
    ctx.shadowBlur = 18;

    if (is_double) {
      // 2 cung doi xung nhau cho phep xoay 180 do (2 luot)
      ctx.arc(tam_x, tam_y, ban_kinh, -Math.PI * 0.86, -Math.PI * 0.14, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(tam_x, tam_y, ban_kinh, Math.PI * 0.14, Math.PI * 0.86, false);
      ctx.stroke();

      this.drawArrowTip(ctx, tam_x, tam_y, ban_kinh, -Math.PI * 0.14, mau_sac, true);
      this.drawArrowTip(ctx, tam_x, tam_y, ban_kinh, Math.PI * 0.86, mau_sac, true);
    } else if (is_ccw) {
      // Cung mui ten nguoc chieu kim dong ho (CCW)
      ctx.arc(tam_x, tam_y, ban_kinh, Math.PI * 0.25, -Math.PI * 1.25, true);
      ctx.stroke();
      this.drawArrowTip(ctx, tam_x, tam_y, ban_kinh, -Math.PI * 1.25, mau_sac, false);
    } else {
      // Cung mui ten thuan chieu kim dong ho (CW)
      ctx.arc(tam_x, tam_y, ban_kinh, -Math.PI * 0.75, Math.PI * 0.75, false);
      ctx.stroke();
      this.drawArrowTip(ctx, tam_x, tam_y, ban_kinh, Math.PI * 0.75, mau_sac, true);
    }
    ctx.restore();

    // 3. Huy hieu nen toi o trung tam mat Rubik
    ctx.save();
    ctx.beginPath();
    ctx.arc(tam_x, tam_y, 110, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 21, 29, 0.94)';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = mau_sac;
    ctx.shadowColor = mau_sac;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    // 4. Chu thong tin nuoc di ro rang tren mat mui ten
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 76px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(`${buoc.face}${buoc.turn}`, tam_x, tam_y - 36);

    const ten_mat = FACE_NAMES_VN[buoc.face];
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.shadowBlur = 4;
    ctx.fillText(ten_mat.vn.toUpperCase(), tam_x, tam_y + 22);

    const text_huong = is_double ? `180° (${luot}/${tong_luot})` : is_ccw ? '90° CCW ↺' : '90° CW ↻';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillStyle = mau_sac;
    ctx.fillText(text_huong, tam_x, tam_y + 58);

    ctx.restore();
  }

  // Ve dau mui nhon tiep tuyen voi duong tron
  private drawArrowTip(
    ctx: CanvasRenderingContext2D,
    tam_x: number,
    tam_y: number,
    ban_kinh: number,
    goc: number,
    mau_sac: string,
    is_thuan: boolean,
  ): void {
    const x = tam_x + ban_kinh * Math.cos(goc);
    const y = tam_y + ban_kinh * Math.sin(goc);
    const goc_tiep_tuyen = goc + (is_thuan ? Math.PI / 2 : -Math.PI / 2);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(goc_tiep_tuyen);
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.closePath();
    ctx.fillStyle = mau_sac;
    ctx.shadowColor = mau_sac;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
  }

  private renderLoop = (): void => {
    this.controls.update();
    this.positionMotionOverlay();
    this.renderer.render(this.scene, this.camera);
    this.animationFrame = requestAnimationFrame(this.renderLoop);
  };

  private resize(): void {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.positionMotionOverlay();
  }

  private positionMotionOverlay(): void {
    if (!this.activeMove) return;
    const normal = axisForFace(this.activeMove.face);
    const camDir = this.camera.position.clone().normalize();
    const facingCamera = normal.dot(camDir) > -0.25;

    const projected = normal.clone().multiplyScalar(CUBIE_GAP * HE_SO_KC_MUI_TEN).project(this.camera);
    if (projected.z < -1 || projected.z > 1) {
      this.motionOverlay.hidden = true;
      return;
    }
    this.motionOverlay.hidden = false;
    this.motionOverlay.style.left = `${((projected.x + 1) / 2) * this.container.clientWidth}px`;
    this.motionOverlay.style.top = `${((-projected.y + 1) / 2) * this.container.clientHeight}px`;
    this.motionOverlay.style.opacity = facingCamera ? '1' : '0.45';
  }

  public updateMotionOverlay(move: Move, quarter = 1, totalQuarters = 1): void {
    this.activeMove = move;
    this.motionOverlay.hidden = false;

    // Cap nhat mui ten 3D song song tren mat Rubik (chi ve lai canvas khi quarter hoac buoc thay doi)
    const khoa_render = `${move.face}${move.turn}_${quarter}`;
    if (this.motionArrowMesh && this.vi_tri_render_cu !== khoa_render) {
      this.vi_tri_render_cu = khoa_render;
      this.drawMotionCanvas(move, quarter, totalQuarters);
      if (this.motionTexture) this.motionTexture.needsUpdate = true;
    }

    const isHorizontal = move.face === 'U' || move.face === 'D';
    this.motionOverlay.dataset.orientation = isHorizontal ? 'horizontal' : 'vertical';
    this.motionOverlay.dataset.face = move.face;

    const codeEl = this.motionOverlay.querySelector<HTMLElement>('.motion-badge-code');
    const dirEl = this.motionOverlay.querySelector<HTMLElement>('.motion-badge-direction');
    const nameEl = this.motionOverlay.querySelector<HTMLElement>('.motion-badge-name');
    const turnsEl = this.motionOverlay.querySelector<HTMLElement>('.motion-badge-turns');

    const notation = `${move.face}${move.turn}`;
    const tenMat = FACE_NAMES_VN[move.face];

    if (codeEl) codeEl.textContent = notation;
    if (nameEl) nameEl.textContent = tenMat.vn;

    const prefixNgang = isHorizontal ? 'Ngang ' : '';

    if (move.turn === "'") {
      this.motionOverlay.dataset.direction = 'ccw';
      if (dirEl) dirEl.textContent = isHorizontal ? 'Ngang ↺' : 'CCW ↺';
      if (turnsEl) turnsEl.textContent = `${prefixNgang}90° (nghịch ↺)`;
    } else if (move.turn === '2') {
      this.motionOverlay.dataset.direction = 'double';
      if (dirEl) dirEl.textContent = isHorizontal ? 'Ngang 180°' : '180° ↻↻';
      if (turnsEl) turnsEl.textContent = `${prefixNgang}180° (${quarter}/${totalQuarters})`;
    } else {
      this.motionOverlay.dataset.direction = 'cw';
      if (dirEl) dirEl.textContent = isHorizontal ? 'Ngang ↻' : 'CW ↻';
      if (turnsEl) turnsEl.textContent = `${prefixNgang}90° (1/4 vòng)`;
    }

    this.positionMotionOverlay();
  }

  private showMotionOverlay(move: Move): void {
    // Dinh vi Mesh 3D nam song song chinh xac tren mat Rubik dang xoay
    if (this.motionArrowMesh) {
      const dinh_huong = layDinhHuongMuiTen3D(move.face);
      this.motionArrowMesh.position.set(...dinh_huong.vi_tri);
      this.motionArrowMesh.rotation.set(...dinh_huong.goc_quay);
      this.vi_tri_render_cu = undefined; // Reset khoa de ve ngay cho buoc moi
      this.drawMotionCanvas(move, 1, move.turn === '2' ? 2 : 1);
      if (this.motionTexture) this.motionTexture.needsUpdate = true;
      this.motionArrowMesh.visible = true;
    }

    this.updateMotionOverlay(move, 1, move.turn === '2' ? 2 : 1);
  }

  private hideMotionOverlay(): void {
    this.activeMove = undefined;
    this.motionOverlay.hidden = true;
    if (this.motionArrowMesh) {
      this.motionArrowMesh.visible = false;
    }
  }

  renderState(state: CubeState): void {
    for (const child of [...this.root.children]) {
      this.root.remove(child);
      disposeObject(child);
    }
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) this.root.add(createCubie(x, y, z, state));
      }
    }
  }

  animateMove(
    move: Move,
    nextState: CubeState,
    speed = 1,
    onProgress?: (progress: MoveAnimationProgress) => void,
  ): Promise<void> {
    this.showMotionOverlay(move);
    const layer = new THREE.Group();
    this.root.add(layer);
    const axis = axisForFace(move.face);
    const axisKey: 'x' | 'y' | 'z' = axis.x !== 0 ? 'x' : axis.y !== 0 ? 'y' : 'z';
    const layerCoordinate = axis[axisKey] > 0 ? 1 : -1;
    for (const child of [...this.root.children]) {
      if (child === layer) continue;
      const position = child.userData.position as { x: number; y: number; z: number } | undefined;
      if (position?.[axisKey] === layerCoordinate) layer.attach(child);
    }

    const totalQuarters = move.turn === '2' ? 2 : 1;
    // Thoi luong chuan nhan voi so quarter de cac nuoc di 180 do (F2, B2...) co toc do goc xoay dong nhat, khong bi xoay gap doi
    const thoi_luong_chuan = animationDurationForSpeed(speed, window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const duration = thoi_luong_chuan * totalQuarters;
    const angle = turnAngle(move);
    onProgress?.({ move, progress: 0, quarter: 1, totalQuarters });
    return new Promise((resolve) => {
      const started = performance.now();
      const step = (now: number): void => {
        const progress = duration === 0 ? 1 : Math.min((now - started) / duration, 1);
        const currentQuarter = Math.min(Math.floor(progress * totalQuarters) + 1, totalQuarters);
        this.updateMotionOverlay(move, currentQuarter, totalQuarters);
        onProgress?.({
          move,
          progress,
          quarter: currentQuarter,
          totalQuarters,
        });
        // Ham noi suy goc: o toc do cham (speed <= 0.3) su dung tuyen tinh deu hoac easeInOutCubic
        // giup bat dau va ket thuc em diu, loai bo cam giac 'vut rat nhanh' ban dau o mat truoc (F) va sau (B)
        const ty_le = speed <= 0.3
          ? progress
          : progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        layer.setRotationFromAxisAngle(axis, angle * ty_le);
        if (progress < 1) {
          requestAnimationFrame(step);
          return;
        }
        this.root.remove(layer);
        disposeObject(layer);
        this.hideMotionOverlay();
        this.renderState(nextState);
        resolve();
      };
      requestAnimationFrame(step);
    });
  }

  setCameraPreset(preset: string): void {
    const vi_tri = CAU_HINH_CAMERA.gocNhin[preset] || CAU_HINH_CAMERA.viTriMacDinh;
    this.camera.position.set(...vi_tri);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  resetCamera(): void {
    this.camera.position.set(...CAU_HINH_CAMERA.viTriMacDinh);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  dispose(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.motionOverlay.remove();
    if (this.motionArrowMesh) {
      this.scene.remove(this.motionArrowMesh);
      disposeObject(this.motionArrowMesh);
    }
    this.motionTexture?.dispose();
  }
}
