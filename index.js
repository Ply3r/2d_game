import Canvas from "./models/Canvas.js";
import Particles from "./models/Particles.js";
import Player from "./models/Player.js";

const player = new Player();
const particles = new Particles();

const gameLoop = () => {
  Canvas.draw([
    particles,
    player,
  ]);

  requestAnimationFrame(gameLoop);
}

gameLoop();
  
