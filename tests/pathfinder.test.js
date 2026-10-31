import './helpers/env.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import GameEvents from '../models/config/GameEvents.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import RunningZombie from '../models/enemies/RunningZombie.js';

const main = Main.instance();
const map = main.getMapInstance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();
const obj = (type, col, row) => ({ type, col, row, flip: false });

// Parede vertical de barris na coluna `col`, nas linhas de `from` ate `to` (inclusive).
const column = (col, from, to) => Array.from({ length: to - from + 1 }, (_, i) => obj('barrel', col, from + i));

// Parede no meio da tela (coluna 16) com uma brecha de 5 celulas embaixo (linhas 13 a 17).
const wall = () => column(16, 0, 12);

const overlapsSolid = (zombie) => map.solids().some((s) => {
  const z = zombie.hitbox();
  const ox = Math.min(z.x + z.w, s.x + s.w) - Math.max(z.x, s.x);
  const oy = Math.min(z.y + z.h, s.y + s.h) - Math.max(z.y, s.y);
  return ox > 0.5 && oy > 0.5;
});

// Roda o jogo ate `done()` ou o limite de quadros; confere a cada quadro que o zumbi nao entrou em solido.
const run = (zombie, done, frames = 1500) => {
  for (let i = 0; i < frames; i += 1) {
    main.update();
    assert.ok(!overlapsSolid(zombie), `zumbi dentro de solido no quadro ${i}`);
    if (done()) return true;
  }
  return false;
};

const spawn = (Kind, x, y) => {
  const zombie = new Kind({ x, y });
  zombie.life = 99;
  enemies.enemies_array.push(zombie);
  return zombie;
};

describe('pathfinder dos zumbis', () => {
  beforeEach(() => {
    enemies.reset();
    main.resetGame();
    main.waves.timer = Infinity; // sem hordas: zumbis aleatorios se amontoando atrapalhariam o teste
    player.invencible = true;
  });

  it('anda em linha reta quando nada atrapalha', () => {
    map.setData({ objects: [obj('crate_wood', 15, 1)] });
    const target = { x: 1000, y: 400 };
    assert.deepEqual(map.waypoint({ x: 200, y: 400 }, target, 60), target);
  });

  it('contorna um solido que bloqueia o caminho direto', () => {
    map.setData({ objects: wall() });
    const target = { x: 1100, y: 100 };
    const next = map.waypoint({ x: 150, y: 100 }, target, 60);
    assert.notDeepEqual(next, target);
    assert.ok(next.x <= 640 - 60, 'o primeiro trecho para antes da parede, sem empurrar contra ela');
    assert.ok(next.y > 100, 'desce em direcao a brecha');
  });

  it('um zumbi atras da parede chega ate o jogador', () => {
    map.setData({ objects: wall() });
    const zombie = spawn(StandardZombie, 100, 40);
    player.position = { x: 1100, y: 40 };
    assert.ok(run(zombie, () => zombie.center().x > 800), 'passou para o outro lado da parede');
  });

  it('o zumbi rapido tambem contorna sem atravessar o solido', () => {
    map.setData({ objects: wall() });
    const zombie = spawn(RunningZombie, 100, 40);
    player.position = { x: 1100, y: 40 };
    assert.ok(run(zombie, () => zombie.center().x > 800, 600));
  });

  it('nao tenta passar por brecha mais estreita que o zumbi', () => {
    // brecha de 2 celulas (80 px) no meio da parede, larga o bastante para o jogador mas nao para o zumbi (120 px);
    // a passagem de verdade e embaixo
    map.setData({ objects: [...column(16, 0, 5), ...column(16, 8, 13)] });
    const zombie = spawn(StandardZombie, 100, 230);
    player.position = { x: 1100, y: 230 };
    const next = map.waypoint(zombie.center(), player.center(), 60);
    assert.ok(next.y > zombie.center().y + 20, `desce para a passagem larga (foi para y=${next.y})`);
    assert.ok(run(zombie, () => zombie.center().x > 800), 'chegou pelo caminho de baixo');
  });

  it('alcanca o jogador encostado na parede', () => {
    map.setData({ objects: wall() });
    const zombie = spawn(StandardZombie, 1000, 40);
    // jogador colado no lado esquerdo da parede (que comeca em x = 640)
    player.position = { x: 600, y: 100 };
    assert.ok(run(zombie, () => GameEvents.checkCollision(player, zombie)), 'encostou no jogador');
  });

  it('um zumbi que nasce fora da tela entra contornando o mapa', () => {
    map.setData({ objects: column(4, 0, 17) });
    const zombie = spawn(StandardZombie, -200, 300);
    player.position = { x: 700, y: 300 };
    assert.ok(run(zombie, () => zombie.center().x > 300), 'entrou na tela pelo outro lado da parede');
  });

  it('um zumbi na tela nao sai dela para contornar parede encostada na borda', () => {
    map.setData({ objects: wall() });
    const next = map.waypoint({ x: 150, y: 100 }, { x: 1100, y: 100 }, 60);
    assert.ok(next.y > 100, `foi para y=${next.y}`);
    const zombie = spawn(StandardZombie, 100, 40);
    player.position = { x: 1100, y: 40 };
    run(zombie, () => zombie.center().x > 800);
    assert.ok(zombie.center().x > 800);
  });

  it('sem caminho possivel, cai na linha reta', () => {
    map.setData({ objects: [...column(16, 0, 17), ...column(17, 0, 17)] });
    const target = { x: 1100, y: 360 };
    const next = map.waypoint({ x: 150, y: 360 }, target, 60);
    assert.ok(Number.isFinite(next.x) && Number.isFinite(next.y));
  });

  it('refaz o campo quando o mapa muda', () => {
    map.setData({ objects: wall() });
    const detour = map.waypoint({ x: 150, y: 100 }, { x: 1100, y: 100 }, 60);
    map.setData({ objects: [] });
    const target = { x: 1100, y: 100 };
    assert.deepEqual(map.waypoint({ x: 150, y: 100 }, target, 60), target);
    assert.notDeepEqual(detour, target);
  });

  it('acompanha a grade esticada numa janela maior', () => {
    window.innerWidth = 1920; window.innerHeight = 1080;
    try {
      map.setData({ objects: wall() });
      const next = map.waypoint({ x: 200, y: 150 }, { x: 1700, y: 150 }, 60);
      assert.ok(next.x <= 960 - 60 && next.y > 150, JSON.stringify(next));
    } finally {
      window.innerWidth = 1280; window.innerHeight = 720;
    }
  });
});
