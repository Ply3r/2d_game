import { fire } from './helpers/env.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Controls from '../models/config/Controls.js';
import TommyGun from '../models/weapons/guns/TommyGun.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import RunningZombie from '../models/enemies/RunningZombie.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const mouse = Controls.getMousePosition();
const near = (a, b) => Math.abs(a - b) < 1e-6;

describe('jogador', () => {
  beforeEach(() => { player.reset(); player.position = { x: 600, y: 300 }; });

  it('comeca so com a TommyGun', () => {
    assert.ok(player.inventory[1] instanceof TommyGun);
    assert.equal(player.inventory[2], null);
    assert.equal(player.inventory[3], null);
  });

  it('a boca do cano acompanha a mao nos dois lados e a mira vertical', () => {
    const gun = new TommyGun();
    let m = gun.muzzlePosition(player.position, { x: 1200, y: 346 });
    assert.ok(near(m.x, 664.5) && near(m.y, 340));
    m = gun.muzzlePosition(player.position, { x: 0, y: 346 });
    assert.ok(near(m.x, 535.5) && near(m.y, 340));
    m = gun.muzzlePosition(player.position, { x: 601, y: 0 });
    const dist = Math.hypot(m.x - 600, m.y - 346);
    assert.ok(Math.abs(dist - 64.78) < 0.5, `dist=${dist}`);
  });

  it('o corpo olha para a mira', () => {
    const face = (x, y) => { mouse.x = x; mouse.y = y; return player.getFacing(); };
    assert.equal(face(900, 340), 'right');
    assert.equal(face(100, 340), 'left');
    assert.equal(face(600, 0), 'up');
    assert.equal(face(600, 700), 'down');
    assert.deepEqual(player.getImagePosition(), { x: 0, y: 0 });
    face(100, 340);
    assert.deepEqual(player.getImagePosition(), { x: 0, y: 80 });
  });

  it('anima so enquanto anda: 4 quadros, 6 ticks cada, e volta ao quadro 0 parado', () => {
    Controls.addEventListeners();
    main.gameRunning = true;
    fire('keydown', 'd');
    const seen = [];
    for (let i = 0; i < 30; i += 1) {
      player.update();
      if (!seen.length || seen[seen.length - 1] !== player.current_sprite) seen.push(player.current_sprite);
    }
    assert.deepEqual(seen.slice(0, 6), [0, 1, 2, 3, 0, 1]);
    fire('keyup', 'd');
    player.update();
    assert.equal(player.current_sprite, 0);
  });
});

describe('animacao dos zumbis', () => {
  for (const [Type, ticks] of [[StandardZombie, 6], [RunningZombie, 3]]) {
    it(`${Type.name}: 8 quadros, ${ticks} ticks por quadro`, () => {
      const zombie = new Type({ x: 0, y: 0 });
      assert.equal(zombie.total_sprites, 8);
      assert.equal(zombie.sprite_ticks, ticks);
      const seq = [];
      for (let i = 0; i < ticks * 9; i += 1) { zombie.updateSprite(); seq.push(zombie.curr_sprite); }
      assert.equal(seq[ticks - 1], 1);
      assert.equal(seq[ticks * 8 - 1], 0);
    });
  }
});
