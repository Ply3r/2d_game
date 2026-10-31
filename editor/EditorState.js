import { CATALOG } from "../models/map/catalog.js";
import { emptyMap, sanitize, canPlace, cellsOf, COLS, ROWS, MAX_OBJECTS } from "../models/map/MapData.js";

const MAX_HISTORY = 100;

// Estado do editor sem nada de DOM: o mapa, o objeto selecionado e o historico (desfazer/refazer).
// Toda acao que o usuario faz chama checkpoint() antes de mudar, guardando um retrato do mapa.
export class EditorState {
  constructor(map = emptyMap()) {
    this.map = sanitize(map);
    this.selected = -1;
    this.past = [];
    this.future = [];
  }

  snapshot() {
    return JSON.stringify(this.map);
  }

  checkpoint() {
    this.past.push(this.snapshot());
    if (this.past.length > MAX_HISTORY) this.past.shift();
    this.future = [];
  }

  restore(snapshot) {
    this.map = JSON.parse(snapshot);
    this.selected = -1;
  }

  undo() {
    if (!this.past.length) return false;

    this.future.push(this.snapshot());
    this.restore(this.past.pop());
    return true;
  }

  redo() {
    if (!this.future.length) return false;

    this.past.push(this.snapshot());
    this.restore(this.future.pop());
    return true;
  }

  // Devolve o indice do novo objeto, ou -1 se o mapa estiver cheio ou as celulas ja estiverem ocupadas.
  // Decoracao nova substitui a decoracao que estiver na mesma celula.
  // record = false agrupa varios objetos numa so acao de desfazer (ex.: pintar mato arrastando).
  add(type, col, row, flip = false, record = true) {
    const object = { type, col, row, flip };
    const replaced = CATALOG[type].category === 'decor' ? this.decorAt(col, row) : -1;
    const others = replaced >= 0 ? { objects: this.map.objects.filter((_, index) => index !== replaced) } : this.map;

    if (!canPlace(others, object)) return -1;
    if (replaced < 0 && this.map.objects.length >= MAX_OBJECTS) return -1;
    if (replaced >= 0 && this.map.objects[replaced].type === type && this.map.objects[replaced].flip === flip) return -1;

    if (record) this.checkpoint();
    if (replaced >= 0) this.map.objects.splice(replaced, 1);
    this.map.objects.push(object);
    this.selected = this.map.objects.length - 1;
    return this.selected;
  }

  decorAt(col, row) {
    const cell = row * COLS + col;
    return this.map.objects.findIndex((object) => CATALOG[object.type].category === 'decor' && cellsOf(object).includes(cell));
  }

  remove(index, record = true) {
    if (!this.map.objects[index]) return false;

    if (record) this.checkpoint();
    this.map.objects.splice(index, 1);
    this.selected = -1;
    return true;
  }

  // Arrastar: um unico checkpoint no inicio (beginMove) e varias chamadas de moveTo.
  beginMove() {
    this.checkpoint();
  }

  // Leva a base para (col, row), presa dentro da grade; se as celulas estiverem ocupadas, nao mexe.
  moveTo(index, col, row) {
    const object = this.map.objects[index];
    if (!object) return false;

    const { cells } = CATALOG[object.type];
    const target = {
      ...object,
      col: Math.min(COLS - cells.w, Math.max(0, col)),
      row: Math.min(ROWS - cells.h, Math.max(0, row)),
    };
    if (!canPlace(this.map, target, index)) return false;

    object.col = target.col;
    object.row = target.row;
    return true;
  }

  // Se nada mudou de fato (clique sem arrastar), descarta o checkpoint do beginMove.
  endMove() {
    if (this.past.length && this.past[this.past.length - 1] === this.snapshot()) this.past.pop();
  }

  flip(index) {
    const object = this.map.objects[index];
    if (!object) return false;

    this.checkpoint();
    object.flip = !object.flip;
    return true;
  }

  clear() {
    if (!this.map.objects.length) return;

    this.checkpoint();
    this.map = emptyMap();
    this.selected = -1;
  }

  // Troca o mapa sem mexer no historico (carga inicial).
  reset(map) {
    this.map = sanitize(map);
    this.selected = -1;
    this.past = [];
    this.future = [];
  }

  load(map) {
    this.checkpoint();
    this.map = sanitize(map);
    this.selected = -1;
  }
}
