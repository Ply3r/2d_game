import Particle from "./Particle.js";
import Canvas from "../Canvas.js";
import GameEvents from "../GameEvents.js";
import Main from "../Main.js";

class Bullet extends Particle {
  constructor({ start_pos, end_pos, speed, size }) {
    super({ start_pos, end_pos, speed, size });
  }

  draw() {
    const drawer = Canvas.drawer();

    drawer.fillStyle = "rgb(255, 255, 255)";
    drawer.fillRect(this.curr_pos.x, this.curr_pos.y, this.size, this.size);
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
}

export default Bullet;
