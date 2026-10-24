import { record } from './helpers/env.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import Knife from '../models/weapons/melee/Knife.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();
const DIRECTIONS = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] };

const setup = () => {
  player.reset();
  player.position = { x: 640, y: 360 };
  enemies.reset();
  main.getItemUpdaterInstance().reset();
};
const add = (x, y) => {
  const enemy = new StandardZombie({ x, y });
  enemy.life = 3;
  enemies.enemies_array.push(enemy);
  return enemy;
};
const touches = (a, b) => !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);

describe('faca', () => {
  beforeEach(setup);

  it('calcula a direcao do ataque pelo eixo dominante da mira', () => {
    const knife = new Knife();
    assert.equal(knife.getAttackDirection({ x: 640, y: 0 }), 'top');
    assert.equal(knife.getAttackDirection({ x: 640, y: 700 }), 'bottom');
    assert.equal(knife.getAttackDirection({ x: 0, y: 360 }), 'left');
    assert.equal(knife.getAttackDirection({ x: 1200, y: 400 }), 'right');
  });

  it('a area desenhada tem tamanho fixo e o sprite fica centrado nela', () => {
    const knife = new Knife();
    const mouse = { x: 900, y: 380 };
    knife.attack(player.position, mouse);
    const area = knife.getAttackArea('right');
    const calls = record(() => knife.draw(player.position, mouse));
    const transform = calls.find((c) => c[0] === 'setTransform');
    const image = calls.find((c) => c[0] === 'drawImage');
    assert.deepEqual([transform[5], transform[6]], [area.x + area.w / 2, area.y + area.h / 2]);
    assert.deepEqual([image[2], image[3], image[4], image[5]], [-area.w / 2, -area.h / 2, area.w, area.h]);
    for (const dir of Object.keys(DIRECTIONS)) {
      const a = knife.getAttackArea(dir);
      assert.ok(a.w === 350 && a.h === 350);
    }
  });

  it('acerta quem toca a faixa do golpe e ignora o resto do sprite', () => {
    const knife = new Knife();
    const area = knife.getHitArea('right');
    const edge = add(area.x + area.w - 10, 300);   // 10px dentro da faixa
    const outside = add(640 + 350 - 10, 300);      // dentro do quadrado do sprite, fora do golpe
    const behind = add(640 - 200, 300);
    knife.attack(player.position, { x: 900, y: 380 });
    assert.equal(edge.life, 2);
    assert.equal(outside.life, 3);
    assert.equal(behind.life, 3);
  });

  for (const [dir, [dx, dy]] of Object.entries(DIRECTIONS)) {
    describe(`faixa de acerto: ${dir}`, () => {
      const knife = new Knife();
      const hits = (x, y) => touches({ x: x - 20, y: y - 20, w: 40, h: 40 }, knife.getHitArea(dir));
      const c = () => player.center();

      it('acerta perto e no crescente', () => {
        assert.ok(hits(c().x + dx * 90, c().y + dy * 90));
        assert.ok(hits(c().x + dx * 140, c().y + dy * 140));
      });
      it('nao acerta longe, atras nem no lado distante', () => {
        assert.ok(!hits(c().x + dx * 260, c().y + dy * 260));
        assert.ok(!hits(c().x - dx * 120, c().y - dy * 120));
        assert.ok(!hits(c().x + dy * 250, c().y + dx * 250));
      });
    });
  }
});
