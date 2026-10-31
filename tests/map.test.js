import { record } from './helpers/env.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Main from '../models/Main.js';
import GameMap from '../models/map/GameMap.js';
import Bullet from '../models/particles/Bullet.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import { CATALOG } from '../models/map/catalog.js';
import {
  sanitize, parse, serialize, emptyMap, spriteRect, hitboxRect, footprintRect, depthSorted, objectAt, cellAt, cellSize,
  blockedCells, MAX_OBJECTS, COLS, ROWS,
} from '../models/map/MapData.js';

const W = 1280;
const H = 720;
const obj = (type, col, row, flip = false) => ({ type, col, row, flip });
const legacy = (type, x, y, flip = false) => ({ type, x, y, flip });

describe('formato do mapa', () => {
  it('descarta tipos desconhecidos e coordenadas invalidas', () => {
    const map = sanitize({ objects: [obj('cactus', 5, 5), obj('nao_existe', 1, 1), obj('barrel', 'a', 2), obj('barrel', 1.5, 2), null, { type: 'bush' }] });
    assert.deepEqual(map.objects.map((o) => o.type), ['cactus']);
  });

  it('prende a base dentro da grade e normaliza o espelhamento', () => {
    const [bush, bags] = sanitize({ objects: [{ type: 'bush', col: 99, row: -2, flip: 'sim' }, obj('sandbags', 31, 30)] }).objects;
    assert.deepEqual(bush, { type: 'bush', col: COLS - 1, row: 0, flip: false });
    assert.deepEqual(bags, { type: 'sandbags', col: COLS - 3, row: ROWS - 1, flip: false });
  });

  it('descarta solidos sobrepostos e decoracao repetida na mesma celula', () => {
    const map = sanitize({ objects: [obj('sandbags', 4, 4), obj('cactus', 5, 4), obj('grass', 5, 4), obj('bones', 5, 4), obj('cactus', 7, 4)] });
    assert.deepEqual(map.objects.map((o) => o.type), ['sandbags', 'grass', 'cactus']);
  });

  it('limita a quantidade de objetos', () => {
    const objects = Array.from({ length: COLS * ROWS }, (_, i) => obj('grass', i % COLS, Math.floor(i / COLS)));
    assert.equal(sanitize({ objects }).objects.length, MAX_OBJECTS);
  });

  it('rejeita o que nao e um mapa', () => {
    assert.throws(() => sanitize(null), /inválido/);
    assert.throws(() => sanitize({ objects: 'x' }), /inválido/);
    assert.throws(() => parse('{ nao e json'), /JSON inválido/);
  });

  it('serializa e le de volta sem perder nada', () => {
    const map = { version: 2, objects: [obj('rock_large', 8, 12, true), obj('grass', 3, 3)] };
    assert.deepEqual(parse(serialize(map)), map);
  });

  it('converte mapas da versao 1 (fracao da tela) para a grade', () => {
    // caixa centrada no meio da tela de 1280x720: base de 2x1 com o fundo onde ficava o fundo do sprite
    const map = sanitize({ version: 1, objects: [legacy('crate_wood', 0.5, 0.5), legacy('grass', 0, 0), legacy('cactus', 1, 1, true)] });
    assert.deepEqual(map.objects, [obj('crate_wood', 15, 9), obj('grass', 0, 0), obj('cactus', COLS - 1, ROWS - 1, true)]);
  });

  it('o mapa vazio e valido', () => {
    assert.deepEqual(parse(serialize(emptyMap())), emptyMap());
  });

  it('o arquivo de mapa padrao do jogo e valido', async () => {
    const text = await readFile('assets/maps/default.json', 'utf8');
    assert.doesNotThrow(() => parse(text));
  });

  it('todos os sprites do catalogo existem', async () => {
    for (const [type, definition] of Object.entries(CATALOG)) {
      await assert.doesNotReject(readFile(definition.image), type);
    }
  });
});

describe('geometria dos objetos', () => {
  it('a grade divide a tela em celulas iguais', () => {
    assert.deepEqual(cellSize(W, H), { w: 40, h: 40 });
    assert.deepEqual(cellAt(0, 0, W, H), { col: 0, row: 0 });
    assert.deepEqual(cellAt(639, 361, W, H), { col: 15, row: 9 });
    assert.equal(cellAt(-1, 10, W, H), null);
    assert.equal(cellAt(W, 10, W, H), null);
  });

  it('o sprite fica centrado na base e apoiado no fundo dela', () => {
    assert.deepEqual(footprintRect(obj('crate_wood', 15, 9), W, H), { x: 600, y: 360, w: 80, h: 40 });
    assert.deepEqual(spriteRect(obj('crate_wood', 15, 9), W, H), { x: 608, y: 336, w: 64, h: 64 });
  });

  it('so solidos tem hitbox, e ela e a base em celulas inteiras', () => {
    for (const [type, definition] of Object.entries(CATALOG)) {
      const box = hitboxRect(obj(type, 5, 5), W, H);
      if (definition.category === 'decor') { assert.equal(box, null, type); continue; }
      assert.deepEqual(box, { x: 200, y: 200, w: definition.cells.w * 40, h: definition.cells.h * 40 }, type);
    }
  });

  it('as celulas bloqueadas sao as bases dos solidos', () => {
    const blocked = blockedCells({ objects: [obj('sandbags', 2, 1), obj('bush', 10, 10)] });
    const list = [...blocked.keys()].filter((i) => blocked[i]);
    assert.deepEqual(list, [COLS + 2, COLS + 3, COLS + 4]);
  });

  it('desenha de tras para frente: quem tem a base mais baixa fica na frente', () => {
    const objects = [obj('barrel', 5, 14), obj('barrel', 5, 3), obj('grass', 6, 3)];
    assert.deepEqual(depthSorted(objects).map((entry) => entry.index), [2, 1, 0]);
  });

  it('objectAt acha o objeto da frente e -1 fora de tudo', () => {
    const map = { objects: [obj('crate_wood', 15, 9), obj('crate_wood', 15, 10)] };
    assert.equal(objectAt(map, 640, 405, W, H), 1);
    assert.equal(objectAt(map, 640, 345, W, H), 0);
    assert.equal(objectAt(map, 10, 10, W, H), -1);
  });

  it('o sprite cresce junto com a celula em janelas maiores', () => {
    assert.deepEqual(spriteRect(obj('crate_wood', 15, 9), 1920, 1080), { x: 912, y: 504, w: 96, h: 96 });
  });
});

describe('mapa dentro do jogo', () => {
  const main = Main.instance();
  const player = main.getPlayerInstance();
  const map = main.getMapInstance();

  beforeEach(() => {
    main.gameRunning = true;
    main.resetGame();
    map.setData(emptyMap());
    player.position = { x: 640, y: 360 };
  });

  it('solidos bloqueiam e decoracao nao', () => {
    map.setData({ objects: [obj('crate_wood', 15, 8), obj('bush', 5, 4), obj('grass', 25, 14)] });
    assert.equal(map.solids().length, 1);
    assert.deepEqual(map.solids()[0], { x: 600, y: 320, w: 80, h: 40 });
    assert.ok(map.blocks({ x: 620, y: 340, w: 5, h: 5 }));
    assert.ok(!map.blocks({ x: 0.2 * W, y: 0.2 * H, w: 5, h: 5 }));
  });

  it('empurra o jogador para fora do solido', () => {
    map.setData({ objects: [obj('crate_wood', 15, 8)] });
    player.position = { x: 640, y: 340 };    // dentro da caixa
    map.resolveCollisions([player]);
    const box = player.hitbox();
    const crate = map.solids()[0];
    assert.ok(box.x + box.w <= crate.x + 1e-9 || box.x >= crate.x + crate.w - 1e-9 || box.y + box.h <= crate.y + 1e-9 || box.y >= crate.y + crate.h - 1e-9);
  });

  it('o update do jogo mantem jogador e zumbis fora dos solidos', () => {
    map.setData({ objects: [obj('sandbags', 15, 8)] });
    const zombie = new StandardZombie({ x: 100, y: 330 });
    zombie.life = 99;
    main.getEnemiesInstance().enemies_array.push(zombie);
    player.invencible = true;
    player.position = { x: 1100, y: 340 };
    for (let i = 0; i < 400; i += 1) main.update();
    const wall = map.solids()[0];
    const z = zombie.hitbox();
    const overlap_x = Math.min(z.x + z.w, wall.x + wall.w) - Math.max(z.x, wall.x);
    const overlap_y = Math.min(z.y + z.h, wall.y + wall.h) - Math.max(z.y, wall.y);
    assert.ok(!(overlap_x > 0.5 && overlap_y > 0.5));
  });

  it('recalcula as hitboxes quando a janela muda de tamanho', () => {
    map.setData({ objects: [obj('crate_wood', 15, 8)] });
    assert.equal(map.solids()[0].x, 600);
    window.innerWidth = 1920; window.innerHeight = 1080;
    try {
      assert.equal(map.solids()[0].x, 900);
    } finally {
      window.innerWidth = 1280; window.innerHeight = 720;
    }
  });

  it('a bala some ao bater num solido', () => {
    map.setData({ objects: [obj('crate_wood', 15, 8)] });
    const bullet = new Bullet({ start_pos: { x: 400, y: 350 }, end_pos: { x: 1200, y: 350 }, strength: 1 });
    for (let i = 0; i < 20 && bullet.visible; i += 1) bullet.update();
    assert.equal(bullet.visible, false);
    assert.ok(bullet.curr_pos.x < 700, `parou em x=${bullet.curr_pos.x}`);
  });

  it('a bala nao atravessa objeto fino de nenhum lado', () => {
    map.setData({ objects: [obj('sandbags', 15, 8)] });
    const wall = map.solids()[0];
    const shoot = (from, to) => {
      const bullet = new Bullet({ start_pos: from, end_pos: to, strength: 1 });
      for (let i = 0; i < 60 && bullet.visible; i += 1) bullet.update();
      return bullet.visible;
    };
    const mid_x = wall.x + wall.w / 2;
    for (let offset = 0; offset < 50; offset += 5) {
      assert.equal(shoot({ x: mid_x, y: wall.y - 12 - offset }, { x: mid_x, y: 700 }), false, `de cima +${offset}`);
      assert.equal(shoot({ x: mid_x, y: wall.y + wall.h + 2 + offset }, { x: mid_x, y: 0 }), false, `de baixo +${offset}`);
    }
  });

  it('a bala passa direto por decoracao', () => {
    map.setData({ objects: [obj('bush', 15, 8)] });
    const bullet = new Bullet({ start_pos: { x: 400, y: 350 }, end_pos: { x: 1200, y: 350 }, strength: 1 });
    for (let i = 0; i < 5; i += 1) bullet.update();
    assert.equal(bullet.visible, true);
  });

  it('o airdrop nao pousa em cima de objetos', () => {
    // parede de caixas cobrindo toda a faixa da esquerda da tela
    const objects = [];
    for (let row = 2; row < 16; row += 1) for (let col = 0; col < 14; col += 2) objects.push(obj('crate_wood', col, row));
    map.setData({ objects });
    const airdrops = main.getAirdropsInstance();
    for (let i = 0; i < 60; i += 1) {
      airdrops.reset();
      const { landing } = airdrops.spawn();
      assert.ok(!map.blocks({ x: landing.x, y: landing.y, w: 64, h: 64 }), JSON.stringify(landing));
    }
  });
});

describe('profundidade no jogo', () => {
  const main = Main.instance();
  const player = main.getPlayerInstance();
  const map = main.getMapInstance();

  // Ordem das chamadas de drawImage: 'cacto' (sprite do cacto, 48 px) ou 'jogador' (recorte do spritesheet, 9 argumentos).
  const order = () => record(() => main.drawWorld())
    .filter((c) => c[0] === 'drawImage')
    .map((c) => (c.length === 10 ? 'jogador' : c[4] === 48 ? 'cacto' : 'outro'))
    .filter((name) => name !== 'outro');

  beforeEach(() => {
    main.resetGame();
    main.getEnemiesInstance().reset();
    map.setData({ objects: [obj('cactus', 15, 8), obj('grass', 3, 3)] });   // base do cacto: y de 320 a 360
  });

  it('o jogador atras do cacto fica escondido por ele', () => {
    player.position = { x: 620, y: 230 };   // pes em y = 310, acima da base
    assert.deepEqual(order(), ['jogador', 'cacto']);
  });

  it('o jogador na frente do cacto fica por cima', () => {
    player.position = { x: 620, y: 300 };   // pes em y = 380, abaixo da base
    assert.deepEqual(order(), ['cacto', 'jogador']);
  });

  it('a decoracao fica no chao, fora da ordenacao', () => {
    assert.equal(map.solidDrawables().length, 1);
    const calls = record(() => map.drawDecor()).filter((c) => c[0] === 'drawImage');
    assert.equal(calls.length, 1);
  });
});

describe('carregar o mapa', () => {
  const saved_storage = globalThis.localStorage;
  const saved_fetch = globalThis.fetch;
  const restore = () => { globalThis.localStorage = saved_storage; globalThis.fetch = saved_fetch; };

  it('usa o mapa salvo pelo editor', async () => {
    globalThis.localStorage = { getItem: () => serialize({ version: 1, objects: [legacy('cactus', 0.1, 0.1)] }) };
    globalThis.fetch = async () => { throw new Error('nao devia buscar o padrao'); };
    const map = new GameMap();
    try { await map.load(); } finally { restore(); }
    assert.equal(map.data.objects.length, 1);
  });

  it('sem mapa salvo, usa o padrao do jogo', async () => {
    globalThis.localStorage = { getItem: () => null };
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ objects: [obj('barrel', 9, 5), obj('bush', 12, 7)] }) });
    const map = new GameMap();
    try { await map.load(); } finally { restore(); }
    assert.equal(map.data.objects.length, 2);
  });

  it('mapa salvo corrompido cai no padrao e erro de rede deixa o mapa vazio', async () => {
    globalThis.localStorage = { getItem: () => '{ quebrado' };
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ objects: [obj('barrel', 9, 5)] }) });
    const first = new GameMap();
    try { await first.load(); } finally { restore(); }
    assert.equal(first.data.objects.length, 1);

    globalThis.localStorage = { getItem: () => null };
    globalThis.fetch = async () => { throw new Error('offline'); };
    const second = new GameMap();
    try { await second.load(); } finally { restore(); }
    assert.equal(second.data.objects.length, 0);
  });
});

describe('mapa nas telas de menu e game over', () => {
  const main = Main.instance();
  const map = main.getMapInstance();

  const frames = async (game_over) => {
    let loop;
    globalThis.requestAnimationFrame = (fn) => { loop = fn; };
    globalThis.performance = { now: () => 1000 };
    main.gameRunning = false;
    main.gameOver = game_over;
    main.screen = null;
    main.screenInstance = null;
    map.setData({ objects: [obj('crate_wood', 15, 8), obj('bush', 5, 4)] });
    main.start();
    return record(() => loop(1000));
  };

  it('o menu mostra o mapa por tras do texto', async () => {
    const calls = await frames(false);
    const images = calls.filter((c) => c[0] === 'drawImage');
    assert.equal(images.length, 2);
    assert.ok(images.some((c) => c[2] === 608 && c[3] === 296 && c[4] === 64), 'caixa na posicao do mapa');
    assert.ok(calls.findIndex((c) => c[0] === 'fillText') > calls.findIndex((c) => c[0] === 'drawImage'), 'texto por cima');
  });

  it('o game over tambem mostra o mapa', async () => {
    const calls = await frames(true);
    assert.equal(calls.filter((c) => c[0] === 'drawImage').length, 2);
  });
});
