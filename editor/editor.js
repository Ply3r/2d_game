import { CATALOG, CATEGORIES } from "../models/map/catalog.js";
import {
  parse, serialize, spriteRect, hitboxRect, footprintRect, depthSorted, objectAt, cellAt, canPlace, cellSize,
  COLS, ROWS, MAX_OBJECTS, STORAGE_KEY,
} from "../models/map/MapData.js";
import { EditorState } from "./EditorState.js";

// O editor trabalha numa tela de referencia de 1280x720 (grade de 32x18 celulas de 40 px);
// o jogo estica a mesma grade para o tamanho real da janela.
const W = 1280;
const H = 720;
const CELL = cellSize(W, H);

// Areas do jogo que o HUD ocupa (so um guia: nao ha colisao nelas).
const HUD_AREAS = [
  { label: 'HUD', x: 16, y: 16, w: 244, h: 100 },
  { label: 'HORDA', x: 440, y: 20, w: 400, h: 80 },
  { label: 'aviso', x: 400, y: 170, w: 480, h: 110 },
  { label: 'armas', x: 342, y: 582, w: 596, h: 114 },
];
const SPAWN = { label: 'início', x: 600, y: 360, w: 80, h: 80 };

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

const state = new EditorState();
const view = { tool: 'place', type: 'rock_large', mouse: null, drag: null, painting: null, erasing: false, dirty: true };
const images = {};

const image = (src) => {
  if (!images[src]) {
    images[src] = new Image();
    images[src].onload = () => { view.dirty = true; };
    images[src].src = src;
  }
  return images[src];
};
const ground = image('./assets/ground.png');

// ---------- persistencia ----------

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state.map));
    setStatus(`${state.map.objects.length} objetos · salvo`);
  } catch {
    setStatus(`${state.map.objects.length} objetos · não foi possível salvar`);
  }
}

function setStatus(text) { $('status').textContent = text; }

async function loadInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return state.reset(parse(saved));
  } catch { /* cai no mapa padrao */ }

  try {
    const response = await fetch('./assets/maps/default.json');
    if (response.ok) state.reset(parse(await response.text()));
  } catch { /* mapa vazio */ }
}

// ---------- interface ----------

function buildPalette() {
  const section = $('palette-section');

  Object.entries(CATEGORIES).forEach(([category, title]) => {
    const heading = document.createElement('h2');
    heading.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'palette';

    Object.entries(CATALOG).filter(([, def]) => def.category === category).forEach(([type, def]) => {
      const button = document.createElement('button');
      button.dataset.type = type;
      button.innerHTML = `<span class="thumb"><img src="${def.image}" alt=""></span><span>${def.label}</span>`;
      button.addEventListener('click', () => { view.type = type; setTool('place'); });
      grid.appendChild(button);
    });

    section.append(heading, grid);
    section.appendChild(document.createElement('br'));
  });
}

function setTool(tool) {
  view.tool = tool;
  refreshUI();
}

function refreshUI() {
  document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === view.tool));
  document.querySelectorAll('[data-type]').forEach((b) => b.classList.toggle('active', view.tool === 'place' && b.dataset.type === view.type));
  $('undo').disabled = !state.past.length;
  $('redo').disabled = !state.future.length;
  view.dirty = true;
}

const option = (id) => $(id).checked;

// ---------- coordenadas ----------

function stagePoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: ((event.clientX - rect.left) * W) / rect.width, y: ((event.clientY - rect.top) * H) / rect.height };
}

// Celula da base de um objeto do tipo `type` com o mouse em `point`: o mouse fica no meio da base.
function baseCell(type, point) {
  const { cells } = CATALOG[type];
  return {
    col: Math.round(point.x / CELL.w - cells.w / 2),
    row: Math.round(point.y / CELL.h - cells.h / 2),
  };
}

// ---------- acoes ----------

// record = false: o checkpoint ja foi feito no inicio da pincelada.
function placeAt(point, record = true) {
  const { col, row } = baseCell(view.type, point);
  const index = state.add(view.type, col, row, option('opt-flip'), record);
  if (index < 0 && state.map.objects.length >= MAX_OBJECTS) setStatus('Limite de objetos do mapa atingido');
  return index;
}

function eraseAt(point, record = true) {
  const index = objectAt(state.map, point.x, point.y, W, H);
  if (index >= 0) state.remove(index, record);
  return index >= 0;
}

const sameCell = (a, b) => a && b && a.col === b.col && a.row === b.row;

function onPointerDown(event) {
  const point = stagePoint(event);
  canvas.setPointerCapture(event.pointerId);

  // Apagar e colocar podem ser "pintados" arrastando, tudo numa unica acao de desfazer.
  if (event.button === 2 || (event.button === 0 && view.tool === 'erase')) {
    state.checkpoint();
    view.erasing = true;
    eraseAt(point, false);
    save(); refreshUI();
    return;
  }
  if (event.button !== 0) return;

  if (view.tool === 'place') {
    state.checkpoint();
    placeAt(point, false);
    view.painting = baseCell(view.type, point);
    save(); refreshUI();
  } else {
    const index = objectAt(state.map, point.x, point.y, W, H);
    state.selected = index;
    if (index >= 0) {
      const object = state.map.objects[index];
      const cell = cellAt(point.x, point.y, W, H) || { col: object.col, row: object.row };
      view.drag = { index, offset: { col: cell.col - object.col, row: cell.row - object.row } };
      state.beginMove();
    }
    refreshUI();
  }
}

function onPointerMove(event) {
  const point = stagePoint(event);
  view.mouse = point;
  view.dirty = true;

  if (view.drag) {
    const cell = cellAt(point.x, point.y, W, H);
    if (cell) state.moveTo(view.drag.index, cell.col - view.drag.offset.col, cell.row - view.drag.offset.row);
  } else if (view.painting) {
    const cell = baseCell(view.type, point);
    if (!sameCell(cell, view.painting)) { placeAt(point, false); view.painting = cell; }
  } else if (view.erasing) {
    eraseAt(point, false);
  }
}

// Descarta o checkpoint da pincelada se ela nao mudou nada.
function finishStroke() {
  state.endMove();
  save(); refreshUI();
}

function onPointerUp() {
  if (view.drag) { view.drag = null; finishStroke(); }
  if (view.painting) { view.painting = null; finishStroke(); }
  if (view.erasing) { view.erasing = false; finishStroke(); }
}

function onKeyDown(event) {
  if (event.target.tagName === 'INPUT' && event.target.type !== 'checkbox') return;
  const key = event.key.toLowerCase();
  const ctrl = event.ctrlKey || event.metaKey;

  if (ctrl && key === 'z') { event.preventDefault(); return (event.shiftKey ? redo() : undo()); }
  if (ctrl && key === 'y') { event.preventDefault(); return redo(); }
  if (ctrl) return;

  if (key === '1') return setTool('place');
  if (key === '2') return setTool('select');
  if (key === '3') return setTool('erase');
  if (key === 'g') { $('opt-grid').click(); return; }
  if (key === 'h') { $('opt-hitbox').click(); return; }
  if (key === 'escape') { state.selected = -1; return refreshUI(); }

  if (key === 'f') {
    if (state.selected >= 0) { state.flip(state.selected); save(); refreshUI(); } else { $('opt-flip').click(); }
    return;
  }

  if ((key === 'delete' || key === 'backspace') && state.selected >= 0) {
    event.preventDefault();
    state.remove(state.selected); save(); refreshUI();
    return;
  }

  const arrows = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
  if (arrows[key] && state.selected >= 0) {
    event.preventDefault();
    const object = state.map.objects[state.selected];
    state.checkpoint();
    state.moveTo(state.selected, object.col + arrows[key][0], object.row + arrows[key][1]);
    state.endMove();
    save(); refreshUI();
  }
}

function undo() { if (state.undo()) { save(); refreshUI(); } }
function redo() { if (state.redo()) { save(); refreshUI(); } }

function exportMap() {
  const url = URL.createObjectURL(new Blob([serialize(state.map)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mapa.json';
  link.click();
  URL.revokeObjectURL(url);
}

async function importMap(file) {
  if (!file) return;

  try {
    state.load(parse(await file.text()));
    save(); refreshUI();
  } catch (error) {
    setStatus(`Não foi possível importar: ${error.message}`);
  }
}

// ---------- desenho ----------

function drawGround() {
  const tile_w = 1152;
  const tile_h = 768;
  if (!ground.complete || !ground.naturalWidth) { ctx.fillStyle = '#d6c081'; ctx.fillRect(0, 0, W, H); return; }
  for (let y = 0; y < H; y += tile_h) for (let x = 0; x < W; x += tile_w) ctx.drawImage(ground, x, y, tile_w, tile_h);
}

function drawObject(object, alpha = 1) {
  const rect = spriteRect(object, W, H);
  const img = image(CATALOG[object.type].image);
  if (!img.complete || !img.naturalWidth) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (object.flip) { ctx.translate(rect.x + rect.w, rect.y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, rect.w, rect.h); } else { ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h); }
  ctx.restore();
}

function dashedRect(rect, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 0.12;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalAlpha = 0.9;
  ctx.font = '14px "Pixelify Sans", sans-serif';
  if (label) ctx.fillText(label, rect.x + 5, rect.y + 16);
  ctx.restore();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let col = 1; col < COLS; col += 1) { ctx.moveTo(col * CELL.w + 0.5, 0); ctx.lineTo(col * CELL.w + 0.5, H); }
  for (let row = 1; row < ROWS; row += 1) { ctx.moveTo(0, row * CELL.h + 0.5); ctx.lineTo(W, row * CELL.h + 0.5); }
  ctx.stroke();
  ctx.restore();
}

function fillRect(rect, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  drawGround();
  if (option('opt-grid')) drawGrid();

  if (option('opt-hud')) {
    HUD_AREAS.forEach((area) => dashedRect(area, '#e8453c', area.label));
    dashedRect(SPAWN, '#4aa3ff', SPAWN.label);
  }

  depthSorted(state.map.objects).forEach(({ object }) => drawObject(object));

  if (option('opt-hitbox')) {
    state.map.objects.forEach((object) => { const box = hitboxRect(object, W, H); if (box) dashedRect(box, '#ff3b3b'); });
  }

  const selected = state.map.objects[state.selected];
  if (selected) {
    const rect = spriteRect(selected, W, H);
    fillRect(footprintRect(selected, W, H), '#f2c14e', 0.25);
    ctx.save();
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
    ctx.restore();
  }

  if (view.tool === 'place' && view.mouse && !view.drag) {
    const ghost = { type: view.type, ...baseCell(view.type, view.mouse), flip: option('opt-flip') };
    const free = canPlaceGhost(ghost);
    fillRect(footprintRect(ghost, W, H), free ? '#4ade80' : '#e8453c', 0.35);
    drawObject(ghost, 0.6);
  }
}

// Decoracao pode ser trocada por cima de outra decoracao; o resto precisa de celulas livres.
function canPlaceGhost(ghost) {
  if (CATALOG[ghost.type].category !== 'decor') return canPlace(state.map, ghost);

  const decor = state.decorAt(ghost.col, ghost.row);
  return canPlace({ objects: state.map.objects.filter((_, index) => index !== decor) }, ghost);
}

function frame() {
  if (view.dirty) { view.dirty = false; draw(); }
  requestAnimationFrame(frame);
}

// ---------- inicio ----------

buildPalette();
document.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
['opt-grid', 'opt-hitbox', 'opt-hud', 'opt-flip'].forEach((id) => $(id).addEventListener('change', () => { view.dirty = true; }));
$('undo').addEventListener('click', undo);
$('redo').addEventListener('click', redo);
$('clear').addEventListener('click', () => { if (state.map.objects.length && confirm('Apagar todos os objetos do mapa?')) { state.clear(); save(); refreshUI(); } });
$('export').addEventListener('click', exportMap);
$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', (event) => { importMap(event.target.files[0]); event.target.value = ''; });

canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointerleave', () => { view.mouse = null; view.dirty = true; });
canvas.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('keydown', onKeyDown);

loadInitial().then(() => { refreshUI(); setStatus(`${state.map.objects.length} objetos`); });
refreshUI();
requestAnimationFrame(frame);

// para depuracao e testes no navegador
window.__editor = { state, view };
