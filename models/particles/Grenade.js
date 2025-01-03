import Particle from "./Particle.js";
import Canvas from "../config/Canvas.js";
import GameEvents from "../config/GameEvents.js";
import Main from "../Main.js";

class Grenade extends Particle {
  constructor({ start_pos, end_pos }) {
    super({ start_pos, end_pos: end_pos, speed: 50, size: { x: 15, y: 15 } });
  }

  update() {
    super.update();
    this.checkColitionWithEnemies();

    return this;
  }

  checkColitionWithEnemies() {
    const enemies = Main.instance().getEnemiesInstance().getEnemies();

    enemies.forEach((enemy) => {
      if (enemy.attributes().invencible) return;

      const colision = GameEvents.checkCollision(this, enemy);

      if (colision) {
        enemy.getHit();
        this.visible = false;
      }
    })
  }

  updatePosition() {
    const { x, y } = GameEvents.getNextPointInParabola(this.curr_pos, this.end_pos, this.speed);
    this.curr_pos.x = x;
    this.curr_pos.y = y;
  }
}

export default Grenade;
