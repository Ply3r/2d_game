import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
import GameEvents from "../config/GameEvents.js";
import Pathfinder from "./Pathfinder.js";
import { CATALOG } from "./catalog.js";
import { emptyMap, sanitize, parse, depthSorted, hitboxRect, spriteRect, footprintRect, blockedCells, cellSize, COLS, ROWS, STORAGE_KEY } from "./MapData.js";

const DEFAULT_MAP_URL = './assets/maps/default.json';

// O mapa dentro do jogo: desenha os objetos, bloqueia jogador, inimigos e balas nos solidos.
class GameMap {
  constructor() {
    this.data = emptyMap();
    this.cache = null;
    this.pathfinder = new Pathfinder();
  }

  setData(map) {
    this.data = sanitize(map);
    this.cache = null;
  }

  // O mapa salvo pelo editor neste navegador tem prioridade; senao usa assets/maps/default.json.
  async load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return this.setData(parse(saved));
    } catch { /* sem localStorage ou mapa salvo invalido: cai no padrao */ }

    try {
      const response = await fetch(DEFAULT_MAP_URL);
      if (response.ok) this.setData(await response.json());
    } catch { /* sem mapa padrao: fica vazio */ }
  }

  // Hitboxes dos solidos e grade de navegacao na tela atual (recalculadas so se a janela mudar de tamanho).
  current() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (!this.cache || this.cache.width !== width || this.cache.height !== height) {
      const rects = this.data.objects.map((object) => hitboxRect(object, width, height)).filter(Boolean);
      const cell = cellSize(width, height);
      const grid = { cols: COLS, rows: ROWS, cell_w: cell.w, cell_h: cell.h, blocked: blockedCells(this.data) };
      this.cache = { width, height, rects, grid };
    }

    return this.cache;
  }

  solids() {
    return this.current().rects;
  }

  grid() {
    return this.current().grid;
  }

  blocks(rect) {
    return this.solids().some((solid) => GameEvents.rectsOverlap(solid, rect));
  }

  // Ponto para onde um corpo de raio `radius` centrado em `from` deve andar para chegar em `target` sem bater nos solidos.
  waypoint(from, target, radius) {
    return this.pathfinder.waypoint(from, target, radius, this.grid());
  }

  // Empurra para fora dos solidos tudo que tem position e hitbox().
  resolveCollisions(bodies) {
    this.solids().forEach((solid) => bodies.forEach((body) => GameEvents.pushOut(body, solid)));
  }

  // Menu e game over: o mapa inteiro de uma vez.
  draw() {
    depthSorted(this.data.objects).forEach(({ object }) => this.drawObject(object));
  }

  // Durante o jogo a decoracao fica no chao, embaixo de tudo...
  drawDecor() {
    depthSorted(this.data.objects).forEach(({ object }) => {
      if (CATALOG[object.type].category === 'decor') this.drawObject(object);
    });
  }

  // ...e os solidos entram na ordenacao por profundidade junto com jogador e zumbis (ver Main.drawWorld):
  // { bottom, draw }, onde bottom e o fundo da base em pixels.
  solidDrawables() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    return this.data.objects
      .filter((object) => CATALOG[object.type].category === 'solid')
      .map((object) => {
        const base = footprintRect(object, width, height);
        return { bottom: base.y + base.h, draw: () => this.drawObject(object) };
      });
  }

  drawObject(object) {
    const drawer = Canvas.drawer();
    const rect = spriteRect(object, window.innerWidth, window.innerHeight);
    const image = Images.get(CATALOG[object.type].image);

    drawer.save();
    drawer.imageSmoothingEnabled = false;

    if (object.flip) {
      drawer.translate(rect.x + rect.w, rect.y);
      drawer.scale(-1, 1);
      drawer.drawImage(image, 0, 0, rect.w, rect.h);
    } else {
      drawer.drawImage(image, rect.x, rect.y, rect.w, rect.h);
    }

    drawer.restore();
  }
}

export default GameMap;
