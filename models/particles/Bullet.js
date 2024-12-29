import Particle from "./Particle.js";
import Canvas from "../config/Canvas.js";
import GameEvents from "../config/GameEvents.js";
import Main from "../Main.js";

class Bullet extends Particle {
  constructor({ start_pos, end_pos }) {
    const final_position = Bullet.getBulletFinalPosition(start_pos, end_pos);
    super({ start_pos, end_pos: final_position, speed: 50, size: 10 });
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

  static getBulletFinalPosition(first_position, mouse_position) {
    // Calculate the direction vector from the player to the mouse position
    const direction = {
      x: mouse_position.x - first_position.x,
      y: mouse_position.y - first_position.y,
    };

    // Normalize the direction vector
    const magnitude = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    const normalizedDirection = {
      x: direction.x / magnitude,
      y: direction.y / magnitude,
    };

    // Calculate the endpoint of the bullet at the screen's edge
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Find the scale factor to extend the bullet to the edge of the screen
    const scaleFactor = Math.max(
      Math.abs(screenWidth / normalizedDirection.x),
      Math.abs(screenHeight / normalizedDirection.y)
    );

    // Compute the end position
    const end_position = {
      x: first_position.x + normalizedDirection.x * scaleFactor,
      y: first_position.y + normalizedDirection.y * scaleFactor,
    };

    return end_position;
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
