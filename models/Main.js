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
    this.itemUpdater = new ItemUpdater();

    this.gameRunning = false;
    this.gameOver = false;
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

      Canvas.draw([
        this.map,
        this.airdrops,
        this.player,
        this.enemies,
        this.itemUpdater,
        this.airdropSky,
        this.inGame,
      ]);

      requestAnimationFrame(gameLoop);
    }

    gameLoop(performance.now());
  }

  startGame() {
    if (this.gameRunning) return;

    this.screen = null;
    Controls.addEventListeners();
    document.body.style.cursor = 'none';
    this.resetGame();
  }

  finishGame() {
    this.gameOver = true;
    this.gameRunning = false;
  }

  resetGame() {
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

