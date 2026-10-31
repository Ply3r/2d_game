import { record } from './helpers/env.js';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Clock from '../models/config/Clock.js';
import Controls from '../models/config/Controls.js';
import TommyGun from '../models/weapons/guns/TommyGun.js';
import TecNine from '../models/weapons/guns/TecNine.js';
import KnifeWeapon from '../models/weapons/melee/Knife.js';
import Bullet from '../models/particles/Bullet.js';
import Airdrop from '../models/airdrops/Airdrop.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import { ShieldDrop } from '../models/drops/Powerup.js';
import { readFile } from 'node:fs/promises';
import Images from '../models/config/Images.js';
import { POWERUPS, SHIELD_IMAGE, bulletLook, multishotAngles } from '../models/config/Powerups.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();
const items = main.getItemUpdaterInstance();
const airdrops = main.getAirdropsInstance();

const MOUSE = { x: 1000, y: 360 };
const bullets = () => items.items.filter((item) => item instanceof Bullet);
const angleOf = (bullet) => Math.atan2(bullet.end_pos.y - bullet.start_pos.y, bullet.end_pos.x - bullet.start_pos.x);
const levelUp = (type, times = 1) => { for (let i = 0; i < times; i += 1) player.addPowerup(type); };

// Captura os intervalos pedidos ao relogio durante fn() (sem esperar o tempo passar).
const intervals = (fn) => {
  const real_after = Clock.after;
  const asked = [];
  Clock.after = (ms, callback) => { asked.push(ms); return real_after.call(Clock, ms, callback); };
  try { fn(); } finally { Clock.after = real_after; }
  return asked;
};

const real_now = Date.now;
let now = 50000;

describe('powerups', () => {
  beforeEach(() => {
    main.resetGame();
    player.position = { x: 640, y: 320 };
    player.inventory[1] = new TommyGun();
    Date.now = () => now;
  });

  afterEach(() => {
    Date.now = real_now;
    Controls.releaseAll();
  });

  it('acumulam sem limite (escudo ate 3) e zeram numa partida nova', () => {
    for (const type of ['multishot', 'fire_rate', 'damage']) {
      for (let i = 0; i < 10; i += 1) assert.equal(player.addPowerup(type), true, type);
      assert.equal(player.powerups[type], 10);
    }
    levelUp('shield', 5);
    assert.equal(player.powerups.shield, POWERUPS.shield.max);
    assert.equal(player.addPowerup('shield'), false);
    main.resetGame();
    assert.deepEqual(player.powerups, { multishot: 0, fire_rate: 0, damage: 0, shield: 0 });
  });

  it('pegar o item do chao da o powerup e mostra o aviso', () => {
    const drop = new ShieldDrop({ x: player.position.x - 24, y: player.position.y + 10 });
    items.create(drop);
    items.update();
    assert.equal(player.powerups.shield, 1);
    assert.equal(drop.visible, false);
    assert.equal(player.powerup_toast.type, 'shield');
  });

  describe('tiro multiplo', () => {
    it('sem o powerup sai uma bala', () => {
      player.attack();
      assert.equal(bullets().length, 1);
    });

    it('sai 3 balas em leque gastando uma municao', () => {
      levelUp('multishot');
      const gun = player.inventory[1];
      const before = gun.using_ammunition;
      player.attack();
      assert.equal(bullets().length, 3);
      assert.equal(gun.using_ammunition, before - 1);
      const angles = bullets().map(angleOf).sort((a, b) => a - b);
      assert.ok(angles[0] < angles[1] - 0.1 && angles[1] < angles[2] - 0.1, JSON.stringify(angles));
    });

    it('cada nivel soma 2 balas, ainda com uma municao', () => {
      levelUp('multishot', 3);
      const gun = player.inventory[1];
      const before = gun.using_ammunition;
      player.attack();
      assert.equal(bullets().length, 7);
      assert.equal(gun.using_ammunition, before - 1);
    });

    it('o leque nao passa de ~60 graus e fica simetrico em volta da mira', () => {
      for (const level of [1, 2, 5, 20]) {
        const angles = multishotAngles(level);
        assert.equal(angles.length, 1 + 2 * level);
        assert.ok(angles[angles.length - 1] - angles[0] <= 1.05 + 1e-9, `nivel ${level}`);
        assert.ok(Math.abs(angles[0] + angles[angles.length - 1]) < 1e-9);
        assert.ok(angles.includes(0), 'uma bala vai direto na mira');
      }
    });
  });

  describe('cadencia', () => {
    it('cada nivel encurta o intervalo da arma automatica', () => {
      Controls.mouseMove({ clientX: MOUSE.x, clientY: MOUSE.y });
      const base = intervals(() => player.attack())[0];
      levelUp('fire_rate', 2);
      player.inventory[1] = new TommyGun();
      const faster = intervals(() => player.attack())[0];
      assert.equal(base, 200);
      assert.equal(faster, 200 * 0.75 ** 2);
    });

    it('acumula sem limite de nivel, mas o intervalo nao cai abaixo de 40 ms', () => {
      levelUp('fire_rate', 30);
      const interval = intervals(() => player.attack())[0];
      assert.equal(interval, 40);
    });

    it('arma de clique vira automatica ao segurar o botao', () => {
      player.inventory[1] = new TecNine();
      Controls.mouseDown();
      player.automaticAttack();
      assert.equal(bullets().length, 0, 'sem o powerup, segurar nao atira');
      levelUp('fire_rate');
      player.automaticAttack();
      player.automaticAttack();    // ainda no intervalo: nao atira de novo
      assert.equal(bullets().length, 1);
    });
  });

  describe('dano', () => {
    it('aumenta o dano, o tamanho e o vermelho da bala', () => {
      player.attack();
      const normal = bullets()[0];
      items.reset();
      levelUp('damage', 3);
      player.inventory[1] = new TommyGun();
      player.attack();
      const strong = bullets()[0];
      assert.equal(normal.strength, 2);
      assert.equal(strong.strength, 2 * 2.5);
      assert.equal(normal.size.x, 10);
      assert.equal(strong.size.x, 22);
      assert.equal(normal.color, 'rgb(255, 255, 255)');
      assert.equal(strong.color, 'rgb(255, 58, 58)');
    });

    it('o dano acumula sem limite', () => {
      levelUp('damage', 10);
      assert.equal(player.gunDamage(), 2 * 6);
    });

    it('a cor vai ficando mais vermelha a cada nivel e o tamanho tem limite', () => {
      const green = (level) => Number(bulletLook(level).color.match(/\d+/g)[1]);
      for (let level = 0; level < 6; level += 1) assert.ok(green(level) > green(level + 1), `nivel ${level}`);
      assert.ok(green(30) >= 30);
      assert.equal(bulletLook(30).size, 30);
    });

    it('a bala maior sai centrada no cano', () => {
      levelUp('damage', 3);
      player.attack();
      const bullet = bullets()[0];
      const muzzle = player.inventory[1].muzzlePosition(player.position, Controls.getMousePosition());
      assert.deepEqual([bullet.start_pos.x + 11, bullet.start_pos.y + 11], [muzzle.x, muzzle.y]);
    });
  });

  describe('escudos', () => {
    const shieldAt = (index = 0) => player.shields.positions()[index];
    const zombieAt = (point) => {
      const zombie = new StandardZombie({ x: point.x - 60, y: point.y - 60 });
      zombie.life = 100;
      zombie.move = () => {};
      enemies.enemies_array.push(zombie);
      return zombie;
    };

    it('um escudo por nivel, ate 3, igualmente espacados', () => {
      assert.equal(player.shields.positions().length, 0);
      levelUp('shield', 3);
      const center = player.center();
      const angles = player.shields.positions().map((p) => Math.atan2(p.y - center.y, p.x - center.x));
      const gaps = angles.map((a, i) => ((angles[(i + 1) % 3] - a + Math.PI * 4) % (Math.PI * 2)));
      gaps.forEach((gap) => assert.ok(Math.abs(gap - (Math.PI * 2) / 3) < 1e-9));
    });

    it('orbitam o jogador', () => {
      levelUp('shield');
      const before = shieldAt();
      player.shields.update();
      assert.notDeepEqual(shieldAt(), before);
      const center = player.center();
      assert.ok(Math.abs(Math.hypot(shieldAt().x - center.x, shieldAt().y - center.y) - 85) < 1e-9);
    });

    it('dao o dano da arma (com bonus) em quem encostam, com intervalo', () => {
      levelUp('shield');
      levelUp('damage');
      player.shields.angle = 0;
      const zombie = zombieAt({ x: shieldAt().x + 0, y: shieldAt().y });
      player.shields.update();
      assert.equal(zombie.life, 100 - 3);           // TommyGun 2 x 1.5
      player.shields.update();
      assert.equal(zombie.life, 97, 'nao bate de novo no mesmo instante');
      now += 600;
      player.shields.update();
      assert.equal(zombie.life, 94);
    });

    it('o dano acompanha a arma de fogo, mesmo segurando a faca', () => {
      levelUp('shield');
      player.inventory[1] = new TecNine();
      player.addItem(new KnifeWeapon());
      player.curr_item = 2;
      assert.equal(player.gunDamage(), 1);
      player.shields.angle = 0;
      const zombie = zombieAt(shieldAt());
      player.shields.update();
      assert.equal(zombie.life, 99);
    });

    it('nao acertam quem esta longe e quebram caixas de suprimento', () => {
      levelUp('shield');
      player.shields.angle = 0;
      const far = zombieAt({ x: 100, y: 650 });
      const crate = new Airdrop({ landing: { x: 0, y: 0 } });
      crate.position = { x: shieldAt().x - 32, y: shieldAt().y - 32 };
      airdrops.crates.push(crate);
      player.shields.update();
      assert.equal(far.life, 100);
      assert.equal(crate.life, 8);
    });

    it('sao desenhados junto com o jogador, com a pixel art do escudo', () => {
      levelUp('shield', 2);
      const sprites = record(() => player.draw()).filter((c) => c[0] === 'drawImage' && c[1] === Images.get(SHIELD_IMAGE));
      assert.equal(sprites.length, 2);
      sprites.forEach((c) => assert.deepEqual([c[4], c[5]], [32, 32]));
    });

    it('o sprite do escudo existe', async () => {
      await assert.doesNotReject(readFile(SHIELD_IMAGE));
    });
  });

  it('o HUD mostra os powerups ativos com os niveis', () => {
    levelUp('damage', 4);
    levelUp('shield', 2);
    const calls = record(() => main.getInGameInstance().draw());
    const pips = calls.filter((c) => c[0] === 'fillRect' && c[2] === 16 + 100 + 10 + 40 + 4 && c[4] === 5);
    assert.equal(pips.length, POWERUPS.shield.max, 'tracinhos so para o escudo, que tem limite');
    assert.ok(calls.some((c) => c[0] === 'fillText' && c[1] === 'x4'), 'dano mostra x4');
  });

  it('a caixa pode soltar um powerup', () => {
    const real_random = Math.random;
    Math.random = () => 0.999;      // ultimo da tabela: escudo
    try {
      assert.equal(airdrops.pickLoot(), ShieldDrop);
      levelUp('shield', 3);
      assert.notEqual(airdrops.pickLoot(), ShieldDrop);
    } finally {
      Math.random = real_random;
    }
  });
});
