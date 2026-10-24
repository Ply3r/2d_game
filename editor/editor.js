import { CATALOG, CATEGORIES } from "../models/map/catalog.js";
import { emptyMap, parse, serialize, spriteRect, hitboxRect, depthSorted, objectAt, STORAGE_KEY } from "../models/map/MapData.js";
import { EditorState, snap } from "./EditorState.js";

// O editor trabalha numa tela de referencia de 1280x720; o jogo reescala as posicoes (em fracao)
// para o tamanho real da janela.
const W = 1280;
const H = 720;
const GRID = 16;
const PAINT_SPACING = 30;

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
const view = { tool: 'place', type: 'rock_large', mouse: null, drag: null, painting: null, dirty: true };
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

const gridSize = () => (option('opt-grid') ? GRID : 0);
const snapped = (point) => ({ x: snap(point.x, gridSize()), y: snap(point.y, gridSize()) });
const toFraction = (point) => ({ x: point.x / W, y: point.y / H });

// ---------- acoes ----------

function placeAt(point, record = true) {
  const { x, y } = toFraction(snapped(point));
  const index = state.add(view.type, x, y, option('opt-flip'), record);
  if (index < 0) setStatus('Limite de objetos do mapa atingido');
  return index;
}

function eraseAt(point) {
  const index = objectAt(state.map, point.x, point.y, W, H);
  if (index >= 0) state.remove(index);
  return index >= 0;
}

function onPointerDown(event) {
  const point = stagePoint(event);
  canvas.setPointerCapture(event.pointerId);

  if (event.button === 2) { if (eraseAt(point)) { save(); refreshUI(); } return; }
  if (event.button !== 0) return;

  if (view.tool === 'erase') {
    if (eraseAt(point)) { save(); refreshUI(); }
  } else if (view.tool === 'place') {
    if (placeAt(point) < 0) return;
    // decoracao pode ser "pintada" arrastando, tudo numa unica acao de desfazer
    if (CATALOG[view.type].category === 'decor') view.painting = point;
    save(); refreshUI();
  } else {
    const index = objectAt(state.map, point.x, point.y, W, H);
    state.selected = index;
    if (index >= 0) {
      const object = state.map.objects[index];
      view.drag = { index, offset: { x: point.x - object.x * W, y: point.y - object.y * H } };
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
    const target = snapped({ x: point.x - view.drag.offset.x, y: point.y - view.drag.offset.y });
    const { x, y } = toFraction(target);
    state.moveTo(view.drag.index, x, y);
  } else if (view.painting && Math.hypot(point.x - view.painting.x, point.y - view.painting.y) >= PAINT_SPACING) {
    placeAt(point, false);
    view.painting = point;
  }
}

function onPointerUp() {
  if (view.drag) { state.endMove(); view.drag = null; save(); refreshUI(); }
  if (view.painting) { view.painting = null; save(); refreshUI(); }
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
    const step = gridSize() || 4;
    const object = state.map.objects[state.selected];
    state.checkpoint();
    state.moveTo(state.selected, object.x + (arrows[key][0] * step) / W, object.y + (arrows[key][1] * step) / H);
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

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  drawGround();

  if (option('opt-hud')) {
    HUD_AREAS.forEach((area) => dashedRect(area, '#e8453c', area.label));
    dashedRect(SPAWN, '#4aa3ff', SPAWN.label);
  }

  depthSorted(state.map.objects, W, H).forEach(({ object }) => drawObject(object));

  if (option('opt-hitbox')) {
    state.map.objects.forEach((object) => { const box = hitboxRect(object, W, H); if (box) dashedRect(box, '#ff3b3b'); });
  }

  const selected = state.map.objects[state.selected];
  if (selected) {
    const rect = spriteRect(selected, W, H);
    ctx.save();
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
    ctx.restore();
  }

  if (view.tool === 'place' && view.mouse && !view.drag) {
    const { x, y } = toFraction(snapped(view.mouse));
    const ghost = { type: view.type, x, y, flip: option('opt-flip') };
    drawObject(ghost, 0.6);
    const box = hitboxRect(ghost, W, H);
    if (box) dashedRect(box, '#ffffff');
  }
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
