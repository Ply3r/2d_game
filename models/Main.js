import InGame from "./screens/InGame.js";
import Player from "./config/Player.js";
import Enemies from "./enemies/Enemies.js";
import Waves from "./config/Waves.js";
import Airdrops from "./airdrops/Airdrops.js";
import GameMap from "./map/GameMap.js";
import ItemUpdater from "./config/ItemUpdater.js";
import Controls from "./config/Controls.js";
import Canvas from "./config/Canvas.js";
import Menu from "./screens/Menu.js";
import GameOver from "./screens/GameOver.js";
import Pause from "./screens/Pause.js";
import Clock from "./config/Clock.js";

let instance = null;

class Main {
  constructor() {
    this.player = new Player();
    this.inGame = new InGame();
    this.enemies = new Enemies();
    this.waves = new Waves();
    this.airdrops = new Airdrops();
    this.map = new GameMap();
    this.airdropSky = { draw: () => this.airdrops.drawAir() };
    this.mapDecor = { draw: () => this.map.drawDecor() };
    this.world = { draw: () => this.drawWorld() };
    this.itemUpdater = new ItemUpdater();
    this.pauseScreen = new Pause();

    this.gameRunning = false;
    this.gameOver = false;
    this.paused = false;
    this.pause_listeners = false;
    this.screen = null;
    this.fps = 60;
  }

  static instance() {
    if (!instance) {
      instance = new Main();
    }

    return instance;
  }

  // Um tick de logica: a velocidade do jogo e medida em ticks (this.fps por segundo),
  // independente da taxa de atualizacao do monitor.
  update() {
    this.player.update();
    if (this.waves.update(this.enemies) === 'cleared') this.airdrops.spawn();
    this.enemies.update();
    this.airdrops.update();
    this.airdrops.resolveCollisions();
    this.map.resolveCollisions([this.player, ...this.enemies.getEnemies().filter((enemy) => enemy.isVisible())]);
    this.itemUpdater.update();
  }

  start() {
    const tickDuration = 1000 / this.fps;
    const MAX_TICKS_PER_FRAME = 5; // evita a "espiral da morte" apos o jogo ficar em segundo plano
    let lastFrameTime = performance.now();
    let accumulated = 0;

    const gameLoop = (currentTime) => {
      if (!this.gameRunning) {
        // Cada tela registra listeners no construtor, entao so e criada quando o estado muda.
        const screen = this.gameOver ? 'game_over' : 'menu';

        if (this.screen !== screen) {
          this.screen = screen;
          this.screenInstance = this.gameOver ? new GameOver() : new Menu();
        }

        // Redesenha todo quadro: o mapa e as imagens carregam depois do primeiro desenho.
        this.screenInstance.draw();

        lastFrameTime = currentTime;
        accumulated = 0;
        return requestAnimationFrame(gameLoop);
      }

      // Pausado: nada atualiza, o jogo congelado fica por tras da tela de pause.
      if (this.paused) {
        Canvas.draw([...this.scene(), this.pauseScreen]);
        lastFrameTime = currentTime;
        accumulated = 0;
        return requestAnimationFrame(gameLoop);
      }

      accumulated += currentTime - lastFrameTime;
      lastFrameTime = currentTime;

      let ticks = 0;
      while (accumulated >= tickDuration && this.gameRunning) {
        if (ticks === MAX_TICKS_PER_FRAME) {
          accumulated = 0;
          break;
        }

        this.update();
        accumulated -= tickDuration;
        ticks += 1;
      }

      Canvas.draw(this.scene());

      requestAnimationFrame(gameLoop);
    }

    gameLoop(performance.now());
  }

  // Camadas da partida, de baixo para cima.
  scene() {
    return [
      this.mapDecor,
      this.airdrops,
      this.world,
      this.itemUpdater,
      this.airdropSky,
      this.inGame,
    ];
  }

  // Solidos do mapa, jogador e zumbis em ordem de profundidade: quem tem os pes mais abaixo na tela
  // e desenhado depois (na frente). Assim quem passa atras de um cacto fica escondido por ele.
  drawWorld() {
    const drawer = Canvas.drawer();
    const feet = (body) => { const box = body.hitbox(); return box.y + box.h; };
    const actors = [this.player, ...this.enemies.getEnemies()].map((body) => ({ bottom: feet(body), draw: () => body.draw() }));

    // sort e estavel: no empate o solido (que vem antes) fica atras
    [...this.map.solidDrawables(), ...actors].sort((a, b) => a.bottom - b.bottom).forEach((item) => {
      drawer.setTransform(1, 0, 0, 1, 0, 0);
      item.draw();
    });
  }

  startGame() {
    if (this.gameRunning) return;

    this.screen = null;
    Controls.addEventListeners();
    this.addPauseListeners();
    document.body.style.cursor = 'none';
    this.resetGame();
  }

  // Esc pausa e despausa; com o jogo pausado, M volta ao menu. Trocar de aba ou de janela tambem pausa.
  // Espaco continua depois das hordas que esperam o jogador (5, 10, 15...).
  addPauseListeners() {
    if (this.pause_listeners) return;
    this.pause_listeners = true;

    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('blur', () => this.setPaused(true));
  }

  // O espaco que comeca a partida no menu chega antes deste listener existir (ou com o jogo parado),
  // e segurar a tecla (repeat) nao pula a espera sem querer.
  onKeyDown(event) {
    if (!this.gameRunning || event.repeat) return;

    const key = event.key.toLowerCase();
    if (key === 'escape') this.setPaused(!this.paused);
    else if (key === 'm' && this.paused) this.quitToMenu();
    else if (key === ' ' && !this.paused) this.waves.start();
  }

  setPaused(paused) {
    if (!this.gameRunning || this.paused === paused) return;

    this.paused = paused;
    if (paused) Clock.pause();
    else Clock.resume();

    // Teclas e clique seguros no momento do pause nao devem continuar valendo ao voltar.
    Controls.releaseAll();
    document.body.style.cursor = paused ? 'auto' : 'none';
  }

  quitToMenu() {
    this.setPaused(false);
    this.gameRunning = false;
    this.gameOver = false;
    this.screen = null;
  }

  finishGame() {
    this.gameOver = true;
    this.gameRunning = false;
  }

  resetGame() {
    this.setPaused(false);
    this.gameRunning = true;
    this.gameOver = false;
    this.player.reset();
    this.enemies.reset();
    this.waves.reset();
    this.airdrops.reset();
    this.itemUpdater.reset();
  }

  getPlayerInstance() {
    return this.player;
  }

  getItemUpdaterInstance() {
    return this.itemUpdater;
  }

  getWavesInstance() {
    return this.waves;
  }

  getMapInstance() {
    return this.map;
  }

  getAirdropsInstance() {
    return this.airdrops;
  }

  getEnemiesInstance() {
    return this.enemies;
  }

  getInGameInstance() {
    return this.inGame;
  }
}

export default Main;

