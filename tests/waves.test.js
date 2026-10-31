import { fire } from './helpers/env.js';
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Waves from '../models/config/Waves.js';
import Enemies from '../models/enemies/Enemies.js';
import StandardZombie from '../models/enemies/StandardZombie.js';
import RunningZombie from '../models/enemies/RunningZombie.js';

const run = (waves, enemies, ticks) => { for (let i = 0; i < ticks; i += 1) waves.update(enemies); };
const kill = (enemies) => enemies.getEnemies().forEach((e) => { e.life = 0; });

describe('formulas das hordas', () => {
  it('a quantidade de inimigos cresce a cada horda', () => {
    const counts = [1, 2, 3, 4, 10].map(Waves.enemiesInWave);
    assert.deepEqual(counts, [4, 7, 10, 13, 31]);
  });

  it('os inimigos aparecem mais rapido a cada horda, com minimo', () => {
    assert.equal(Waves.spawnInterval(1), 50);
    assert.ok(Waves.spawnInterval(5) < Waves.spawnInterval(2));
    assert.equal(Waves.spawnInterval(100), 12);
  });

  it('zumbis rapidos so aparecem a partir da horda 2, com maximo de 50%', () => {
    assert.equal(Waves.runnerChance(1), 0);
    assert.ok(Waves.runnerChance(2) > 0);
    assert.equal(Waves.runnerChance(100), 0.5);
  });
});

describe('ciclo da horda', () => {
  let waves, enemies;
  beforeEach(() => { waves = new Waves(); enemies = new Enemies(); });

  it('comeca num intervalo e espera o jogador, sem inimigos', () => {
    assert.equal(waves.wave, 0);
    run(waves, enemies, 5000);
    assert.equal(waves.wave, 0, 'nao comeca sozinha');
    assert.equal(enemies.getEnemies().length, 0);
    assert.equal(waves.attributes(enemies).intermission, true);
  });

  it('a horda 1 comeca quando o jogador pede e solta so os inimigos dela, aos poucos', () => {
    waves.start();
    run(waves, enemies, 2);                   // um tick comeca a horda, o seguinte solta o primeiro
    assert.equal(waves.wave, 1);
    assert.equal(enemies.getEnemies().length, 1, 'comeca com um so');
    run(waves, enemies, 2000);
    assert.equal(enemies.getEnemies().length, Waves.enemiesInWave(1));
  });

  it('a horda 1 so tem zumbis comuns', () => {
    waves.start();
    run(waves, enemies, 2200);
    assert.ok(enemies.getEnemies().every((e) => e instanceof StandardZombie && !(e instanceof RunningZombie)));
  });

  it('a proxima horda so vem depois de matar todos e de o jogador pedir', () => {
    waves.start();
    run(waves, enemies, 2200);
    waves.start();                            // apertar espaco no meio da horda nao faz nada
    run(waves, enemies, 1000);
    assert.equal(waves.wave, 1, 'com inimigos vivos nao avanca');

    kill(enemies);
    run(waves, enemies, 1);
    assert.equal(waves.attributes(enemies).intermission, true);
    run(waves, enemies, 3000);
    assert.equal(waves.wave, 1, 'o espaco de antes nao vale para a proxima');
    waves.start();
    run(waves, enemies, 1);
    assert.equal(waves.wave, 2);
  });

  it('a horda 2 tem mais inimigos que a 1', () => {
    waves.start();
    run(waves, enemies, 2200); kill(enemies); enemies.reset();
    run(waves, enemies, 1);
    waves.start();
    run(waves, enemies, 2500);
    assert.equal(enemies.getEnemies().length, Waves.enemiesInWave(2));
  });

  it('nao passa de 30 inimigos vivos ao mesmo tempo', () => {
    waves.wave = 19; // 61 inimigos
    waves.state = 'active'; waves.remaining = Waves.enemiesInWave(20); waves.spawn_timer = 0;
    run(waves, enemies, 3000);
    assert.ok(enemies.getEnemies().length <= 30);
    assert.ok(waves.remaining > 0);
  });

  it('o HUD recebe horda, inimigos restantes e contagem', () => {
    assert.deepEqual(waves.attributes(enemies), { wave: 0, next_wave: 1, intermission: true, enemies_left: 0 });
    waves.start();
    run(waves, enemies, 1);
    assert.equal(waves.attributes(enemies).enemies_left, 4);
  });

  it('reset volta ao comeco', () => {
    waves.start();
    run(waves, enemies, 500);
    waves.reset();
    assert.equal(waves.wave, 0);
    assert.equal(waves.remaining, 0);
  });
});

describe('integracao com o jogo', () => {
  it('resetGame reinicia as hordas e o update do jogo avanca a horda', () => {
    const main = Main.instance();
    main.resetGame();
    main.waves.start();
    for (let i = 0; i < 5; i += 1) main.update();
    assert.equal(main.getWavesInstance().wave, 1);
    assert.ok(main.getEnemiesInstance().getEnemies().length >= 1);
    main.resetGame();
    assert.equal(main.getWavesInstance().wave, 0);
    assert.equal(main.getEnemiesInstance().getEnemies().length, 0);
  });

  describe('espaco comeca a horda', () => {
    const main = Main.instance();
    const waves = main.getWavesInstance();
    beforeEach(() => { main.addPauseListeners(); main.resetGame(); });

    it('apertar espaco no intervalo comeca a proxima horda', () => {
      main.update();
      assert.equal(waves.wave, 0);
      fire('keydown', ' ');
      main.update();
      assert.equal(waves.wave, 1);
    });

    it('com o jogo pausado o espaco nao comeca a horda', () => {
      main.setPaused(true);
      fire('keydown', ' ');
      main.setPaused(false);
      main.update();
      assert.equal(waves.wave, 0);
    });

    it('fora da partida (menu, game over) o espaco nao mexe nas hordas', () => {
      main.finishGame();
      fire('keydown', ' ');
      assert.equal(waves.ready, false);
    });

    it('segurar o espaco (tecla repetida) nao comeca a horda', () => {
      const repeat = { key: ' ', repeat: true };
      main.onKeyDown(repeat);
      assert.equal(waves.ready, false);
    });
  });
});
