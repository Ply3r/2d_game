import IngameInterface from "./config/IngameInterface.js";
import Player from "./config/Player.js";
import Enemies from "./enemies/Enemies.js";
import ItemUpdater from "./config/ItemUpdater.js";
import Controls from "./config/Controls.js";
import GameEvents from "./config/GameEvents.js";
import Canvas from "./config/Canvas.js";

let instance = null;

class Main {
  constructor() {
    this.player = new Player();
    this.ingame_interface = new IngameInterface();
    this.enemies = new Enemies();
    this.itemUpdater = new ItemUpdater();
    this.fps = 60;
  }

  static instance() {
    if (!instance) {
      instance = new Main();
    }

    return instance;
  }

  startGame() {
    Controls.addEventListeners();
    GameEvents.createEnemies();

    const frameDuration = 1000 / this.fps;
    let lastFrameTime = performance.now();

    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameDuration) {
        lastFrameTime = currentTime;

        Canvas.draw([
          this.itemUpdater,
          this.player,
          this.enemies,
          this.ingame_interface,
        ]);
      }
      
      requestAnimationFrame(gameLoop);
    }
    
    gameLoop(performance.now());
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

  getIngameInterfaceInstance() {
    return this.ingame_interface;
  }
}

export default Main;

