const FACE_ORDER = ["U", "R", "F", "D", "L", "B"];
const FACE_COLORS = {
  U: "W",
  D: "Y",
  F: "G",
  B: "B",
  R: "R",
  L: "O",
};

const COLOR_HEX = {
  N: "#98a39d",
  W: "#f3f5ef",
  Y: "#f2d26c",
  G: "#79b795",
  B: "#719fc6",
  R: "#d8887d",
  O: "#dfac7f",
};

const COLOR_NAME = {
  N: "None",
  W: "White",
  Y: "Yellow",
  G: "Green",
  B: "Blue",
  R: "Red",
  O: "Orange",
};

const SOLVER_MOVES = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2"];
const FAST_HALF_DEPTH = 7;
const DEEP_HALF_DEPTH = 8;
const ITERATIVE_MAX_FORWARD_DEPTH = 10;
const ITERATIVE_TIME_LIMIT_MS = 2500;

const faceContainers = {};
const stickerElements = new Map();

const paletteEl = document.getElementById("palette");
const resetNullBtn = document.getElementById("resetNullBtn");
const solvedBtn = document.getElementById("solvedBtn");
const scrambleBtn = document.getElementById("scrambleBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const statusEl = document.getElementById("status");
const moveHintEl = document.getElementById("moveHint");
const stepsEl = document.getElementById("steps");
const setupCubeEl = document.getElementById("setupCube");
const solveCubeEl = document.getElementById("solveCube");
const setupPrevFaceBtn = document.getElementById("setupPrevFaceBtn");
const setupNextFaceBtn = document.getElementById("setupNextFaceBtn");
const setupFaceLabelEl = document.getElementById("setupFaceLabel");
const setupHintEl = document.getElementById("setupHint");
const toSolveBtn = document.getElementById("toSolveBtn");
const toSetupBtn = document.getElementById("toSetupBtn");
const setupStageEl = document.getElementById("setupStage");
const solveStageEl = document.getElementById("solveStage");
const setupControlsEl = document.getElementById("setupControls");
const solveControlsEl = document.getElementById("solveControls");
const toggleDebugBtn = document.getElementById("toggleDebugBtn");
const debugHeadEl = document.getElementById("debugHead");
const copyDebugBtn = document.getElementById("copyDebugBtn");
const debugOutputEl = document.getElementById("debugOutput");

let selectedColor = "W";
let cubeState = "";
let solvedState = "";

let goalTable = null;
let goalTableReady = false;
let goalTableDepth = 0;
let goalFrontier = [];

let solutionMoves = [];
let solutionStartState = "";
let stepIndex = 0;
let isAnimatingStep = false;
let isAutoPreparing = false;
let solveViewState = "";
let currentStep = "setup";
let currentSetupFaceIndex = 0;
let isDebugVisible = false;

const SETUP_FACES = ["F", "R", "B", "L", "U", "D"];
const SETUP_FACE_LABEL = { F: "Front", R: "Right", B: "Back", L: "Left", U: "Top", D: "Bottom" };
const SETUP_VIEW_TRANSFORMS = {
  F: "rotateX(-15deg) rotateY(0deg)",
  R: "rotateX(-15deg) rotateY(-90deg)",
  B: "rotateX(-15deg) rotateY(-180deg)",
  L: "rotateX(-15deg) rotateY(-270deg)",
  U: "rotateX(-90deg) rotateY(0deg)",
  D: "rotateX(90deg) rotateY(0deg)",
};
const SOLVE_VIEW_TRANSFORM = "rotateX(-30deg) rotateY(0deg)";

function stickerDefs() {
  const defs = [];
  function add(face, row, col, x, y, z, nx, ny, nz) {
    defs.push({ face, row, col, x, y, z, nx, ny, nz });
  }

  // U (top)
  add("U", 0, 0, -1, 1, -1, 0, 1, 0);
  add("U", 0, 1, 1, 1, -1, 0, 1, 0);
  add("U", 1, 0, -1, 1, 1, 0, 1, 0);
  add("U", 1, 1, 1, 1, 1, 0, 1, 0);

  // R (right)
  add("R", 0, 0, 1, 1, 1, 1, 0, 0);
  add("R", 0, 1, 1, 1, -1, 1, 0, 0);
  add("R", 1, 0, 1, -1, 1, 1, 0, 0);
  add("R", 1, 1, 1, -1, -1, 1, 0, 0);

  // F (front)
  add("F", 0, 0, -1, 1, 1, 0, 0, 1);
  add("F", 0, 1, 1, 1, 1, 0, 0, 1);
  add("F", 1, 0, -1, -1, 1, 0, 0, 1);
  add("F", 1, 1, 1, -1, 1, 0, 0, 1);

  // D (bottom)
  add("D", 0, 0, -1, -1, 1, 0, -1, 0);
  add("D", 0, 1, 1, -1, 1, 0, -1, 0);
  add("D", 1, 0, -1, -1, -1, 0, -1, 0);
  add("D", 1, 1, 1, -1, -1, 0, -1, 0);

  // L (left)
  add("L", 0, 0, -1, 1, -1, -1, 0, 0);
  add("L", 0, 1, -1, 1, 1, -1, 0, 0);
  add("L", 1, 0, -1, -1, -1, -1, 0, 0);
  add("L", 1, 1, -1, -1, 1, -1, 0, 0);

  // B (back)
  add("B", 0, 0, 1, 1, -1, 0, 0, -1);
  add("B", 0, 1, -1, 1, -1, 0, 0, -1);
  add("B", 1, 0, 1, -1, -1, 0, 0, -1);
  add("B", 1, 1, -1, -1, -1, 0, 0, -1);

  return defs;
}

const STICKERS = stickerDefs();
const CUBIE_COORDS = [
  { x: -1, y: -1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: 1, z: 1 },
  { x: 1, y: -1, z: -1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: -1 },
  { x: 1, y: 1, z: 1 },
];
const STICKER_KEY_TO_INDEX = new Map();
const FACE_TO_INDICES = {};

for (let i = 0; i < STICKERS.length; i += 1) {
  const s = STICKERS[i];
  STICKER_KEY_TO_INDEX.set(makeKey(s.x, s.y, s.z, s.nx, s.ny, s.nz), i);
}

for (const face of FACE_ORDER) {
  FACE_TO_INDICES[face] = STICKERS.map((s, idx) => ({ ...s, idx }))
    .filter((s) => s.face === face)
    .sort((a, b) => a.row - b.row || a.col - b.col)
    .map((s) => s.idx);
}

const BASE_PERM = {
  U: buildFaceClockwisePerm("U"),
  R: buildFaceClockwisePerm("R"),
  F: buildFaceClockwisePerm("F"),
};

const MOVE_PERM = buildMovePermutations();

function makeKey(x, y, z, nx, ny, nz) {
  return `${x},${y},${z}|${nx},${ny},${nz}`;
}

function rotateVecForFace(face, x, y, z) {
  switch (face) {
    case "U":
      return [z, y, -x];
    case "D":
      return [-z, y, x];
    case "R":
      return [x, z, -y];
    case "L":
      return [x, -z, y];
    case "F":
      return [y, -x, z];
    case "B":
      return [-y, x, z];
    default:
      return [x, y, z];
  }
}

function inLayer(face, s) {
  if (face === "U") return s.y === 1;
  if (face === "D") return s.y === -1;
  if (face === "R") return s.x === 1;
  if (face === "L") return s.x === -1;
  if (face === "F") return s.z === 1;
  return s.z === -1;
}

function buildFaceClockwisePerm(face) {
  const perm = new Array(STICKERS.length);
  for (let oldIndex = 0; oldIndex < STICKERS.length; oldIndex += 1) {
    const s = STICKERS[oldIndex];
    let next = s;

    if (inLayer(face, s)) {
      const [nx, ny, nz] = rotateVecForFace(face, s.x, s.y, s.z);
      const [nnx, nny, nnz] = rotateVecForFace(face, s.nx, s.ny, s.nz);
      next = { x: nx, y: ny, z: nz, nx: nnx, ny: nny, nz: nnz };
    }

    const newIndex = STICKER_KEY_TO_INDEX.get(
      makeKey(next.x, next.y, next.z, next.nx, next.ny, next.nz)
    );
    perm[newIndex] = oldIndex;
  }
  return perm;
}

function composePerm(a, b) {
  const out = new Array(a.length);
  for (let i = 0; i < a.length; i += 1) {
    out[i] = a[b[i]];
  }
  return out;
}

function invertPerm(perm) {
  const inv = new Array(perm.length);
  for (let i = 0; i < perm.length; i += 1) {
    inv[perm[i]] = i;
  }
  return inv;
}

function buildMovePermutations() {
  const moves = {};
  for (const face of ["U", "R", "F"]) {
    const cw = BASE_PERM[face];
    const ccw = invertPerm(cw);
    const dbl = composePerm(cw, cw);
    moves[face] = cw;
    moves[`${face}'`] = ccw;
    moves[`${face}2`] = dbl;
  }
  return moves;
}

function applyMove(state, move) {
  const perm = MOVE_PERM[move];
  const out = new Array(state.length);
  for (let i = 0; i < perm.length; i += 1) {
    out[i] = state[perm[i]];
  }
  return out.join("");
}

function applyMoves(state, moves) {
  let out = state;
  for (const mv of moves) out = applyMove(out, mv);
  return out;
}

function invertMove(move) {
  if (move.endsWith("2")) return move;
  if (move.endsWith("'")) return move[0];
  return `${move}'`;
}

function invertSequence(seq) {
  const out = [];
  for (let i = seq.length - 1; i >= 0; i -= 1) {
    out.push(invertMove(seq[i]));
  }
  return out;
}

function initSolvedState() {
  solvedState = STICKERS.map((s) => FACE_COLORS[s.face]).join("");
  cubeState = STICKERS.map(() => "N").join("");
}

function initCubeUI() {
  for (const face of FACE_ORDER) {
    const el = document.querySelector(`.face[data-face="${face}"]`);
    faceContainers[face] = el;

    for (const idx of FACE_TO_INDICES[face]) {
      const sticker = document.createElement("button");
      sticker.type = "button";
      sticker.className = "sticker";
      sticker.dataset.index = String(idx);
      sticker.addEventListener("click", () => {
        const chars = cubeState.split("");
        chars[idx] = selectedColor;
        cubeState = chars.join("");
        clearSolution();
        renderCube();
        renderSetupFaceView();
        if (!faceHasNull(currentSetupFace())) {
          setSetupHint("Face complete. Press Next.");
        }
      });
      stickerElements.set(idx, sticker);
      el.appendChild(sticker);
    }
  }
}

function initPalette() {
  const order = ["N", "W", "Y", "G", "B", "R", "O"];
  for (const c of order) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "swatch";
    btn.dataset.color = c;
    btn.innerHTML = `<span class="swatch-dot" style="background:${COLOR_HEX[c]}"></span>${COLOR_NAME[c]}`;
    btn.addEventListener("click", () => {
      selectedColor = c;
      renderPalette();
    });
    paletteEl.appendChild(btn);
  }
  renderPalette();
}

function renderPalette() {
  for (const el of paletteEl.querySelectorAll(".swatch")) {
    el.classList.toggle("active", el.dataset.color === selectedColor);
  }
}

function renderCube() {
  for (let i = 0; i < cubeState.length; i += 1) {
    const sticker = stickerElements.get(i);
    if (!sticker) continue;
    sticker.style.background = COLOR_HEX[cubeState[i]];
    sticker.title = `${COLOR_NAME[cubeState[i]]} sticker`;
  }
  updateSetupButtons();
  updateDebugPanel();
}

function cubieStickersForState(state, cx, cy, cz) {
  const out = [];
  for (let i = 0; i < STICKERS.length; i += 1) {
    const s = STICKERS[i];
    if (s.x === cx && s.y === cy && s.z === cz) {
      out.push({ nx: s.nx, ny: s.ny, nz: s.nz, color: state[i] });
    }
  }
  return out;
}

function stickerTransform(nx, ny, nz) {
  if (nx === 1) return "rotateY(90deg) translateZ(27px)";
  if (nx === -1) return "rotateY(-90deg) translateZ(27px)";
  if (ny === 1) return "rotateX(90deg) translateZ(27px)";
  if (ny === -1) return "rotateX(-90deg) translateZ(27px)";
  if (nz === 1) return "translateZ(27px)";
  return "rotateY(180deg) translateZ(27px)";
}

function cubieTransform(x, y, z) {
  return `translate3d(${x * 25}px, ${-y * 25}px, ${z * 25}px)`;
}

function renderSolveCube(state) {
  solveCubeEl.innerHTML = "";
  const coreEl = document.createElement("div");
  coreEl.className = "cube-core";
  solveCubeEl.appendChild(coreEl);

  for (const coord of CUBIE_COORDS) {
    const cubieEl = document.createElement("div");
    cubieEl.className = "cubie";
    cubieEl.dataset.x = String(coord.x);
    cubieEl.dataset.y = String(coord.y);
    cubieEl.dataset.z = String(coord.z);
    cubieEl.style.transform = cubieTransform(coord.x, coord.y, coord.z);

    const stickers = cubieStickersForState(state, coord.x, coord.y, coord.z);
    for (const st of stickers) {
      const stEl = document.createElement("div");
      stEl.className = "cubie-sticker";
      stEl.style.background = COLOR_HEX[st.color];
      stEl.style.transform = stickerTransform(st.nx, st.ny, st.nz);
      cubieEl.appendChild(stEl);
    }

    solveCubeEl.appendChild(cubieEl);
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setMoveHint(text) {
  moveHintEl.textContent = text;
}

function setSetupHint(text) {
  setupHintEl.textContent = text;
}

function currentSetupFace() {
  return SETUP_FACES[currentSetupFaceIndex];
}

function renderSetupFaceView() {
  const face = currentSetupFace();
  setupCubeEl.style.setProperty("--cube-transform", SETUP_VIEW_TRANSFORMS[face]);
  solveCubeEl.style.setProperty("--cube-transform", SOLVE_VIEW_TRANSFORM);
  setupFaceLabelEl.textContent = `Face: ${SETUP_FACE_LABEL[face]}`;
  setupPrevFaceBtn.disabled = currentSetupFaceIndex <= 0;
  setupNextFaceBtn.disabled = faceHasNull(face);
}

function faceHasNull(face) {
  return FACE_TO_INDICES[face].some((idx) => cubeState[idx] === "N");
}

function nextIncompleteFaceIndex(startIdx) {
  for (let i = startIdx + 1; i < SETUP_FACES.length; i += 1) {
    if (faceHasNull(SETUP_FACES[i])) return i;
  }
  for (let i = 0; i < startIdx; i += 1) {
    if (faceHasNull(SETUP_FACES[i])) return i;
  }
  return -1;
}

function cubeHasNulls() {
  return cubeState.includes("N");
}

function cubeHasAnyColor() {
  return cubeState.includes("W")
    || cubeState.includes("Y")
    || cubeState.includes("G")
    || cubeState.includes("B")
    || cubeState.includes("R")
    || cubeState.includes("O");
}

function updateSetupButtons() {
  resetNullBtn.disabled = !cubeHasAnyColor();
  toSolveBtn.disabled = cubeHasNulls();
}

function goToNextSetupFace() {
  const face = currentSetupFace();
  if (faceHasNull(face)) {
    setSetupHint("This face still has grey stickers. Fill all 4 before Next.");
    return;
  }

  const nextIdx = nextIncompleteFaceIndex(currentSetupFaceIndex);
  if (nextIdx === -1) {
    setSetupHint("All faces complete. You can Go To Solve.");
    return;
  }
  currentSetupFaceIndex = nextIdx;
  renderSetupFaceView();
  setSetupHint("Good. Fill this face, then Next.");
}

function setStep(step) {
  if (step === "solve" && cubeHasNulls()) {
    currentStep = "setup";
    setupStageEl.classList.remove("hidden");
    setupControlsEl.classList.remove("hidden");
    solveStageEl.classList.add("hidden");
    solveControlsEl.classList.add("hidden");
    renderSetupFaceView();
    setSetupHint("Finish setup first: no grey stickers allowed before Solve.");
    setStatus("Complete all faces before entering solve mode.");
    updateSetupButtons();
    updateDebugPanel();
    return;
  }

  currentStep = step;
  const showSetup = step === "setup";
  setupStageEl.classList.toggle("hidden", !showSetup);
  setupControlsEl.classList.toggle("hidden", !showSetup);
  solveStageEl.classList.toggle("hidden", showSetup);
  solveControlsEl.classList.toggle("hidden", showSetup);

  if (!showSetup) {
    logSolveEntrySnapshot();
    if (!solutionMoves.length) {
      solveViewState = cubeState;
      renderSolveCube(solveViewState);
    }
    setStatus(solutionMoves.length ? statusEl.textContent : "Ready to solve this setup.");
    ensureSolvePrepared();
  }
  updateSetupButtons();
  updateDebugPanel();
}

function clearSolution() {
  solutionMoves = [];
  solutionStartState = "";
  stepIndex = 0;
  solveViewState = cubeState;
  renderSolveCube(solveViewState);
  setMoveHint("Solution loads automatically in this view.");
  updateStepUI();
  updateDebugPanel();
}

function randomScramble(len = 14) {
  const out = [];
  while (out.length < len) {
    const next = SOLVER_MOVES[Math.floor(Math.random() * SOLVER_MOVES.length)];
    const prev = out[out.length - 1];
    if (prev && prev[0] === next[0]) continue;
    out.push(next);
  }
  return out;
}

function validateColorCounts(state) {
  const counts = { W: 0, Y: 0, G: 0, B: 0, R: 0, O: 0 };
  for (const ch of state) {
    if (!(ch in counts)) return false;
    counts[ch] += 1;
  }
  return Object.values(counts).every((n) => n === 4);
}

function countColors(state) {
  const counts = { N: 0, W: 0, Y: 0, G: 0, B: 0, R: 0, O: 0 };
  for (const ch of state) {
    if (ch in counts) counts[ch] += 1;
  }
  return counts;
}

function faceStateMap(state) {
  const out = {};
  for (const face of FACE_ORDER) {
    out[face] = FACE_TO_INDICES[face].map((idx) => state[idx]).join("");
  }
  return out;
}

function buildDebugSnapshot() {
  return {
    step: currentStep,
    setupFace: SETUP_FACE_LABEL[currentSetupFace()] || null,
    raw: cubeState,
    faces: faceStateMap(cubeState),
    counts: countColors(cubeState),
    hasNulls: cubeHasNulls(),
  };
}

function updateDebugPanel() {
  if (!debugOutputEl) return;
  debugOutputEl.value = JSON.stringify(buildDebugSnapshot(), null, 2);
}

function setDebugVisible(visible) {
  isDebugVisible = visible;
  debugHeadEl.classList.toggle("hidden", !visible);
  debugOutputEl.classList.toggle("hidden", !visible);
  toggleDebugBtn.textContent = visible ? "Hide debug" : "Show debug";
}

function logSolveEntrySnapshot() {
  const snapshot = buildDebugSnapshot();
  console.log("[Sebi cube solver] solve entry snapshot", snapshot);
  updateDebugPanel();
}

async function buildGoalTableToDepth(targetDepth) {
  if (!goalTable) {
    goalTable = new Map();
    goalTable.set(solvedState, []);
    goalFrontier = [{ state: solvedState, path: [], lastFace: "" }];
    goalTableDepth = 0;
    goalTableReady = true;
  }
  if (goalTableDepth >= targetDepth) return;

  setStatus(
    goalTableDepth === 0
      ? `Building solver table (depth ${targetDepth})...`
      : `Extending solver table to depth ${targetDepth}...`
  );

  for (let depth = goalTableDepth; depth < targetDepth; depth += 1) {
    const nextFrontier = [];
    for (const node of goalFrontier) {
      for (const move of SOLVER_MOVES) {
        if (node.lastFace && node.lastFace === move[0]) continue;
        const nextState = applyMove(node.state, move);
        if (goalTable.has(nextState)) continue;
        const nextPath = node.path.concat(move);
        goalTable.set(nextState, nextPath);
        nextFrontier.push({ state: nextState, path: nextPath, lastFace: move[0] });
      }
    }
    goalFrontier = nextFrontier;
    goalTableDepth = depth + 1;

    // Yield between depths so UI stays responsive.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  setStatus(`Solver table ready (depth ${goalTableDepth}).`);
}

async function searchFromState(startState, maxForwardDepth, statusLabel, timeLimitMs = 0) {
  const startedAt = Date.now();
  const visited = new Set([startState]);
  let frontier = [{ state: startState, path: [], lastFace: "" }];

  for (let depth = 0; depth <= maxForwardDepth; depth += 1) {
    if (statusLabel) {
      setStatus(`${statusLabel} depth ${depth}/${maxForwardDepth}...`);
    }
    const nextFrontier = [];
    for (const node of frontier) {
      const endPath = goalTable.get(node.state);
      if (endPath) {
        return { moves: node.path.concat(invertSequence(endPath)), timedOut: false };
      }

      if (depth === maxForwardDepth) continue;
      for (const move of SOLVER_MOVES) {
        if (node.lastFace && node.lastFace === move[0]) continue;
        const nextState = applyMove(node.state, move);
        if (visited.has(nextState)) continue;
        visited.add(nextState);
        nextFrontier.push({
          state: nextState,
          path: node.path.concat(move),
          lastFace: move[0],
        });
      }
    }
    frontier = nextFrontier;

    if (timeLimitMs > 0 && Date.now() - startedAt >= timeLimitMs) {
      return { moves: null, timedOut: true };
    }

    // Yield between depths so UI stays responsive.
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return { moves: null, timedOut: false };
}

async function solveCurrentState() {
  if (cubeHasNulls()) {
    setStatus("Cannot solve yet. Fill every grey sticker first.");
    return;
  }

  if (!validateColorCounts(cubeState)) {
    const counts = countColors(cubeState);
    setStatus(
      `Need exactly 4 of each color. Current counts: W${counts.W} Y${counts.Y} G${counts.G} B${counts.B} R${counts.R} O${counts.O}.`
    );
    logSolveEntrySnapshot();
    return;
  }

  await buildGoalTableToDepth(FAST_HALF_DEPTH);

  if (cubeState === solvedState) {
    clearSolution();
    setStatus("Already solved.");
    return;
  }

  if (goalTable.has(cubeState)) {
    solutionMoves = invertSequence(goalTable.get(cubeState));
    prepareStepPlayback(cubeState);
    setStatus(`Solved in ${solutionMoves.length} move${solutionMoves.length === 1 ? "" : "s"}.`);
    return;
  }

  const fastResult = await searchFromState(cubeState, FAST_HALF_DEPTH, "Searching (fast)");
  if (fastResult.moves) {
    solutionMoves = fastResult.moves;
    prepareStepPlayback(cubeState);
    setStatus(`Solved in ${solutionMoves.length} move${solutionMoves.length === 1 ? "" : "s"} (fast).`);
    return;
  }

  await buildGoalTableToDepth(DEEP_HALF_DEPTH);
  if (goalTable.has(cubeState)) {
    solutionMoves = invertSequence(goalTable.get(cubeState));
    prepareStepPlayback(cubeState);
    setStatus(`Solved in ${solutionMoves.length} move${solutionMoves.length === 1 ? "" : "s"} (deeper table).`);
    return;
  }

  const deepResult = await searchFromState(cubeState, DEEP_HALF_DEPTH, "Searching (deeper)");
  if (deepResult.moves) {
    solutionMoves = deepResult.moves;
    prepareStepPlayback(cubeState);
    setStatus(`Solved in ${solutionMoves.length} move${solutionMoves.length === 1 ? "" : "s"} (deeper search).`);
    return;
  }

  const iterativeStart = Date.now();
  for (let depth = DEEP_HALF_DEPTH + 1; depth <= ITERATIVE_MAX_FORWARD_DEPTH; depth += 1) {
    const elapsed = Date.now() - iterativeStart;
    const remaining = ITERATIVE_TIME_LIMIT_MS - elapsed;
    if (remaining <= 0) break;
    const iterativeResult = await searchFromState(
      cubeState,
      depth,
      "Searching (iterative fallback)",
      remaining
    );
    if (iterativeResult.moves) {
      solutionMoves = iterativeResult.moves;
      prepareStepPlayback(cubeState);
      setStatus(
        `Solved in ${solutionMoves.length} move${solutionMoves.length === 1 ? "" : "s"} (iterative depth ${depth}).`
      );
      return;
    }
    if (iterativeResult.timedOut) break;
  }

  clearSolution();
  setStatus("No solution found in current depth/time limits. Verify manual sticker layout.");
  logSolveEntrySnapshot();
}

function prepareStepPlayback(startState = cubeState) {
  solutionStartState = startState;
  solveViewState = solutionStartState;
  stepIndex = 0;
  renderSolveCube(solveViewState);
  setMoveHint("Use Next and Prev to follow each move physically.");
  updateStepUI();
}

function updateStepUI() {
  const hasSteps = solutionMoves.length > 0;
  prevBtn.disabled = !hasSteps || stepIndex <= 0 || isAnimatingStep || isAutoPreparing;
  nextBtn.disabled = !hasSteps || stepIndex >= solutionMoves.length || isAnimatingStep || isAutoPreparing;

  stepsEl.innerHTML = "";
  solutionMoves.forEach((mv, idx) => {
    const li = document.createElement("li");
    li.textContent = mv;
    if (idx === stepIndex - 1) li.classList.add("active");
    stepsEl.appendChild(li);
  });
}

function moveHintText(move) {
  const faceName = { U: "top", R: "right", F: "front" }[move[0]];
  const turn =
    move.endsWith("2")
      ? "180 degrees"
      : move.endsWith("'")
      ? "counter-clockwise quarter turn"
      : "clockwise quarter turn";
  const arrow = move.endsWith("'") ? "↺" : "↻";
  return `${arrow} ${move}: Turn the ${faceName} layer ${turn}.`;
}

function layerStickerIndices(face) {
  const out = [];
  for (let i = 0; i < STICKERS.length; i += 1) {
    if (inLayer(face, STICKERS[i])) out.push(i);
  }
  return out;
}

function moveAxisAndLayer(move) {
  if (move[0] === "U") return { axis: "y", layer: 1 };
  if (move[0] === "R") return { axis: "x", layer: 1 };
  return { axis: "z", layer: 1 };
}

function moveDegrees(move) {
  const turns = move.endsWith("2") ? 2 : 1;
  const quarter = move.endsWith("'") ? -1 : 1;
  return quarter * 90 * turns;
}

function selectedCubiesForMove(move) {
  const { axis, layer } = moveAxisAndLayer(move);
  const out = [];
  for (const cubie of solveCubeEl.querySelectorAll(".cubie")) {
    const value = Number(cubie.dataset[axis]);
    if (value === layer) out.push(cubie);
  }
  return { axis, cubies: out };
}

async function animateMoveHint(move) {
  const face = move[0];
  const stickerIndices = layerStickerIndices(face);
  const duration = move.endsWith("2") ? 700 : 460;

  setMoveHint(moveHintText(move));

  for (const idx of stickerIndices) {
    const el = stickerElements.get(idx);
    if (el) el.classList.add("layer-active");
  }

  const { axis, cubies } = selectedCubiesForMove(move);
  const deg = moveDegrees(move);
  const axisToken = axis.toUpperCase();
  const layerGroup = document.createElement("div");
  layerGroup.className = "layer-group";
  solveCubeEl.appendChild(layerGroup);
  cubies.forEach((cubie) => layerGroup.appendChild(cubie));

  const animation = layerGroup.animate(
    [{ transform: `rotate${axisToken}(0deg)` }, { transform: `rotate${axisToken}(${deg}deg)` }],
    { duration, easing: "ease-in-out", fill: "forwards" }
  );
  await animation.finished.catch(() => null);
  layerGroup.remove();

  for (const idx of stickerIndices) {
    const el = stickerElements.get(idx);
    if (el) el.classList.remove("layer-active");
  }
}

async function doNextStepAnimated() {
  if (isAnimatingStep || stepIndex >= solutionMoves.length) return;
  isAnimatingStep = true;
  updateStepUI();
  try {
    const mv = solutionMoves[stepIndex];
    await animateMoveHint(mv);
    solveViewState = applyMove(solveViewState, mv);
    renderSolveCube(solveViewState);
    stepIndex += 1;
    updateStepUI();
  } finally {
    isAnimatingStep = false;
    updateStepUI();
  }
}

async function doPrevStepAnimated() {
  if (isAnimatingStep || stepIndex <= 0) return;
  isAnimatingStep = true;
  updateStepUI();
  try {
    const mv = solutionMoves[stepIndex - 1];
    const undoMove = invertMove(mv);
    await animateMoveHint(undoMove);
    solveViewState = applyMove(solveViewState, undoMove);
    renderSolveCube(solveViewState);
    stepIndex -= 1;
    updateStepUI();
    setMoveHint(`Undo ${mv}`);
  } finally {
    isAnimatingStep = false;
    updateStepUI();
  }
}

async function ensureSolvePrepared() {
  if (currentStep !== "solve" || isAutoPreparing || isAnimatingStep) return;
  if (solutionMoves.length > 0 && solutionStartState === cubeState) return;
  isAutoPreparing = true;
  updateStepUI();
  try {
    await solveCurrentState();
  } finally {
    isAutoPreparing = false;
    updateStepUI();
  }
}

function bindEvents() {
  toSolveBtn.addEventListener("click", () => setStep("solve"));
  toSetupBtn.addEventListener("click", () => {
    setStep("setup");
  });
  toggleDebugBtn.addEventListener("click", () => {
    setDebugVisible(!isDebugVisible);
  });
  copyDebugBtn.addEventListener("click", async () => {
    const text = debugOutputEl.value;
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Debug snapshot copied.");
    } catch {
      debugOutputEl.focus();
      debugOutputEl.select();
      setStatus("Select-all ready. Copy manually.");
    }
  });
  setupPrevFaceBtn.addEventListener("click", () => {
    if (currentSetupFaceIndex <= 0) return;
    currentSetupFaceIndex -= 1;
    renderSetupFaceView();
    setSetupHint("Moved to previous face.");
  });
  setupNextFaceBtn.addEventListener("click", goToNextSetupFace);

  resetNullBtn.addEventListener("click", () => {
    cubeState = STICKERS.map(() => "N").join("");
    currentSetupFaceIndex = 0;
    clearSolution();
    renderCube();
    renderSetupFaceView();
    setSetupHint("Reset to grey. Fill this face, then Next.");
    setStatus("Cube reset to null.");
  });

  solvedBtn.addEventListener("click", () => {
    cubeState = solvedState;
    clearSolution();
    renderCube();
    renderSetupFaceView();
    setSetupHint("Cube is fully colored. You can Go To Solve.");
    setStatus("Reset to solved cube.");
  });

  scrambleBtn.addEventListener("click", () => {
    const moves = randomScramble(14);
    cubeState = applyMoves(solvedState, moves);
    clearSolution();
    renderCube();
    renderSetupFaceView();
    setSetupHint("Scramble is fully colored. You can Go To Solve.");
    setStatus(`Scramble: ${moves.join(" ")}`);
  });

  prevBtn.addEventListener("click", async () => {
    await doPrevStepAnimated();
  });

  nextBtn.addEventListener("click", async () => {
    await doNextStepAnimated();
  });
}

function init() {
  initSolvedState();
  solveViewState = cubeState;
  initCubeUI();
  initPalette();
  renderSetupFaceView();
  bindEvents();
  renderCube();
  renderSolveCube(solveViewState);
  setStep(currentStep);
  setSetupHint("Fill this face, then Next.");
  setStatus("Ready.");
  updateSetupButtons();
  setDebugVisible(false);
  updateDebugPanel();
}

init();
