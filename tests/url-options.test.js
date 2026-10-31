import './helpers/env.js';
import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import Main from '../models/Main.js';
import Waves from '../models/config/Waves.js';
import { startingWave, startingPowerups } from '../models/config/UrlOptions.js';

const main = Main.instance();
const withUrl = (search) => { globalThis.location = { search }; };

describe('opcoes de teste pela URL', () => {
  afterEach(() => { delete globalThis.location; main.resetGame(); });

  it('sem parametros, tudo normal', () => {
    assert.equal(startingWave(), 1);
    assert.deepEqual(startingPowerups(), {});
    withUrl('');
    assert.equal(startingWave(), 1);
  });

  it('?horda=N comeca a partida na horda N', () => {
    withUrl('?horda=7');
    const waves = new Waves();
    assert.equal(waves.attributes(main.getEnemiesInstance()).next_wave, 7);
    waves.start();
    waves.update(main.getEnemiesInstance());
    assert.equal(waves.wave, 7);
    assert.equal(waves.remaining, Waves.enemiesInWave(7));
  });

  it('horda invalida comeca na 1', () => {
    for (const value of ['0', '-3', 'abc', '']) {
      withUrl(`?horda=${value}`);
      assert.equal(startingWave(), 1, value);
    }
    withUrl('?horda=4.8');
    assert.equal(startingWave(), 4);
  });

  it('?powerups= da os niveis pedidos, respeitando o limite do escudo', () => {
    withUrl('?powerups=shield:9,damage:2,xx:3,fire_rate:abc,multishot:0');
    assert.deepEqual(startingPowerups(), { shield: 3, damage: 2 });
  });

  it('as duas opcoes juntas valem numa partida nova', () => {
    withUrl('?horda=5&powerups=shield:3');
    main.resetGame();
    assert.equal(main.getWavesInstance().wave, 4);
    assert.equal(main.getPlayerInstance().powerups.shield, 3);
  });
});
