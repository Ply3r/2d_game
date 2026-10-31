import { CATALOG } from "./catalog.js";

// Formato do mapa: { version, objects: [{ type, col, row, flip }] }.
// A tela e dividida numa grade fixa de COLS x ROWS celulas, esticada para o tamanho da janela;
// col e row sao a celula do canto superior esquerdo da base do objeto (CATALOG[type].cells).
// Dois solidos nunca dividem a mesma celula, e cada celula tem no maximo uma decoracao.
export const MAP_VERSION = 2;
export const COLS = 32;
export const ROWS = 18;
export const REFERENCE_CELL = 40; // 1280x720 / 32x18: o tamanho de celula para o qual os sprites foram feitos
export const MAX_OBJECTS = 500;
export const STORAGE_KEY = 'map.v1'; // mesma chave da versao 1: mapas antigos salvos sao convertidos ao ler

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const emptyMap = () => ({ version: MAP_VERSION, objects: [] });

const isInteger = (value) => Number.isInteger(value);

// Versao 1 guardava o centro do sprite em fracao da tela (x, y de 0 a 1).
// A base vai para a celula mais proxima, com o fundo dela no fundo do sprite antigo.
function fromVersion1(object) {
  if (!Number.isFinite(object.x) || !Number.isFinite(object.y)) return null;

  const { size, cells } = CATALOG[object.type];
  const center_x = object.x * COLS * REFERENCE_CELL;
  const bottom = object.y * ROWS * REFERENCE_CELL + size.y / 2;

  return {
    col: Math.round(center_x / REFERENCE_CELL - cells.w / 2),
    row: Math.round(bottom / REFERENCE_CELL) - cells.h,
  };
}

// As celulas que a base de um objeto cobre, como indices row * COLS + col.
export function cellsOf(object) {
  const { cells } = CATALOG[object.type];
  const list = [];

  for (let row = object.row; row < object.row + cells.h; row += 1) {
    for (let col = object.col; col < object.col + cells.w; col += 1) list.push(row * COLS + col);
  }

  return list;
}

const layerOf = (type) => CATALOG[type].category;

// O objeto `candidate` cabe no mapa? Ignora o objeto de indice `ignore` (o que esta sendo movido).
export function canPlace(map, candidate, ignore = -1) {
  const { cells } = CATALOG[candidate.type];
  if (candidate.col < 0 || candidate.row < 0 || candidate.col + cells.w > COLS || candidate.row + cells.h > ROWS) return false;

  const wanted = new Set(cellsOf(candidate));
  const layer = layerOf(candidate.type);

  return !map.objects.some((object, index) => (
    index !== ignore && layerOf(object.type) === layer && cellsOf(object).some((cell) => wanted.has(cell))
  ));
}

// Aceita so o que o jogo conhece: ignora tipos desconhecidos, coordenadas invalidas e sobreposicoes.
export function sanitize(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.objects)) throw new Error('Mapa inválido');

  const map = emptyMap();

  for (const object of data.objects) {
    if (map.objects.length >= MAX_OBJECTS) break;
    if (!object || !CATALOG[object.type]) continue;

    const legacy = !('col' in object) && !('row' in object);
    const position = legacy ? fromVersion1(object) : object;
    if (!position || !isInteger(position.col) || !isInteger(position.row)) continue;

    const { cells } = CATALOG[object.type];
    const clean = {
      type: object.type,
      col: clamp(position.col, 0, COLS - cells.w),
      row: clamp(position.row, 0, ROWS - cells.h),
      flip: object.flip === true,
    };

    if (canPlace(map, clean)) map.objects.push(clean);
  }

  return map;
}

export function parse(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON inválido');
  }

  return sanitize(data);
}

export const serialize = (map) => JSON.stringify(map, null, 2);

// Tamanho de uma celula, em pixels, numa tela de width x height.
export const cellSize = (width, height) => ({ w: width / COLS, h: height / ROWS });

// Celula sob o ponto (px, py), ou null fora da grade.
export function cellAt(px, py, width, height) {
  const cell = cellSize(width, height);
  const col = Math.floor(px / cell.w);
  const row = Math.floor(py / cell.h);
  if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return null;

  return { col, row };
}

// Retangulo da base do objeto, em pixels.
export function footprintRect(object, width, height) {
  const cell = cellSize(width, height);
  const { cells } = CATALOG[object.type];

  return { x: object.col * cell.w, y: object.row * cell.h, w: cells.w * cell.w, h: cells.h * cell.h };
}

// Retangulo do sprite em pixels: centrado na base, apoiado no fundo dela, na escala da celula.
export function spriteRect(object, width, height) {
  const cell = cellSize(width, height);
  const base = footprintRect(object, width, height);
  const { size } = CATALOG[object.type];
  const w = (size.x * cell.w) / REFERENCE_CELL;
  const h = (size.y * cell.h) / REFERENCE_CELL;

  return { x: base.x + (base.w - w) / 2, y: base.y + base.h - h, w, h };
}

// Hitbox em pixels: a base inteira, so para solidos.
export function hitboxRect(object, width, height) {
  if (layerOf(object.type) !== 'solid') return null;

  return footprintRect(object, width, height);
}

// Celulas bloqueadas por solidos: Uint8Array de COLS * ROWS, 1 = bloqueada.
export function blockedCells(map) {
  const blocked = new Uint8Array(COLS * ROWS);

  map.objects.forEach((object) => {
    if (layerOf(object.type) === 'solid') cellsOf(object).forEach((cell) => { blocked[cell] = 1; });
  });

  return blocked;
}

// De tras para frente: quem tem a base mais abaixo fica na frente; na mesma linha, decoracao fica atras.
export function depthSorted(objects) {
  const bottom = (object) => object.row + CATALOG[object.type].cells.h;
  const layer = (object) => (layerOf(object.type) === 'solid' ? 1 : 0);

  return objects.map((object, index) => ({ object, index, bottom: bottom(object) }))
    .sort((a, b) => a.bottom - b.bottom || layer(a.object) - layer(b.object) || a.index - b.index);
}

const inside = (px, py, rect) => px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;

// Objeto mais a frente sob o ponto (px, py), pelo sprite ou pela base; devolve o indice em map.objects ou -1.
export function objectAt(map, px, py, width, height) {
  const hits = depthSorted(map.objects).filter(({ object }) => (
    inside(px, py, spriteRect(object, width, height)) || inside(px, py, footprintRect(object, width, height))
  ));

  return hits.length ? hits[hits.length - 1].index : -1;
}
