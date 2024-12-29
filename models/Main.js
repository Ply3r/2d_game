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
    this.fps = 60;
  }

  static instance() {
    if (!instance) {
      instance = new Main();
    }

    return instance;
  }

  start() {
    const frameDuration = 1000 / this.fps;
    let lastFrameTime = performance.now();

    const gameLoop = (currentTime) => {
      if (!this.gameRunning) {
        this.gameOver ? new GameOver() : new Menu();
        return requestAnimationFrame(gameLoop);
      }
    
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime >= frameDuration) {
        lastFrameTime = currentTime;

        Canvas.draw([
          this.itemUpdater,
          this.player,
          this.enemies,
          this.inGame,
        ]);
      }
      
      requestAnimationFrame(gameLoop);
    }
    
    gameLoop(performance.now());
  }

  startGame() {
    if (this.gameRunning) return;

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

