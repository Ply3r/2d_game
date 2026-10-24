import { CATALOG } from "./catalog.js";

// Formato do mapa: { version, objects: [{ type, x, y, flip }] }. x e y sao o centro do objeto
// em fracao da tela (0 a 1), para o mapa servir em qualquer tamanho de janela.
export const MAP_VERSION = 1;
export const MAX_OBJECTS = 500;
export const STORAGE_KEY = 'map.v1';

const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const emptyMap = () => ({ version: MAP_VERSION, objects: [] });

// Aceita so o que o jogo conhece: ignora tipos desconhecidos e coordenadas invalidas.
export function sanitize(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.objects)) throw new Error('Mapa inválido');

  const objects = data.objects
    .filter((object) => object && CATALOG[object.type] && Number.isFinite(object.x) && Number.isFinite(object.y))
    .slice(0, MAX_OBJECTS)
    .map((object) => ({ type: object.type, x: clamp01(object.x), y: clamp01(object.y), flip: object.flip === true }));

  return { version: MAP_VERSION, objects };
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

// Retangulo do sprite em pixels, numa tela de width x height.
export function spriteRect(object, width, height) {
  const { size } = CATALOG[object.type];
  return { x: object.x * width - size.x / 2, y: object.y * height - size.y / 2, w: size.x, h: size.y };
}

// Hitbox em pixels (so para solidos); espelhar o objeto espelha a hitbox junto.
export function hitboxRect(object, width, height) {
  const definition = CATALOG[object.type];
  if (definition.category !== 'solid') return null;

  const sprite = spriteRect(object, width, height);
  const { hitbox, size } = definition;
  const x = object.flip ? size.x - hitbox.x - hitbox.w : hitbox.x;

  return { x: sprite.x + x, y: sprite.y + hitbox.y, w: hitbox.w, h: hitbox.h };
}

// De tras para frente: quem tem a base mais abaixo na tela fica na frente.
export function depthSorted(objects, width, height) {
  const bottom = (object) => spriteRect(object, width, height).y + CATALOG[object.type].size.y;
  return objects.map((object, index) => ({ object, index, bottom: bottom(object) }))
    .sort((a, b) => a.bottom - b.bottom || a.index - b.index);
}

// Objeto mais a frente sob o ponto (px, py); devolve o indice em map.objects ou -1.
export function objectAt(map, px, py, width, height) {
  const hits = depthSorted(map.objects, width, height).filter(({ object }) => {
    const rect = spriteRect(object, width, height);
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  });

  return hits.length ? hits[hits.length - 1].index : -1;
}
