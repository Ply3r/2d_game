import { emptyMap, sanitize, MAX_OBJECTS } from "../models/map/MapData.js";

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

  // Devolve o indice do novo objeto, ou -1 se o mapa ja estiver cheio.
  // record = false agrupa varios objetos numa so acao de desfazer (ex.: pintar mato arrastando).
  add(type, x, y, flip = false, record = true) {
    if (this.map.objects.length >= MAX_OBJECTS) return -1;

    if (record) this.checkpoint();
    this.map.objects.push({ type, x, y, flip });
    this.selected = this.map.objects.length - 1;
    return this.selected;
  }

  remove(index) {
    if (!this.map.objects[index]) return false;

    this.checkpoint();
    this.map.objects.splice(index, 1);
    this.selected = -1;
    return true;
  }

  // Arrastar: um unico checkpoint no inicio (beginMove) e varias chamadas de moveTo.
  beginMove() {
    this.checkpoint();
  }

  moveTo(index, x, y) {
    const object = this.map.objects[index];
    if (!object) return;

    object.x = Math.min(1, Math.max(0, x));
    object.y = Math.min(1, Math.max(0, y));
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

// Alinha o ponto (em pixels) a uma grade; grid 0 desliga.
export function snap(value, grid) {
  return grid > 0 ? Math.round(value / grid) * grid : value;
}
