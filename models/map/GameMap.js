import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
import GameEvents from "../config/GameEvents.js";
import { CATALOG } from "./catalog.js";
import { emptyMap, sanitize, parse, depthSorted, hitboxRect, spriteRect, STORAGE_KEY } from "./MapData.js";

const DEFAULT_MAP_URL = './assets/maps/default.json';

// O mapa dentro do jogo: desenha os objetos, bloqueia jogador, inimigos e balas nos solidos.
class GameMap {
  constructor() {
    this.data = emptyMap();
    this.cache = null;
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

  // Hitboxes dos solidos na tela atual (recalculadas so se a janela mudar de tamanho).
  solids() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (!this.cache || this.cache.width !== width || this.cache.height !== height) {
      const rects = this.data.objects.map((object) => hitboxRect(object, width, height)).filter(Boolean);
      this.cache = { width, height, rects };
    }

    return this.cache.rects;
  }

  blocks(rect) {
    return this.solids().some((solid) => GameEvents.rectsOverlap(solid, rect));
  }

  // Empurra para fora dos solidos tudo que tem position e hitbox().
  resolveCollisions(bodies) {
    this.solids().forEach((solid) => bodies.forEach((body) => GameEvents.pushOut(body, solid)));
  }

  draw() {
    const drawer = Canvas.drawer();
    const width = window.innerWidth;
    const height = window.innerHeight;

    drawer.save();
    drawer.imageSmoothingEnabled = false;

    depthSorted(this.data.objects, width, height).forEach(({ object }) => {
      const rect = spriteRect(object, width, height);
      const image = Images.get(CATALOG[object.type].image);

      if (!object.flip) return drawer.drawImage(image, rect.x, rect.y, rect.w, rect.h);

      drawer.save();
      drawer.translate(rect.x + rect.w, rect.y);
      drawer.scale(-1, 1);
      drawer.drawImage(image, 0, 0, rect.w, rect.h);
      drawer.restore();
    });

    drawer.restore();
  }
}

export default GameMap;
