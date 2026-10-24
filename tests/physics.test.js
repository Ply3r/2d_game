import './helpers/env.js';
import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import GameEvents from '../models/config/GameEvents.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import Bullet from '../models/particles/Bullet.js';
import Grenade from '../models/weapons/throable/Grenade.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();

const setup = () => {
  player.reset();
  player.position = { x: 640, y: 360 };
  enemies.reset();
  main.getItemUpdaterInstance().reset();
};
const add = (Type, x, y, life) => {
  const enemy = new Type({ x, y });
  if (life !== undefined) enemy.life = life;
  enemies.enemies_array.push(enemy);
  return enemy;
};
const tick = (n = 1) => { for (let i = 0; i < n; i += 1) main.update(); };

// sem drops aleatorios nos testes
const real_random = Math.random;
before(() => { main.gameRunning = true; Math.random = () => 0.99; });
after(() => { Math.random = real_random; });

describe('fisica de contato', () => {
  beforeEach(setup);

  it('hitbox do jogador fica centrada no sprite', () => {
    assert.deepEqual(player.hitbox(), { x: 600, y: 360, w: 80, h: 80 });
  });

  it('colide encostando pela esquerda e pela direita, com precisao de 1px', () => {
    const zombie = add(StandardZombie, 600 - 120 + 1, 360);
    assert.ok(GameEvents.checkCollision(player, zombie));
    zombie.position.x = 600 - 120 - 1;
    assert.ok(!GameEvents.checkCollision(player, zombie));
    zombie.position.x = 680 - 1;
    assert.ok(GameEvents.checkCollision(player, zombie));
    zombie.position.x = 680 + 1;
    assert.ok(!GameEvents.checkCollision(player, zombie));
  });

  for (const [sx, sy] of [[100, 360], [1100, 360], [640, -100], [640, 900]]) {
    it(`zumbi vindo de (${sx}, ${sy}) para encostando, sem entrar fundo no jogador`, () => {
      const zombie = add(StandardZombie, sx, sy, 99);
      player.invencible = true;
      tick(600);
      const pc = player.center();
      const zc = zombie.center();
      const gap_x = Math.abs(zc.x - pc.x) - (40 + 60);
      const gap_y = Math.abs(zc.y - pc.y) - (40 + 60);
      assert.ok(GameEvents.checkCollision(player, zombie), 'chegou em contato');
      assert.ok(Math.max(gap_x, gap_y) > -7, `entrou fundo: ${gap_x}, ${gap_y}`);
    });
  }

  it('zumbis da mesma direcao nao empilham', () => {
    player.invencible = true;
    const pile = [add(StandardZombie, 100, 360, 99), add(StandardZombie, 60, 365, 99), add(StandardZombie, 20, 355, 99), add(StandardZombie, -20, 360, 99)];
    tick(900);
    for (let i = 0; i < pile.length; i += 1) {
      for (let j = i + 1; j < pile.length; j += 1) {
        const a = pile[i].hitbox();
        const b = pile[j].hitbox();
        const overlap_x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlap_y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        assert.ok(Math.min(overlap_x, overlap_y) < 5, `zumbis ${i},${j} empilhados`);
      }
    }
  });

  it('zumbis criados na mesma posicao acabam em posicoes diferentes', () => {
    player.invencible = true;
    const same = [add(StandardZombie, 100, 360, 99), add(StandardZombie, 100, 360, 99), add(StandardZombie, 100, 360, 99)];
    tick(900);
    const spots = new Set(same.map((e) => `${e.position.x.toFixed(0)},${e.position.y.toFixed(0)}`));
    assert.equal(spots.size, 3);
  });

  it('zumbi morto nao machuca o jogador e conta como abate', () => {
    add(StandardZombie, 600, 360, 0);
    const life = player.life;
    tick();
    assert.equal(player.life, life);
    assert.equal(player.enemies_killed, 1);
    assert.equal(enemies.getEnemies().length, 0);
  });

  it('i-frames do jogador valem para dano repetido', () => {
    player.life = 3;
    player.getHit(1);
    player.getHit(1);
    assert.equal(player.life, 2);
  });
});

describe('bala', () => {
  beforeEach(setup);

  it('nao gera NaN quando o alvo e vertical, horizontal ou o proprio ponto', () => {
    for (const mouse of [{ x: 640, y: 100 }, { x: 640, y: 600 }, { x: 100, y: 410 }, { x: 640, y: 410 }, { x: 900, y: 200 }]) {
      const bullet = new Bullet({ start_pos: { x: 640, y: 410 }, end_pos: mouse, strength: 1 });
      assert.ok(Number.isFinite(bullet.end_pos.x) && Number.isFinite(bullet.end_pos.y), JSON.stringify(mouse));
    }
  });

  it('atinge so o inimigo mais proximo, mesmo um recem-atingido', () => {
    const near = add(StandardZombie, 700, 350, 5);
    const far = add(StandardZombie, 800, 350, 5);
    near.invencible = true;
    const bullet = new Bullet({ start_pos: { x: 640, y: 410 }, end_pos: { x: 1000, y: 410 }, strength: 2 });
    bullet.curr_pos = { x: 710, y: 405 }; // dentro dos dois
    bullet.checkColitionWithEnemies();
    assert.equal(near.life, 3);
    assert.equal(far.life, 5);
    assert.equal(bullet.visible, false);
  });

  it('em linha reta vertical chega no zumbi', () => {
    const zombie = add(StandardZombie, 580, 100, 3);
    const shot = new Bullet({ start_pos: { x: 640, y: 410 }, end_pos: { x: 640, y: 0 }, strength: 3 });
    main.getItemUpdaterInstance().create(shot);
    main.gameRunning = true;
    tick(20);
    assert.ok(zombie.life <= 0);
  });
});

describe('explosao da granada', () => {
  beforeEach(setup);

  it('acerta por hitbox, dos dois lados', () => {
    const grenade = new Grenade();
    const inner = add(StandardZombie, 800 + 250 - 5, 400, 9);   // 5px dentro do impacto
    const outer = add(StandardZombie, 800 + 250 + 1, 400, 9);   // 1px fora
    const left = add(StandardZombie, 800 - 250 - 120 + 5, 400, 9); // pela esquerda, 5px dentro
    grenade.explode({ x: 800, y: 400 });
    assert.equal(inner.life, 5);
    assert.equal(outer.life, 9);
    assert.equal(left.life, 5);
  });
});
