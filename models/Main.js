import InGame from "./screens/InGame.js";
import Player from "./config/Player.js";
import Enemies from "./enemies/Enemies.js";
import ItemUpdater from "./config/ItemUpdater.js";
import Controls from "./config/Controls.js";
import GameEvents from "./config/GameEvents.js";
import Canvas from "./config/Canvas.js";
import Menu from "./screens/Menu.js";
import GameOver from "./screens/GameOver.js";

let instance = null;

class Main {
  constructor() {
    this.player = new Player();
    this.inGame = new InGame();
    this.enemies = new Enemies();
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
    this.enemies.update();
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
          this.gameOver ? new GameOver() : new Menu();
        }

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
        this.player,
        this.enemies,
        this.itemUpdater,
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
    this.enemiesSpawnRateInterval = GameEvents.createEnemies();
    document.body.style.cursor = 'none';
    this.resetGame();
  }

  finishGame() {
    this.gameOver = true;
    this.gameRunning = false;
    clearInterval(this.enemiesSpawnRateInterval);
  }

  resetGame() {
    this.gameRunning = true;
    this.gameOver = false;
    this.player.reset();
    this.enemies.reset();
    this.itemUpdater.reset();
  }

  getPlayerInstance() {
    return this.player;
  }

  getItemUpdaterInstance() {
    return this.itemUpdater;
  }

  getEnemiesInstance() {
    return this.enemies;
  }

  getInGameInstance() {
    return this.inGame;
  }
}

export default Main;

