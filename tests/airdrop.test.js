import './helpers/env.js';
import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Airdrop from '../models/airdrops/Airdrop.js';
import Airdrops from '../models/airdrops/Airdrops.js';
import Bullet from '../models/particles/Bullet.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import Ammunition from '../models/drops/Ammunition.js';
import Heart from '../models/drops/Heart.js';
import GrenadeDrop from '../models/drops/Grenade.js';
import KnifeDrop from '../models/drops/Knife.js';
import GrenadeWeapon from '../models/weapons/throable/Grenade.js';
import KnifeWeapon from '../models/weapons/melee/Knife.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();
const airdrops = main.getAirdropsInstance();
const items = main.getItemUpdaterInstance();

const setup = () => {
  main.resetGame();
  player.position = { x: 640, y: 360 };
};
const land = (crate) => { for (let i = 0; i < 1000 && !crate.landed; i += 1) crate.update(); return crate; };
const settle = (crate) => { for (let i = 0; i < 1000; i += 1) crate.update(); return crate; };
const real_random = Math.random;
before(() => { main.gameRunning = true; });
after(() => { Math.random = real_random; });

describe('queda da caixa', () => {
  it('comeca acima da tela, com paraquedas aberto e sem estar no chao', () => {
    const crate = new Airdrop({ landing: { x: 300, y: 400 } });
    assert.ok(crate.position.y < 0);
    assert.equal(crate.landed, false);
    assert.equal(crate.parachute.open, true);
  });

  it('desce devagar com o paraquedas aberto (velocidade limitada)', () => {
    const crate = new Airdrop({ landing: { x: 300, y: 600 } });
    let max = 0;
    while (crate.parachute.open) { crate.update(); max = Math.max(max, crate.velocity); }
    assert.ok(max <= 4 + 1e-9, `max=${max}`);
  });

  it('solta o paraquedas perto do chao e acelera em queda livre', () => {
    const crate = new Airdrop({ landing: { x: 300, y: 600 } });
    while (crate.parachute.open) crate.update();
    assert.ok(crate.landing.y - crate.position.y <= 130 + 5);
    const before_speed = crate.velocity;
    crate.update();
    assert.ok(crate.velocity > before_speed);
  });

  it('pousa exatamente no ponto marcado, quica e para', () => {
    const crate = land(new Airdrop({ landing: { x: 300, y: 600 } }));
    assert.equal(crate.landed, true);
    let bounced = false;
    for (let i = 0; i < 400; i += 1) { crate.update(); if (crate.position.y < crate.landing.y - 1) bounced = true; }
    assert.ok(bounced, 'devia quicar ao menos uma vez');
    assert.equal(crate.position.y, 600);
    assert.equal(crate.velocity, 0);
  });

  it('nao leva dano nem bloqueia enquanto esta caindo', () => {
    const crate = new Airdrop({ landing: { x: 300, y: 600 } });
    crate.getHit(5);
    assert.equal(crate.life, 10);
    assert.equal(crate.isSolid(), false);
  });

  it('o paraquedas solto desaparece aos poucos', () => {
    const crate = settle(new Airdrop({ landing: { x: 300, y: 400 } }));
    assert.equal(crate.parachute.alpha, 0);
  });
});

describe('dano da caixa', () => {
  it('quebra depois de levar dano suficiente', () => {
    const crate = land(new Airdrop({ landing: { x: 300, y: 400 } }));
    for (let i = 0; i < 4; i += 1) crate.getHit(2);
    assert.equal(crate.isVisible(), true);
    crate.getHit(2);
    assert.equal(crate.isVisible(), false);
  });

  it('pisca ao ser atingida', () => {
    const crate = land(new Airdrop({ landing: { x: 300, y: 400 } }));
    crate.getHit(1);
    assert.ok(crate.flash > 0);
  });
});

describe('colisao solida', () => {
  beforeEach(setup);
  const crateAt = (x, y) => { const crate = settle(new Airdrop({ landing: { x, y } })); airdrops.crates.push(crate); return crate; };

  it('empurra o jogador para fora, pelo lado de onde ele veio', () => {
    const crate = crateAt(800, 340);
    player.position = { x: 800 - 40 + 5, y: 340 };      // 5px dentro pela esquerda (hitbox do jogador: x-40..x+40)
    airdrops.resolveCollisions();
    const a = player.hitbox();
    assert.ok(a.x + a.w <= crate.hitbox().x + 1e-9, 'saiu pela esquerda');
    assert.equal(a.y, 340);
  });

  it('empurra por cima e por baixo tambem', () => {
    const crate = crateAt(800, 340);
    player.position = { x: 800 + 32, y: 340 - 80 + 4 };
    airdrops.resolveCollisions();
    assert.ok(player.hitbox().y + 80 <= crate.hitbox().y + 1e-9);
    player.position = { x: 800 + 32, y: 340 + 64 - 4 };
    airdrops.resolveCollisions();
    assert.ok(player.hitbox().y >= crate.hitbox().y + 64 - 1e-9);
  });

  it('inimigos tambem nao atravessam a caixa', () => {
    const crate = crateAt(300, 300);
    const zombie = new StandardZombie({ x: 100, y: 300 });
    zombie.life = 99;
    enemies.enemies_array.push(zombie);
    player.position = { x: 900, y: 330 };
    for (let i = 0; i < 400; i += 1) { zombie.move(); airdrops.resolveCollisions(); }
    const z = zombie.hitbox();
    const c = crate.hitbox();
    const overlap_x = Math.min(z.x + z.w, c.x + c.w) - Math.max(z.x, c.x);
    const overlap_y = Math.min(z.y + z.h, c.y + c.h) - Math.max(z.y, c.y);
    assert.ok(!(overlap_x > 0.5 && overlap_y > 0.5), 'atravessou a caixa');
  });

  it('caixa ainda no ar nao empurra ninguem', () => {
    const crate = new Airdrop({ landing: { x: 800, y: 340 } });
    crate.position = { x: 800, y: 340 };
    airdrops.crates.push(crate);
    player.position = { x: 800 + 32, y: 340 };
    airdrops.resolveCollisions();
    assert.deepEqual(player.position, { x: 832, y: 340 });
  });
});

describe('tiros na caixa', () => {
  beforeEach(setup);

  it('a bala tira vida da caixa pousada e some', () => {
    const crate = settle(new Airdrop({ landing: { x: 800, y: 340 } }));
    airdrops.crates.push(crate);
    const bullet = new Bullet({ start_pos: { x: 500, y: 360 }, end_pos: { x: 1200, y: 360 }, strength: 2 });
    bullet.curr_pos = { x: 810, y: 360 };
    bullet.checkColitionWithEnemies();
    assert.equal(crate.life, 8);
    assert.equal(bullet.visible, false);
  });

  it('a bala atravessa a caixa que ainda esta no ar', () => {
    const crate = new Airdrop({ landing: { x: 800, y: 340 } });
    crate.position = { x: 800, y: 340 };
    airdrops.crates.push(crate);
    const bullet = new Bullet({ start_pos: { x: 500, y: 360 }, end_pos: { x: 1200, y: 360 }, strength: 2 });
    bullet.curr_pos = { x: 810, y: 360 };
    bullet.checkColitionWithEnemies();
    assert.equal(crate.life, 10);
    assert.equal(bullet.visible, true);
  });

  it('acerta so o mais proximo entre a caixa e o zumbi atras dela', () => {
    const crate = settle(new Airdrop({ landing: { x: 700, y: 300 } }));
    airdrops.crates.push(crate);
    const zombie = new StandardZombie({ x: 740, y: 280 });
    zombie.life = 5;
    enemies.enemies_array.push(zombie);
    const bullet = new Bullet({ start_pos: { x: 500, y: 330 }, end_pos: { x: 1200, y: 330 }, strength: 2 });
    bullet.curr_pos = { x: 760, y: 325 };    // dentro da caixa e do zumbi
    bullet.checkColitionWithEnemies();
    assert.equal(crate.life, 8);
    assert.equal(zombie.life, 5);
  });
});

describe('quando cai', () => {
  beforeEach(setup);

  it('uma caixa cai no fim de cada horda', () => {
    const waves = main.getWavesInstance();
    waves.state = 'active'; waves.wave = 1; waves.remaining = 0;
    assert.equal(airdrops.crates.length, 0);
    main.update();
    assert.equal(airdrops.crates.length, 1);
    main.update();
    assert.equal(airdrops.crates.length, 1, 'so uma por horda');
  });

  it('cai longe do jogador e dentro da area livre do HUD', () => {
    for (let i = 0; i < 100; i += 1) {
      airdrops.reset();
      const crate = airdrops.spawn();
      const dist = Math.hypot(crate.landing.x + 32 - player.center().x, crate.landing.y + 32 - player.center().y);
      assert.ok(dist >= 220, `dist=${dist}`);
      assert.ok(crate.landing.x >= 60 && crate.landing.x + 64 <= window.innerWidth - 60);
      assert.ok(crate.landing.y >= 140 && crate.landing.y + 64 <= window.innerHeight - 260);
    }
  });

  it('no maximo 3 caixas ao mesmo tempo', () => {
    for (let i = 0; i < 5; i += 1) airdrops.spawn();
    assert.equal(airdrops.crates.length, 3);
  });

  it('resetGame remove as caixas', () => {
    airdrops.spawn();
    main.resetGame();
    assert.equal(airdrops.crates.length, 0);
  });
});

describe('item da caixa', () => {
  beforeEach(setup);

  it('ao quebrar, solta um item no centro da caixa', () => {
    const crate = settle(new Airdrop({ landing: { x: 800, y: 340 } }));
    airdrops.crates.push(crate);
    crate.getHit(99);
    airdrops.update();
    assert.equal(airdrops.crates.length, 0);
    assert.equal(items.items.length, 1);
    const drop = items.items[0];
    assert.deepEqual([drop.position.x + drop.size.x / 2, drop.position.y + drop.size.y / 2], [crate.center().x, crate.center().y]);
  });

  it('nunca sorteia faca ou granada que o jogador ja tem', () => {
    player.addItem(new KnifeWeapon());
    player.addItem(new GrenadeWeapon());
    for (let i = 0; i < 300; i += 1) {
      const Loot = airdrops.pickLoot();
      assert.ok(Loot === Ammunition || Loot === Heart, Loot.name);
    }
  });

  it('com so a TommyGun, todos os 4 itens podem sair', () => {
    player.life = 2;
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) { Math.random = () => i / 100; seen.add(airdrops.pickLoot()); }
    Math.random = real_random;
    assert.deepEqual(new Set([Ammunition, Heart, GrenadeDrop, KnifeDrop]), seen);
  });

  it('coracao e menos provavel com a vida cheia', () => {
    const count = (life) => {
      player.life = life;
      let hearts = 0;
      for (let i = 0; i < 1000; i += 1) { Math.random = () => i / 1000; if (airdrops.pickLoot() === Heart) hearts += 1; }
      Math.random = real_random;
      return hearts;
    };
    assert.ok(count(5) < count(2));
  });
});

describe('pegar armas do chao', () => {
  beforeEach(setup);

  it('a faca vai para o inventario como arma', () => {
    const drop = new KnifeDrop({ x: player.position.x - 20, y: player.position.y + 10 });
    drop.update();
    assert.ok(player.inventory[2] instanceof KnifeWeapon);
    assert.equal(drop.isVisible(), false);
  });

  it('a granada vai para o inventario como arma', () => {
    const drop = new GrenadeDrop({ x: player.position.x - 20, y: player.position.y + 10 });
    drop.update();
    assert.ok(Object.values(player.inventory).some((weapon) => weapon instanceof GrenadeWeapon));
  });
});
