import IngameInterface from "./IngameInterface.js";
import Player from "./Player.js";
import Enemies from "./enemies/Enemies.js";
import Particles from "./particles/Particles.js";
import Controls from "./Controls.js";
import GameEvents from "./GameEvents.js";
import Canvas from "./Canvas.js";

let instance = null;

class Main {
  constructor() {
    this.player = new Player();
    this.ingame_interface = new IngameInterface();
    this.enemies = new Enemies();
    this.particles = new Particles();
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

    const gameLoop = () => {
      Canvas.draw([
        this.particles,
        this.player,
        this.enemies,
        this.ingame_interface,
      ]);
    
      requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
  }

  getPlayerInstance() {
    return this.player;
  }

  getParticlesInstance() {
    return this.particles;
  }

  getEnemiesInstance() {
    return this.enemies;
  }

  getIngameInterfaceInstance() {
    return this.ingame_interface;
  }
}

export default Main;

