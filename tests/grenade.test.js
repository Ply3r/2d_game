import { record } from './helpers/env.js';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import GrenadeParticle from '../models/particles/Grenade.js';
import Grenade from '../models/weapons/throable/Grenade.js';

const cubic = ([p0, p1, p2, p3], t) => ({
  x: (1 - t) ** 3 * p0.x + 3 * (1 - t) ** 2 * t * p1.x + 3 * (1 - t) * t ** 2 * p2.x + t ** 3 * p3.x,
  y: (1 - t) ** 3 * p0.y + 3 * (1 - t) ** 2 * t * p1.y + 3 * (1 - t) * t ** 2 * p2.y + t ** 3 * p3.y,
});
const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < 1e-6;

describe('granada', () => {
  const real_now = Date.now;
  let now = 5000;
  before(() => { Date.now = () => now; });
  after(() => { Date.now = real_now; });

  const throws = [
    [{ x: 600, y: 400 }, { x: 900, y: 300 }],
    [{ x: 600, y: 400 }, { x: 200, y: 650 }],
    [{ x: 600, y: 400 }, { x: 600, y: 100 }],
    [{ x: 300, y: 600 }, { x: 1000, y: 620 }],
  ];

  for (const [player, mouse] of throws) {
    it(`segue a linha da previa: ${JSON.stringify(player)} -> ${JSON.stringify(mouse)}`, () => {
      const calls = record(() => new Grenade().drawTrajectory(player, mouse));
      const move = calls.find((c) => c[0] === 'moveTo');
      const bezier = calls.find((c) => c[0] === 'bezierCurveTo');
      const preview = [
        { x: move[1], y: move[2] },
        { x: bezier[1], y: bezier[2] },
        { x: bezier[3], y: bezier[4] },
        { x: bezier[5], y: bezier[6] },
      ];

      now = 5000;
      const particle = new GrenadeParticle({ start_pos: player, end_pos: mouse, speed: 25, size: { x: 50, y: 50 }, duration: 1000 });
      assert.ok(near(particle.curr_pos, preview[0]), 'comeca na mao do jogador');
      for (const t of [0, 0.25, 0.5, 0.75, 0.99]) {
        now = 5000 + t * 1000;
        particle.update();
        assert.ok(near(particle.curr_pos, cubic(preview, t)), `t=${t} fora da linha da previa`);
      }
      assert.ok(near(cubic(preview, 1), mouse), 'previa termina no alvo');
      now = 6000;
      particle.update();
      assert.equal(particle.isVisible(), false);
    });
  }

  it('nao some antes da hora quando o alvo esta muito perto', () => {
    now = 5000;
    const particle = new GrenadeParticle({ start_pos: { x: 100, y: 100 }, end_pos: { x: 110, y: 110 }, speed: 25, size: { x: 50, y: 50 }, duration: 1000 });
    now = 5100;
    particle.update();
    assert.equal(particle.isVisible(), true);
  });

  it('nao tem cooldown entre lancamentos', () => {
    const main = Main.instance();
    const updater = main.getItemUpdaterInstance();
    const create = updater.create;
    let created = 0;
    updater.create = () => { created += 1; };
    try {
      const grenade = new Grenade();
      grenade.attack({ x: 0, y: 0 }, { x: 100, y: 100 });
      grenade.attack({ x: 0, y: 0 }, { x: 100, y: 100 });
      assert.equal(created, 2);
      assert.equal(grenade.reloading, false);
    } finally {
      updater.create = create;
    }
  });
});
