import { record } from './helpers/env.js';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import TommyGun from '../models/weapons/guns/TommyGun.js';
import KnifeWeapon from '../models/weapons/melee/Knife.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const inGame = main.getInGameInstance();

const real_now = Date.now;
let now = 100000;
const texts = () => record(() => inGame.draw()).filter((c) => c[0] === 'fillText').map((c) => c[1]);
const reloadingText = () => texts().find((text) => text.startsWith('recarregando'));

describe('texto de recarga', () => {
  beforeEach(() => {
    main.resetGame();
    player.position = { x: 640, y: 300 };
    player.inventory[1] = new TommyGun();
    Date.now = () => now;
  });

  afterEach(() => { Date.now = real_now; });

  it('nao aparece sem estar recarregando', () => {
    assert.equal(reloadingText(), undefined);
  });

  it('aparece embaixo do jogador, em amarelo, enquanto a arma recarrega', () => {
    const gun = player.inventory[1];
    gun.using_ammunition = 0;
    gun.reload();
    const drawn = [];
    const original = inGame.drawOutlinedText;
    inGame.drawOutlinedText = function (text, x, y, options) { drawn.push({ text, x, y, ...options }); return original.call(this, text, x, y, options); };
    try { inGame.draw(); } finally { inGame.drawOutlinedText = original; }
    const label = drawn.find((d) => d.text.startsWith('recarregando'));
    assert.ok(label);
    assert.ok(label.y > player.position.y + player.PLAYER_SIZE.y, 'embaixo do personagem');
    assert.ok(Math.abs(label.x - player.position.x) < 100);
    assert.equal(label.color, 'rgb(242, 193, 78)', 'amarelo do HUD');
  });

  it('os pontinhos sao animados: 0, 1, 2, 3 e de novo', () => {
    const gun = player.inventory[1];
    gun.using_ammunition = 0;
    gun.reload();
    const seen = [];
    for (let step = 0; step < 5; step += 1) {
      now = 100800 + 50 + step * 300;   // 100800 = inicio de um ciclo de 4 x 300 ms; +50 de folga
      seen.push(reloadingText());
    }
    assert.deepEqual(seen, ['recarregando', 'recarregando.', 'recarregando..', 'recarregando...', 'recarregando']);
  });

  it('o intervalo do golpe da faca nao mostra o texto', () => {
    player.addItem(new KnifeWeapon());
    player.curr_item = 2;
    player.inventory[2].reload();
    assert.equal(reloadingText(), undefined);
  });
});
