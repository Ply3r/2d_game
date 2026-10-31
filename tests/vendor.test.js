import { fire, record } from './helpers/env.js';
import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import Main from '../models/Main.js';
import Images from '../models/config/Images.js';
import Vendor, { VENDOR_IMAGES, VENDOR_STOP_Y } from '../models/vendor/Vendor.js';
import { SHOP_IMAGE } from '../models/vendor/Shop.js';
import Controls from '../models/config/Controls.js';
import Clock from '../models/config/Clock.js';

const main = Main.instance();
const waves = main.getWavesInstance();
const enemies = main.getEnemiesInstance();
const vendor = main.getVendorInstance();

// Termina a horda `wave` (ja em andamento) matando todos, e roda o tick que abre o intervalo.
const finishWave = (wave) => {
  waves.wave = wave;
  waves.state = 'active';
  waves.remaining = 0;
  enemies.reset();
  main.update();
};
const ticks = (n) => { for (let i = 0; i < n; i += 1) main.update(); };
const untilStopped = () => { for (let i = 0; i < 2000 && vendor.state === 'arriving'; i += 1) main.update(); };
const space = () => fire('keydown', ' ');

describe('vendedor', () => {
  beforeEach(() => {
    main.addPauseListeners();
    main.resetGame();
    main.getPlayerInstance().invencible = true;
  });

  it('aparece no fim das hordas 5, 10, 15... e nao nas outras', () => {
    finishWave(4);
    assert.equal(vendor.isPresent(), false);
    main.resetGame();
    finishWave(5);
    assert.equal(vendor.state, 'arriving');
    main.resetGame();
    finishWave(10);
    assert.equal(vendor.state, 'arriving');
  });

  it('chega pela esquerda, desacelerando, e para no centro da parte de cima', () => {
    finishWave(5);
    assert.ok(vendor.x < 0, 'comeca fora da tela');
    const speeds = [];
    for (let i = 0; i < 2000 && vendor.state === 'arriving'; i += 1) { main.update(); speeds.push(vendor.speed); }
    assert.equal(vendor.state, 'stopped');
    assert.equal(vendor.x, window.innerWidth / 2);
    assert.ok(speeds.at(-1) < speeds[0], 'freia ao chegar');
  });

  it('diz "Bora comprar?" letra por letra depois de parar', () => {
    finishWave(5);
    untilStopped();
    assert.equal(vendor.message(), '');
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) { main.update(); seen.add(vendor.message()); }
    assert.equal(vendor.message(), 'Bora comprar?');
    assert.ok(seen.has('B') && seen.has('Bora') && seen.has('Bora comprar'), 'aparece aos poucos');
  });

  it('espaco antes de ele parar nao faz nada', () => {
    finishWave(5);
    ticks(5);
    space();
    assert.equal(vendor.state, 'arriving');
  });

  it('com espaco ele vai embora, e os zumbis so vem depois que ele sai da tela', () => {
    finishWave(5);
    untilStopped();
    ticks(20);
    space();
    assert.equal(vendor.state, 'leaving');

    let left_at = null;
    for (let i = 0; i < 2000 && left_at === null; i += 1) {
      main.update();
      if (!vendor.isPresent()) left_at = i;
      else assert.equal(waves.wave, 5, 'a horda nao comeca com ele na tela');
      if (vendor.isPresent()) assert.equal(enemies.getEnemies().length, 0);
    }
    assert.ok(left_at !== null, 'saiu da tela');
    main.update();                            // a horda comeca no tick seguinte
    assert.equal(waves.wave, 6);
    ticks(2);
    assert.ok(enemies.getEnemies().length >= 1, 'zumbis voltam a aparecer');
  });

  it('sai pela direita, acelerando', () => {
    finishWave(5);
    untilStopped();
    space();
    const xs = [];
    while (vendor.isPresent()) { main.update(); if (vendor.isPresent()) xs.push(vendor.x); }
    assert.ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), 'sempre para a direita');
    assert.ok(xs.at(-1) > window.innerWidth);
  });

  it('com o jogo pausado o espaco nao manda ele embora', () => {
    finishWave(5);
    untilStopped();
    main.setPaused(true);
    space();
    main.setPaused(false);
    assert.equal(vendor.state, 'stopped');
  });

  it('uma partida nova tira o vendedor da tela', () => {
    finishWave(5);
    untilStopped();
    main.resetGame();
    assert.equal(vendor.isPresent(), false);
  });

  describe('colisao', () => {
    const player = main.getPlayerInstance();
    const overlapsVan = () => {
      const box = vendor.hitbox();
      const body = player.hitbox();
      const ox = Math.min(body.x + body.w, box.x + box.w) - Math.max(body.x, box.x);
      const oy = Math.min(body.y + body.h, box.y + box.h) - Math.max(body.y, box.y);
      return ox > 0.5 && oy > 0.5;
    };

    it('parada, o jogador nao atravessa a van', () => {
      finishWave(5);
      untilStopped();
      const box = vendor.hitbox();
      player.position = { x: box.x + box.w / 2, y: box.y + 10 };   // no meio da base
      main.update();
      assert.ok(!overlapsVan());
      assert.deepEqual(player.knockback, { x: 0, y: 0 }, 'parada nao empurra');
    });

    it('a base e a parte de baixo da van: atras da parte alta o jogador passa', () => {
      finishWave(5);
      untilStopped();
      const box = vendor.hitbox();
      const before = { x: box.x + box.w / 2, y: box.y - 90 };      // pes logo acima da base
      player.position = { ...before };
      main.update();
      assert.deepEqual(player.position, before);
    });

    it('chegando, atropela quem esta na frente e joga para a frente', () => {
      finishWave(5);
      ticks(30);
      const box = vendor.hitbox();
      player.position = { x: box.x + box.w + 30, y: box.y + box.h - 80 };   // na frente da van, na mesma faixa
      let hit_at = null;
      for (let i = 0; i < 300 && hit_at === null; i += 1) {
        main.update();
        if (player.knockback.x > 0) hit_at = i;
      }
      assert.ok(hit_at !== null, 'foi atropelado');
      const van = vendor.hitbox();
      assert.ok(player.hitbox().x >= van.x + van.w - 1e-9, 'ficou na frente do para-choque');
      const x = player.position.x;
      main.update();
      assert.ok(player.position.x > x, 'continua sendo jogado para a frente');
    });

    it('quanto mais rapido a van, mais forte o empurrao', () => {
      const push = (speed) => {
        main.resetGame();
        finishWave(5);
        vendor.speed = speed;
        const box = vendor.hitbox();
        player.position = { x: box.x + box.w - 10, y: box.y + 10 };
        vendor.collide(player);
        return player.knockback.x;
      };
      assert.ok(push(9) > push(2));
    });

    it('o empurrao perde forca e para, sem tirar o jogador da tela', () => {
      player.position = { x: window.innerWidth - 200, y: 300 };
      player.knockBack(40);
      for (let i = 0; i < 120; i += 1) player.updateKnockback();
      assert.equal(player.knockback.x, 0);
      assert.ok(player.hitbox().x + player.hitbox().w <= window.innerWidth);
    });

    it('indo embora tambem atropela, e na borda da tela tira o jogador pelo lado', () => {
      finishWave(5);
      untilStopped();
      space();
      ticks(10);
      const box = vendor.hitbox();
      player.position = { x: window.innerWidth - 40, y: box.y + box.h - 80 };
      for (let i = 0; i < 400 && vendor.isPresent(); i += 1) {
        main.update();
        if (vendor.isPresent()) assert.ok(!overlapsVan(), `dentro da van no tick ${i}`);
      }
    });

    it('a caixa de suprimentos nao cai onde a van estaciona', () => {
      const airdrops = main.getAirdropsInstance();
      for (let i = 0; i < 40; i += 1) {
        main.resetGame();
        finishWave(5);
        const [crate] = airdrops.crates;
        const parked = Vendor.parkedHitbox();
        const area = { x: crate.landing.x, y: crate.landing.y, w: 64, h: 64 };
        assert.ok(!(area.x < parked.x + parked.w && area.x + area.w > parked.x && area.y < parked.y + parked.h && area.y + area.h > parked.y), JSON.stringify(area));
      }
    });
  });

  describe('desenho', () => {
    const drawCalls = () => record(() => vendor.draw());
    const images = (calls) => calls.filter((c) => c[0] === 'drawImage');

    it('andando: quadro da tira de 9 quadros, espelhado', () => {
      finishWave(5);
      ticks(10);
      const calls = drawCalls();
      const [image] = images(calls);
      assert.equal(image[1], Images.get(VENDOR_IMAGES[0]));
      assert.equal(image[2], vendor.frame * 256, 'recorte do quadro atual');
      assert.ok(calls.some((c) => c[0] === 'scale' && c[1] === -3 && c[2] === 3), 'espelhada (indo para a direita), em 3x');
    });

    it('a animacao troca de quadro andando', () => {
      finishWave(5);
      const frames = new Set();
      for (let i = 0; i < 40; i += 1) { main.update(); frames.add(vendor.frame); }
      assert.ok(frames.size > 5);
    });

    it('parado: congela no primeiro quadro (sem fumaca), em 3x, e mostra o balao', () => {
      finishWave(5);
      untilStopped();
      ticks(100);
      const calls = drawCalls();
      const parked = images(calls);
      assert.equal(parked.length, 1);
      assert.equal(parked[0][1], Images.get(VENDOR_IMAGES[1]));
      assert.ok(calls.some((c) => c[0] === 'scale' && c[1] === -3 && c[2] === 3));
      const frames = new Set();
      for (let i = 0; i < 40; i += 1) { main.update(); frames.add(images(drawCalls())[0][1]); }
      assert.equal(frames.size, 1, 'parada nao anima');
      const text = calls.find((c) => c[0] === 'fillText');
      assert.equal(text[1], 'Bora comprar?');
      assert.ok(text[2] > vendor.x, 'balao a direita da van');
      assert.ok(text[3] < VENDOR_STOP_Y, 'na altura da janela do motorista');
    });

    it('fora da tela nao desenha nada', () => {
      assert.equal(drawCalls().length, 0);
    });

    it('os sprites existem', async () => {
      for (const path of VENDOR_IMAGES) await assert.doesNotReject(readFile(path), path);
    });
  });

  describe('HUD', () => {
    const hud = () => record(() => main.getInGameInstance().draw()).filter((c) => c[0] === 'fillText');
    const real_now = Date.now;

    it('so pede o espaco depois que o vendedor para, e o anuncio fica embaixo da van', () => {
      Date.now = () => 1e9;
      try {
        finishWave(5);
        ticks(3);
        assert.ok(!hud().some((c) => c[1].includes('ESPAÇO')), 'chegando: nao pede ainda');
        untilStopped();
        const calls = hud();
        assert.ok(calls.some((c) => c[1].includes('ESPAÇO')));
        const title = calls.find((c) => c[1] === 'HORDA 6');
        assert.ok(title[3] > VENDOR_STOP_Y, 'abaixo da van');
      } finally {
        Date.now = real_now;
      }
    });
  });

  it('pode ser usado sozinho, avisando quando sai', () => {
    let left = false;
    const solo = new Vendor({ onLeave: () => { left = true; } });
    solo.arrive();
    for (let i = 0; i < 2000 && solo.state === 'arriving'; i += 1) solo.update();
    assert.equal(solo.dismiss(), true);
    for (let i = 0; i < 2000 && solo.isPresent(); i += 1) solo.update();
    assert.equal(left, true);
  });
});

describe('conversa com o vendedor', () => {
  const player = main.getPlayerInstance();
  const shop = main.getShopInstance();
  const mouse = Controls.getMousePosition();
  const onVan = () => { const r = vendor.bodyRect(); mouse.x = r.x + r.w / 2; mouse.y = r.y + r.h / 2; };
  const click = () => fire('click');
  let shots = 0;

  beforeEach(() => {
    main.addPauseListeners();
    main.resetGame();
    player.invencible = true;
    mouse.x = 0;
    mouse.y = 0;
    shots = 0;
    const weapon = player.inventory[player.curr_item];
    weapon.attack = () => { shots += 1; };
  });
  after(() => { mouse.x = 0; mouse.y = 0; main.resetGame(); });

  const parked = () => { finishWave(5); untilStopped(); };

  it('o mouse sobre a van parada troca a mira pelo balao de conversa', () => {
    parked();
    const images = () => record(() => main.getInGameInstance().drawCrosshair()).filter((c) => c[0] === 'drawImage').map((c) => c[1]);
    assert.deepEqual(images(), [Images.get('./assets/crosshair.png')]);
    onVan();
    assert.deepEqual(images(), [Images.get('./assets/vendor/talk_cursor.png')]);
  });

  it('andando a van nao conversa', () => {
    finishWave(5);
    ticks(30);
    onVan();
    assert.equal(main.isMouseOverVendor(), false);
    click();
    assert.equal(shop.isOpen(), false);
  });

  it('clicar na van abre a tela do vendedor, sem atirar', () => {
    parked();
    onVan();
    click();
    assert.equal(shop.isOpen(), true);
    assert.equal(shots, 0);
    mouse.x = 0;
    click();
    assert.equal(shots, 0, 'com a tela aberta nao atira');
  });

  it('clicar fora da van atira normalmente', () => {
    parked();
    click();
    assert.equal(shop.isOpen(), false);
    assert.equal(shots, 1);
  });

  it('o vendedor repete "Bora comprar?" letra por letra', () => {
    parked();
    onVan();
    click();
    assert.equal(shop.message(), '');
    const seen = new Set();
    for (let i = 0; i < 100; i += 1) { shop.update(); seen.add(shop.message()); }
    assert.equal(shop.message(), 'Bora comprar?');
    assert.ok(seen.has('B') && seen.has('Bora') && seen.has('Bora comprar'));
  });

  it('desenha o close da van ocupando a tela, com o balao acima do vendedor', () => {
    parked();
    onVan();
    click();
    for (let i = 0; i < 100; i += 1) shop.update();
    const calls = record(() => shop.draw());
    const image = calls.find((c) => c[0] === 'drawImage');
    assert.equal(image[1], Images.get(SHOP_IMAGE));
    assert.equal(image[2] + image[4], window.innerWidth, 'encostada na direita');
    assert.ok(image[2] + 4 * image[4] / 256 <= 0, 'cobre a esquerda');
    assert.ok(image[3] + 59 * image[5] / 256 <= 0 && image[3] + 252 * image[5] / 256 >= window.innerHeight, 'cobre de cima a baixo');
    const text = calls.find((c) => c[0] === 'fillText' && c[1] === 'Bora comprar?');
    assert.ok(text && text[2] >= 0 && text[3] >= 0 && text[3] < window.innerHeight / 2);
  });

  it('Esc fecha a tela sem pausar, e a van continua esperando', () => {
    parked();
    onVan();
    click();
    fire('keydown', 'Escape');
    assert.equal(shop.isOpen(), false);
    assert.equal(main.paused, false);
    assert.equal(vendor.state, 'stopped');
    fire('keydown', 'Escape');
    assert.equal(main.paused, true, 'fora da tela do vendedor o Esc pausa');
    main.setPaused(false);
  });

  it('com a tela aberta o espaco nao manda a van embora e o relogio do jogo para', () => {
    parked();
    onVan();
    click();
    space();
    assert.equal(vendor.state, 'stopped');
    assert.equal(Clock.isPaused(), true);
    fire('keydown', 'Escape');
    assert.equal(Clock.isPaused(), false);
  });

  it('a imagem do close e o cursor existem', async () => {
    for (const path of [SHOP_IMAGE, './assets/vendor/talk_cursor.png']) await assert.doesNotReject(readFile(path), path);
  });
});
