import Canvas from "./models/Canvas.js";
import IngameInterface from "./models/IngameInterface.js";
import Particles from "./models/particles/Particles.js";
import Player from "./models/Player.js";
import Controls from "./models/Controls.js";

const player = new Player();
const ingame_interface = new IngameInterface(player);
const particles = new Particles();

Controls.addEventListeners();

const gameLoop = () => {
  Canvas.draw([
    particles,
    player,
    ingame_interface,
  ]);

  requestAnimationFrame(gameLoop);
}

gameLoop();
  
