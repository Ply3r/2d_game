import { fire, winListeners, record } from './helpers/env.js';
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Clock from '../models/config/Clock.js';
import Controls from '../models/config/Controls.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import Ammunition from '../models/drops/Ammunition.js';

const main = Main.instance();
const player = main.getPlayerInstance();
const enemies = main.getEnemiesInstance();

const real_now = Date.now;
let now = 100000;

// Loop do jogo com requestAnimationFrame e relogio falsos; devolve uma funcao que avanca `ms`.
const startLoop = () => {
  let loop;
  let time = 0;
  globalThis.requestAnimationFrame = (fn) => { loop = fn; };
  globalThis.performance = { now: () => time };
  main.start();
  return (ms) => {
    for (let elapsed = 0; elapsed < ms; elapsed += 16) { time += 16; now += 16; loop(time); }
  };
};

describe('pause', () => {
  beforeEach(() => {
    Date.now = () => now;
    main.addPauseListeners();
    main.resetGame();
    player.position = { x: 640, y: 360 };
    player.invencible = true;
  });

  afterEach(() => {
    main.setPaused(false);
    Date.now = real_now;
  });

  it('Esc pausa e despausa', () => {
    fire('keydown', 'Escape');
    assert.equal(main.paused, true);
    assert.equal(Clock.isPaused(), true);
    fire('keydown', 'Escape');
    assert.equal(main.paused, false);
    assert.equal(Clock.isPaused(), false);
  });

  it('pausado, nada se move e a tela de pause aparece por cima do jogo', () => {
    const advance = startLoop();
    const zombie = new StandardZombie({ x: 100, y: 100 });
    enemies.enemies_array.push(zombie);
    advance(100);
    const moving = { ...zombie.position };
    assert.notDeepEqual(moving, { x: 100, y: 100 }, 'andava antes do pause');

    fire('keydown', 'Escape');
    advance(1000);
    assert.deepEqual(zombie.position, moving);

    const calls = record(() => advance(16));
    const title = calls.findIndex((c) => c[0] === 'fillText' && c[1] === 'PAUSADO');
    assert.ok(title >= 0, 'mostra PAUSADO');
    assert.ok(calls.findIndex((c) => c[0] === 'drawImage') < title, 'o jogo congelado e desenhado por baixo');

    fire('keydown', 'Escape');
    advance(100);
    assert.notDeepEqual(zombie.position, moving, 'volta a andar');
  });

  it('o relogio do jogo congela: itens no chao nao somem durante o pause', async () => {
    const drop = new Ammunition({ x: 10, y: 10 });
    fire('keydown', 'Escape');
    now += 60000;                            // um minuto pausado
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.equal(drop.visible, true);
    fire('keydown', 'Escape');
    assert.ok(Clock.now() - (now - 60000) < 50, 'o tempo pausado nao conta');
  });

  it('timers retomam de onde pararam', async () => {
    let fired = false;
    Clock.after(30, () => { fired = true; });
    main.setPaused(true);
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(fired, false, 'nao dispara pausado');
    main.setPaused(false);
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(fired, true);
  });

  it('M no pause volta ao menu; fora do pause nao faz nada', () => {
    fire('keydown', 'm');
    assert.equal(main.gameRunning, true);
    fire('keydown', 'Escape');
    fire('keydown', 'M');
    assert.equal(main.gameRunning, false);
    assert.equal(main.gameOver, false);
    assert.equal(main.paused, false);
    assert.equal(Clock.isPaused(), false);
  });

  it('perder o foco da janela pausa o jogo', () => {
    winListeners.blur();
    assert.equal(main.paused, true);
  });

  it('teclas seguras ao pausar sao soltas', () => {
    Controls.addEventListeners();
    fire('keydown', 'w');
    fire('keydown', 'Escape');
    assert.ok(!Controls.getHoldingKeys().includes('w'), 'o jogador nao continua andando ao despausar');
  });

  it('Esc no menu nao pausa', () => {
    main.quitToMenu();
    fire('keydown', 'Escape');
    assert.equal(main.paused, false);
  });
});
