import { fire, winListeners } from './helpers/env.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Controls from '../models/config/Controls.js';
import Images from '../models/config/Images.js';
import Enemies from '../models/enemies/Enemies.js';
import StandardZombie from '../models/enemies/StandardZombie.js';

describe('Images', () => {
  it('reaproveita a mesma imagem para o mesmo caminho', () => {
    assert.equal(Images.get('a.png'), Images.get('a.png'));
    assert.notEqual(Images.get('a.png'), Images.get('b.png'));
  });
});

describe('Controls', () => {
  Controls.addEventListeners();
  const player = Main.instance().getPlayerInstance();

  it('ignora teclas repetidas e normaliza maiusculas (shift)', () => {
    fire('keydown', 'w'); fire('keydown', 'w'); fire('keydown', 'w');
    assert.deepEqual(Controls.getHoldingKeys(), ['w']);
    fire('keydown', 'W');
    assert.deepEqual(Controls.getHoldingKeys(), ['w']);
    fire('keyup', 'W');
    assert.deepEqual(Controls.getHoldingKeys(), []);
  });

  it('solta todas as teclas quando a janela perde o foco', () => {
    fire('keydown', 'd');
    winListeners.blur();
    assert.deepEqual(Controls.getHoldingKeys(), []);
  });

  it('teclas de funcao nao trocam de item', () => {
    fire('keydown', 'F2');
    player.changing_inventory = false;
    player.changeInventory();
    assert.equal(player.curr_item, 1);
    fire('keyup', 'F2');
  });
});

describe('loop do jogo', () => {
  const main = Main.instance();

  const runLoop = (hz, seconds) => {
    let loop;
    globalThis.requestAnimationFrame = (fn) => { loop = fn; };
    let now = 1000;
    globalThis.performance = { now: () => now };
    main.gameRunning = false; main.gameOver = false; main.screen = null;
    main.start();
    main.gameRunning = true;
    main.getPlayerInstance().reset();

    let ticks = 0;
    main.update = () => { ticks += 1; };
    const draw = main.player.draw;
    main.player.draw = () => {};
    loop(now);
    for (let i = 0; i < hz * seconds; i += 1) { now += 1000 / hz; loop(now); }
    main.player.draw = draw;
    return { ticks, loop, advance: (ms) => { now += ms; loop(now); } };
  };

  for (const hz of [30, 60, 144, 240]) {
    it(`roda ~60 ticks por segundo em telas de ${hz} Hz`, () => {
      const { ticks } = runLoop(hz, 2);
      assert.ok(Math.abs(ticks - 120) <= 2, `ticks=${ticks}`);
    });
  }

  it('limita os ticks quando a aba fica em segundo plano', () => {
    const { advance } = runLoop(60, 0);
    let ticks = 0;
    main.update = () => { ticks += 1; };
    advance(10000);
    assert.ok(ticks <= 5, `ticks=${ticks}`);
  });

  it('draw dos inimigos nao os move', () => {
    const enemies = new Enemies();
    const zombie = new StandardZombie({ x: 0, y: 0 });
    zombie.draw = () => {};
    enemies.enemies_array.push(zombie);
    const before = { ...zombie.position };
    enemies.draw();
    assert.deepEqual(zombie.position, before);
  });
});
