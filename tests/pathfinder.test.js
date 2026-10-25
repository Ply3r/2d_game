import './helpers/env.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import StandardZombie from '../models/enemies/StandardZombie.js';

const main = Main.instance();
const map = main.getMapInstance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();
const obj = (type, x, y) => ({ type, x, y, flip: false });

// Parede vertical de sacos de areia no meio da tela, com uma brecha embaixo.
const wall = () => [0.1, 0.2, 0.3, 0.4, 0.5].map((y) => ({ type: 'sandbags', x: 0.5, y, flip: false }));

const overlapsSolid = (zombie) => map.solids().some((s) => {
  const z = zombie.hitbox();
  const ox = Math.min(z.x + z.w, s.x + s.w) - Math.max(z.x, s.x);
  const oy = Math.min(z.y + z.h, s.y + s.h) - Math.max(z.y, s.y);
  return ox > 0.5 && oy > 0.5;
});

describe('pathfinder dos zumbis', () => {
  beforeEach(() => {
    enemies.reset();
    main.resetGame();
    player.invencible = true;
  });

  it('anda em linha reta quando nada atrapalha', () => {
    map.setData({ objects: [obj('crate_wood', 0.5, 0.1)] });
    const target = { x: 1000, y: 400 };
    assert.deepEqual(map.waypoint({ x: 200, y: 400 }, target, 60), target);
  });

  it('contorna um solido que bloqueia o caminho direto', () => {
    map.setData({ objects: wall() });
    const target = { x: 1100, y: 100 };
    const next = map.waypoint({ x: 150, y: 100 }, target, 60);
    assert.notDeepEqual(next, target);
    assert.ok(next.x < 524, 'o primeiro trecho para antes da parede, sem empurrar contra ela');
  });

  it('um zumbi atras da parede chega ate o jogador', () => {
    map.setData({ objects: wall() });
    const zombie = new StandardZombie({ x: 100, y: 40 });
    zombie.life = 99;
    enemies.enemies_array.push(zombie);
    player.position = { x: 1100, y: 40 };

    let reached = false;
    for (let i = 0; i < 1500 && !reached; i += 1) {
      main.update();
      reached = zombie.center().x > 800;
      assert.ok(!overlapsSolid(zombie));
    }
    assert.ok(reached, 'passou para o outro lado da parede');
  });

  it('sem caminho possivel, cai na linha reta', () => {
    const closed = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((y) => obj('sandbags', 0.5, y));
    map.setData({ objects: [...closed, ...closed.map((o) => ({ ...o, x: 0.52 }))] });
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
});
