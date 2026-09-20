import './style.css';
import { applyMove, applyMoves, createState, generateScramble, isSolved } from './cube/state';
import { formatMove, formatMoves, inverseMove, parseNotation, tachNuocDiDoi } from './cube/notation';
import type { CubeState, Face, Move } from './cube/types';
import { FACES } from './cube/types';
import { validateCubeState } from './cube/validator';
import { CubeJsSolverAdapter } from './solver/cubejs-solver';
import { ModernCubeView, FACE_NAMES_VN } from './scene/cube-view-modern';
import type { MoveAnimationProgress } from './scene/cube-view-modern';
import { readSession, writeSession } from './session-storage';

const FACE_COLORS: Record<Face, string> = {
  U: '#f6f7f2',
  R: '#e34b4b',
  F: '#3dbb82',
  D: '#f2c94c',
  L: '#f2994a',
  B: '#4f83cc',
};
const COLOR_ORDER: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const FACE_NAMES: Record<Face, string> = {
  U: 'Up', R: 'Right', F: 'Front', D: 'Down', L: 'Left', B: 'Back',
};

interface QueueItem {
  move: Move;
  resolve: () => void;
  reject: (error: unknown) => void;
}

const restoredSession = readSession();
const initialState = restoredSession?.state ?? createState();

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App mount not found');

app.innerHTML = `
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="/" aria-label="Rubik Lab home">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span>Rubik Lab</span>
      </a>
      <div class="topbar-meta">
        <span class="eyebrow">3×3 SOLVER</span>
        <span class="connection"><span class="status-dot" aria-hidden="true"></span>Local workspace</span>
      </div>
    </header>

    <main class="workspace">
      <section class="hero-copy" aria-labelledby="page-title">
        <div>
          <p class="eyebrow accent">INTERACTIVE CUBE LAB</p>
          <h1 id="page-title">See every move.<br /><span>Solve with confidence.</span></h1>
          <p class="lede">Build a scramble, inspect the state, and play a verified solution on a live 3D cube.</p>
        </div>
        <div class="stat-strip" aria-label="Cube status">
          <div class="stat"><span class="stat-label">STATE</span><strong id="state-label">SOLVED</strong></div>
          <div class="stat"><span class="stat-label">MOVES</span><strong id="move-count">0</strong></div>
          <div class="stat"><span class="stat-label">STEP</span><strong id="step-count">—</strong></div>
        </div>
      </section>

      <div class="workspace-grid">
        <section class="viewer-card" aria-label="3D cube viewer">
          <div class="viewer-toolbar">
            <div>
              <span class="section-kicker">LIVE MODEL</span>
              <span id="viewer-status" class="viewer-status">Ready</span>
            </div>
            <button id="reset-view" class="text-button" type="button">Reset view</button>
          </div>
          <div id="cube-stage" class="cube-stage">
            <div id="motion-hud" class="motion-hud" role="status" aria-live="polite" aria-atomic="true" hidden>
              <div class="motion-hud-icon" id="motion-hud-icon" aria-hidden="true">↻</div>
              <div class="motion-hud-body">
                <div class="motion-hud-line1">
                  <span class="motion-hud-face" id="motion-face-name">Mặt Phải (Right)</span>
                  <strong class="motion-hud-notation" id="motion-notation">R</strong>
                  <span class="motion-hud-dir" id="motion-direction">CW ↻</span>
                </div>
                <div class="motion-hud-line2">
                  <span class="motion-hud-desc" id="motion-turns-desc">Xoay 1/4 vòng (90°) theo chiều kim đồng hồ</span>
                  <span class="motion-hud-quarter" id="motion-quarter">1/1</span>
                </div>
              </div>
            </div>
          </div>
          <div class="viewer-hint"><span class="mouse-icon" aria-hidden="true"></span>Drag to orbit <span class="hint-separator">·</span> Scroll to zoom</div>
        </section>

        <aside class="control-column" aria-label="Cube controls">
          <section class="panel primary-panel">
            <div class="panel-heading">
              <div><span class="section-kicker">01 / SCRAMBLE</span><h2>Set your cube</h2></div>
              <button id="random-scramble" class="small-button" type="button">Randomize</button>
            </div>
            <label class="field-label" for="scramble-input">Move sequence</label>
            <div class="input-row">
              <input id="scramble-input" class="scramble-input" value="R U R' U'" autocomplete="off" spellcheck="false" aria-describedby="scramble-help" />
              <button id="apply-scramble" class="icon-text-button" type="button">Apply</button>
            </div>
            <p id="scramble-help" class="helper-text">Use standard notation: U R F D L B, with ' or 2.</p>
            <button id="solve-button" class="primary-button" type="button"><span>Solve cube</span><span class="button-arrow" aria-hidden="true">→</span></button>
            <div id="status-message" class="status-message" role="status" aria-live="polite">Ready when you are.</div>
          </section>

          <section class="panel moves-panel">
            <div class="panel-heading compact"><div><span class="section-kicker">02 / MANUAL MOVES</span><h2>Move palette</h2></div></div>
            <div id="move-palette" class="move-palette" aria-label="Manual face moves"></div>
            <p class="helper-text">Keyboard: press a face letter. Hold Shift for inverse.</p>
          </section>

          <section class="panel solution-panel">
            <div class="panel-heading compact"><div><span class="section-kicker">03 / SOLUTION</span><h2>Playback</h2></div><span id="solution-length" class="count-badge">0 moves</span></div>
            <div id="solution-list" class="solution-list empty">Solve a scramble to see the verified sequence.</div>
            <div class="playback-controls">
              <button id="restart-step" class="secondary-button" type="button" aria-label="Restart solution from the beginning" title="Đi từ đầu (về bước 0)">Restart</button>
              <button id="previous-step" class="secondary-button" type="button" aria-label="Previous solution move">Previous</button>
              <button id="play-pause" class="primary-button compact-button" type="button" disabled>Play solution</button>
              <button id="next-step" class="secondary-button" type="button" aria-label="Next solution move">Next</button>
            </div>
            <label class="speed-row" for="speed-control"><span>Speed</span><input id="speed-control" type="range" min="0.1" max="2" step="0.1" value="1" /><output id="speed-output">1×</output></label>
          </section>

          <section class="panel edit-panel">
            <details>
              <summary><span><span class="section-kicker">ADVANCED</span><strong>Inspect facelet colors</strong></span><span class="summary-caret" aria-hidden="true">+</span></summary>
              <p class="helper-text editor-help">Click any sticker to cycle its color. Centers must stay in their standard positions.</p>
              <div id="color-editor" class="color-editor"></div>
              <div class="editor-actions"><button id="validate-button" class="secondary-button" type="button">Validate state</button><button id="reset-state" class="text-button danger-text" type="button">Reset cube</button></div>
            </details>
          </section>
        </aside>
      </div>
    </main>
    <footer class="footer"><span>Logical state is the source of truth.</span><span>Built for focused practice.</span></footer>
  </div>
`;

const stage = document.querySelector<HTMLElement>('#cube-stage')!;
const cubeView = new ModernCubeView(stage, initialState);
const solver = new CubeJsSolverAdapter();
let state = initialState;
let solution: Move[] = restoredSession?.solution ?? [];
let solutionIndex = restoredSession?.solutionIndex ?? 0;
let isProcessing = false;
let isSolving = false;
let isPlaying = false;
let queue: QueueItem[] = [];

const stateLabel = document.querySelector<HTMLElement>('#state-label')!;
const moveCount = document.querySelector<HTMLElement>('#move-count')!;
const stepCount = document.querySelector<HTMLElement>('#step-count')!;
const viewerStatus = document.querySelector<HTMLElement>('#viewer-status')!;
const statusMessage = document.querySelector<HTMLElement>('#status-message')!;
const solutionList = document.querySelector<HTMLElement>('#solution-list')!;
const solutionLength = document.querySelector<HTMLElement>('#solution-length')!;
const restartStep = document.querySelector<HTMLButtonElement>('#restart-step')!;
const playPause = document.querySelector<HTMLButtonElement>('#play-pause')!;
const previousStep = document.querySelector<HTMLButtonElement>('#previous-step')!;
const nextStep = document.querySelector<HTMLButtonElement>('#next-step')!;
const solveButton = document.querySelector<HTMLButtonElement>('#solve-button')!;
const applyScramble = document.querySelector<HTMLButtonElement>('#apply-scramble')!;
const randomScramble = document.querySelector<HTMLButtonElement>('#random-scramble')!;
const resetState = document.querySelector<HTMLButtonElement>('#reset-state')!;
const validateButton = document.querySelector<HTMLButtonElement>('#validate-button')!;
const speedControl = document.querySelector<HTMLInputElement>('#speed-control')!;
const speedOutput = document.querySelector<HTMLOutputElement>('#speed-output')!;
const scrambleInput = document.querySelector<HTMLInputElement>('#scramble-input')!;
const colorEditor = document.querySelector<HTMLElement>('#color-editor')!;
const motionHud = document.querySelector<HTMLElement>('#motion-hud')!;
const motionNotation = document.querySelector<HTMLElement>('#motion-notation')!;
const motionDirection = document.querySelector<HTMLElement>('#motion-direction')!;
const motionQuarter = document.querySelector<HTMLElement>('#motion-quarter')!;
const motionHudIcon = document.querySelector<HTMLElement>('#motion-hud-icon');
const motionFaceName = document.querySelector<HTMLElement>('#motion-face-name');
const motionTurnsDesc = document.querySelector<HTMLElement>('#motion-turns-desc');

scrambleInput.value = restoredSession?.scramble ?? scrambleInput.value;

function persistSession(): void {
  writeSession({ state, scramble: scrambleInput.value, solution, solutionIndex });
}

function updateMotionHud(progress: MoveAnimationProgress): void {
  motionHud.hidden = false;
  const buoc = progress.move;
  const tenMat = FACE_NAMES_VN[buoc.face];
  const maBuoc = formatMove(buoc);
  const isNgang = buoc.face === 'U' || buoc.face === 'D';
  const prefixNgang = isNgang ? 'Xoay ngang ' : 'Xoay ';

  motionNotation.textContent = maBuoc;

  if (buoc.turn === "'") {
    if (motionHudIcon) {
      motionHudIcon.textContent = '↺';
      motionHudIcon.dataset.dir = 'ccw';
    }
    motionDirection.textContent = isNgang ? 'Ngang CCW ↺' : 'CCW ↺';
    if (motionFaceName) motionFaceName.textContent = `${tenMat.vn} (${tenMat.en} - ${buoc.face})${isNgang ? ' • Tầng ngang' : ''}`;
    if (motionTurnsDesc) motionTurnsDesc.textContent = `${prefixNgang}ngược 1/4 vòng (90°) ngược chiều kim đồng hồ`;
    motionQuarter.textContent = `${progress.quarter}/${progress.totalQuarters}`;
  } else if (buoc.turn === '2') {
    if (motionHudIcon) {
      motionHudIcon.textContent = '↻↻';
      motionHudIcon.dataset.dir = 'double';
    }
    motionDirection.textContent = isNgang ? 'Ngang 180° ↻↻' : '180° ↻↻';
    if (motionFaceName) motionFaceName.textContent = `${tenMat.vn} (${tenMat.en} - ${buoc.face})${isNgang ? ' • Tầng ngang' : ''}`;
    if (motionTurnsDesc) motionTurnsDesc.textContent = `${prefixNgang}nửa vòng (180° — 2 lượt) • Đang quay lượt ${progress.quarter}/${progress.totalQuarters} (${progress.quarter === 1 ? '90°' : '180°'})`;
    motionQuarter.textContent = `Lượt ${progress.quarter}/${progress.totalQuarters}`;
  } else {
    if (motionHudIcon) {
      motionHudIcon.textContent = '↻';
      motionHudIcon.dataset.dir = 'cw';
    }
    motionDirection.textContent = isNgang ? 'Ngang CW ↻' : 'CW ↻';
    if (motionFaceName) motionFaceName.textContent = `${tenMat.vn} (${tenMat.en} - ${buoc.face})${isNgang ? ' • Tầng ngang' : ''}`;
    if (motionTurnsDesc) motionTurnsDesc.textContent = `${prefixNgang}thuận 1/4 vòng (90°) theo chiều kim đồng hồ`;
    motionQuarter.textContent = `${progress.quarter}/${progress.totalQuarters}`;
  }
}

function hideMotionHud(): void {
  motionHud.hidden = true;
}

function setStatus(message: string, kind: 'neutral' | 'success' | 'error' = 'neutral'): void {
  statusMessage.textContent = message;
  statusMessage.dataset.kind = kind;
}

function clearSolution(): void {
  solution = [];
  solutionIndex = 0;
  isPlaying = false;
  renderSolution();
}

function refreshSummary(): void {
  const solved = isSolved(state);
  stateLabel.textContent = solved ? 'SOLVED' : 'SCRAMBLED';
  stateLabel.dataset.state = solved ? 'solved' : 'scrambled';
  moveCount.textContent = solved ? '0' : '—';
  stepCount.textContent = solution.length ? `${solutionIndex} / ${solution.length}` : '—';
  viewerStatus.textContent = isProcessing ? 'Animating' : solved ? 'Solved state' : 'Ready';
}

function renderSolution(): void {
  solutionLength.textContent = `${solution.length} ${solution.length === 1 ? 'move' : 'moves'}`;
  if (!solution.length) {
    solutionList.className = 'solution-list empty';
    solutionList.textContent = 'Solve a scramble to see the verified sequence.';
  } else {
    solutionList.className = 'solution-list';
    solutionList.innerHTML = solution.map((move, index) => `<span class="solution-token${index < solutionIndex ? ' done' : ''}${index === solutionIndex && !isProcessing ? ' active' : ''}">${formatMove(move)}</span>`).join('');
  }
  restartStep.disabled = isProcessing || solutionIndex === 0 || !solution.length;
  previousStep.disabled = isProcessing || solutionIndex === 0;
  nextStep.disabled = isProcessing || solutionIndex >= solution.length;
  playPause.disabled = isProcessing && !isPlaying ? true : solutionIndex >= solution.length && !isPlaying;
  playPause.textContent = isPlaying ? 'Pause' : 'Play solution';
  refreshSummary();
}

function updateControls(): void {
  const blocked = isProcessing || isSolving;
  solveButton.disabled = blocked;
  applyScramble.disabled = blocked;
  randomScramble.disabled = blocked;
  resetState.disabled = blocked;
  validateButton.disabled = blocked;
  document.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((button) => { button.disabled = blocked; });
  restartStep.disabled = blocked || solutionIndex === 0 || !solution.length;
  previousStep.disabled = blocked || solutionIndex === 0;
  nextStep.disabled = blocked || solutionIndex >= solution.length;
  playPause.disabled = isSolving || (solutionIndex >= solution.length && !isPlaying);
  playPause.textContent = isPlaying ? 'Pause' : 'Play solution';
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;
  updateControls();
  while (queue.length > 0) {
    const item = queue.shift()!;
    try {
      const nextState = applyMove(state, item.move);
      state = nextState;
      persistSession();
      refreshSummary();
      setStatus(`Playing ${formatMove(item.move)}…`);
      await cubeView.animateMove(item.move, nextState, Number(speedControl.value), updateMotionHud);
      hideMotionHud();
      item.resolve();
    } catch (error) {
      item.reject(error);
      queue = [];
      hideMotionHud();
      setStatus('Animation failed. Reset the cube and try again.', 'error');
    }
  }
  isProcessing = false;
  refreshSummary();
  updateControls();
}

function enqueueMoves(moves: Move[]): Promise<void> {
  const ds_da_tach = tachNuocDiDoi(moves);
  if (!ds_da_tach.length) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let remaining = ds_da_tach.length;
    const complete = (): void => {
      remaining -= 1;
      if (remaining === 0) resolve();
    };
    ds_da_tach.forEach((move) => queue.push({ move, resolve: complete, reject }));
    void processQueue();
  });
}

function setDirectState(nextState: CubeState, message = 'State updated.'): void {
  state = nextState;
  cubeView.renderState(state);
  clearSolution();
  persistSession();
  renderEditor();
  refreshSummary();
  setStatus(message);
  updateControls();
}

function handleError(error: unknown): void {
  setStatus(error instanceof Error ? error.message : 'Something went wrong. Try again.', 'error');
}

async function applySequence(moves: Move[], label: string): Promise<void> {
  if (!moves.length) return;
  clearSolution();
  setStatus(`${label} ${formatMoves(moves)}…`);
  await enqueueMoves(moves);
  setStatus(`${label} complete.`, 'success');
  renderEditor();
}

async function handleSolve(): Promise<void> {
  const validation = validateCubeState(state);
  if (!validation.valid) {
    setStatus(validation.errors.join(' '), 'error');
    return;
  }
  if (isSolved(state)) {
    clearSolution();
    persistSession();
    setStatus('The cube is already solved.', 'success');
    return;
  }

  isSolving = true;
  setStatus('Preparing solver tables…');
  updateControls();
  try {
    const loi_giai_goc = await solver.solve(state);
    solution = tachNuocDiDoi(loi_giai_goc);
    solutionIndex = 0;
    setStatus(`Solution ready in ${solution.length} moves.`, 'success');
    renderSolution();
    persistSession();
  } catch (error) {
    handleError(error);
  } finally {
    isSolving = false;
    updateControls();
  }
}

async function handlePlay(): Promise<void> {
  if (isPlaying) {
    isPlaying = false;
    setStatus('Playback paused.');
    updateControls();
    return;
  }
  if (!solution.length || solutionIndex >= solution.length) return;
  isPlaying = true;
  updateControls();
  try {
    while (isPlaying && solutionIndex < solution.length) {
      const move = solution[solutionIndex];
      solutionIndex += 1;
      renderSolution();
      await enqueueMoves([move]);
      if (isPlaying && solutionIndex < solution.length) {
        const nghi_giua_buoc = Math.max(300 / Number(speedControl.value), 200);
        await new Promise((resolve) => window.setTimeout(resolve, nghi_giua_buoc));
      }
    }
    if (solutionIndex >= solution.length) setStatus('Playback complete — cube solved.', 'success');
  } catch (error) {
    handleError(error);
  } finally {
    isPlaying = false;
    renderSolution();
    updateControls();
  }
}

function handleRestart(): void {
  if (isPlaying) isPlaying = false;
  if (isProcessing || solutionIndex === 0 || !solution.length) return;
  for (let i = solutionIndex - 1; i >= 0; i -= 1) {
    state = applyMove(state, inverseMove(solution[i]));
  }
  solutionIndex = 0;
  cubeView.renderState(state);
  renderSolution();
  persistSession();
  setStatus('Moved back to the beginning of the solution (Step 0).');
  updateControls();
}

async function handlePrevious(): Promise<void> {
  if (solutionIndex === 0 || isProcessing) return;
  const move = inverseMove(solution[solutionIndex - 1]);
  solutionIndex -= 1;
  renderSolution();
  await enqueueMoves([move]);
  persistSession();
  setStatus(`Moved back to step ${solutionIndex}.`);
}

async function handleNext(): Promise<void> {
  if (solutionIndex >= solution.length || isProcessing) return;
  const move = solution[solutionIndex];
  solutionIndex += 1;
  renderSolution();
  await enqueueMoves([move]);
  persistSession();
  if (solutionIndex === solution.length) setStatus('Playback complete — cube solved.', 'success');
}

function renderMovePalette(): void {
  const palette = document.querySelector<HTMLElement>('#move-palette')!;
  const buttons = FACES.map((face) => `
    <div class="move-group" aria-label="${FACE_NAMES[face]} moves">
      <span>${face}</span>
      <button type="button" data-move="${face}" aria-label="${FACE_NAMES[face]} clockwise">${face}</button>
      <button type="button" data-move="${face}'" aria-label="${FACE_NAMES[face]} counter-clockwise">${face}'</button>
      <button type="button" data-move="${face}2" aria-label="${FACE_NAMES[face]} half turn">${face}2</button>
    </div>`).join('');
  palette.innerHTML = buttons;
  palette.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-move]');
    if (!button || isProcessing || isSolving) return;
    const move = parseNotation(button.dataset.move!)[0];
    clearSolution();
    void enqueueMoves([move]).then(() => renderEditor());
  });
}

function renderEditor(): void {
  colorEditor.innerHTML = FACES.map((face, faceIndex) => {
    const cells = Array.from({ length: 9 }, (_, localIndex) => {
      const index = faceIndex * 9 + localIndex;
      const color = state.facelets[index] as Face;
      const locked = localIndex === 4;
      return `<button class="facelet${locked ? ' center' : ''}" type="button" data-facelet-index="${index}" style="--facelet-color:${FACE_COLORS[color]};--facelet-ink:${color === 'U' || color === 'D' ? '#10151d' : '#ffffff'}" aria-label="${FACE_NAMES[face]} sticker ${localIndex + 1}: ${color}">${color}</button>`;
    }).join('');
    return `<div class="face-editor"><div class="face-editor-title"><span class="face-letter" style="--face-color:${FACE_COLORS[face]}">${face}</span><span>${FACE_NAMES[face]}</span></div><div class="facelet-grid">${cells}</div></div>`;
  }).join('');
}

colorEditor.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-facelet-index]');
  if (!button || isProcessing || isSolving) return;
  const index = Number(button.dataset.faceletIndex);
  const current = state.facelets[index] as Face;
  const nextColor = COLOR_ORDER[(COLOR_ORDER.indexOf(current) + 1) % COLOR_ORDER.length];
  const facelets = `${state.facelets.slice(0, index)}${nextColor}${state.facelets.slice(index + 1)}`;
  state = createState(facelets);
  cubeView.renderState(state);
  clearSolution();
  persistSession();
  renderEditor();
  refreshSummary();
  setStatus('Facelet edited. Validate the state before solving.');
});

document.querySelector<HTMLButtonElement>('#reset-view')!.addEventListener('click', () => cubeView.resetCamera());
document.querySelector<HTMLButtonElement>('#reset-state')!.addEventListener('click', () => setDirectState(createState(), 'Cube reset to solved.'));
document.querySelector<HTMLButtonElement>('#validate-button')!.addEventListener('click', () => {
  const result = validateCubeState(state);
  setStatus(result.valid ? 'State is valid and ready to solve.' : result.errors.join(' '), result.valid ? 'success' : 'error');
});
applyScramble.addEventListener('click', () => {
  try {
    void applySequence(parseNotation(scrambleInput.value), 'Applying');
  } catch (error) {
    handleError(error);
  }
});
scrambleInput.addEventListener('input', persistSession);
randomScramble.addEventListener('click', () => {
  const scramble = generateScramble();
  scrambleInput.value = formatMoves(scramble);
  void applySequence(scramble, 'Scrambling');
});
solveButton.addEventListener('click', () => void handleSolve());
playPause.addEventListener('click', () => void handlePlay());
restartStep.addEventListener('click', () => handleRestart());
previousStep.addEventListener('click', () => void handlePrevious());
nextStep.addEventListener('click', () => void handleNext());
speedControl.addEventListener('input', () => {
  speedOutput.value = `${speedControl.value}×`;
  speedOutput.textContent = `${speedControl.value}×`;
});
document.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
  const face = event.key.toUpperCase() as Face;
  if (!FACES.includes(face) || isProcessing || isSolving) return;
  event.preventDefault();
  const turn = event.shiftKey ? "'" : '';
  clearSolution();
  void enqueueMoves([{ face, turn }]).then(() => renderEditor());
});

renderMovePalette();
renderEditor();
renderSolution();
refreshSummary();
updateControls();
if (restoredSession) setStatus('Restored your previous session.');
hideMotionHud();
persistSession();

window.addEventListener('beforeunload', () => cubeView.dispose());
