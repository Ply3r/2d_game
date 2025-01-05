import Canvas from "../../config/Canvas.js";
import Weapon from "../Weapon.js";
import Main from "../../Main.js";

class Throable extends Weapon {
  IMPACT_TIME = 500;

  constructor({ strength, name, image, size, type, speed, impact_image, impact_size, distance, duration }) {
    super({ strength, name, image, size, type, distance });
    this.speed = speed;
    this.current_pos = null;
    this.duration = duration;
    this.impact_image = impact_image;
    this.impact_size = impact_size;
  }

  attack(_player_pos, _mouse_position) {
    const player = Main.instance().getPlayerInstance();
    // player.inventory[player.curr_item] = null;
  }

  explode(position) {
    const enemies = Main.instance().getEnemiesInstance().getEnemies();
    const enemies_in_area = enemies.filter(({ position: enemy_position }) => {
      return this.checkIfInAttackArea(enemy_position, position)
    });

    enemies_in_area.forEach((enemy) => enemy.getHit(this.strength));

    const player = Main.instance().getPlayerInstance();
    if (this.checkIfInAttackArea(player.position, position)) {
      player.getHit(this.strength)
    }
  }

  checkIfInAttackArea(enemy_position, position) {
    return enemy_position.x >= position.x - (this.impact_size.x / 2) &&
           enemy_position.x <= position.x + (this.impact_size.x / 2) &&
           enemy_position.y >= position.y - (this.impact_size.y / 2) &&
           enemy_position.y <= position.y + (this.impact_size.y / 2);
  }

  draw(player_pos, crosshair_pos) {
    this.drawTrajectory(player_pos, crosshair_pos);
    super.draw(player_pos, crosshair_pos);
  }

  drawTrajectory(player_pos, crosshair_pos) {
    const drawer = Canvas.drawer();
    drawer.setTransform(1, 0, 0, 1, player_pos.x, player_pos.y);
  
    // Calculate control point
    const controlX = (crosshair_pos.x - player_pos.x) / 2; // Midpoint X
    const controlY = Math.min(0, crosshair_pos.y - player_pos.y) - 400; // Make control point 200 units higher

    const direction = crosshair_pos.x > player_pos.x ? 1 : -1;

    drawer.strokeStyle = 'red';
    drawer.lineWidth = 5;

    drawer.beginPath();
    drawer.moveTo(direction * 40, 70); // Start at the player's position (0, 0)
    drawer.bezierCurveTo(direction * 40, 70, controlX, controlY, crosshair_pos.x - player_pos.x, crosshair_pos.y - player_pos.y); // Draw the bezier curve
    drawer.stroke();

    // Draw the "X" at the crosshair position
    const crosshairX = crosshair_pos.x - player_pos.x;
    const crosshairY = crosshair_pos.y - player_pos.y;
    const size = 20; // Size of the X

    drawer.beginPath();
    drawer.moveTo(crosshairX - size, crosshairY - size); // Top-left to bottom-right
    drawer.lineTo(crosshairX + size, crosshairY + size); // Bottom-right

    drawer.moveTo(crosshairX - size, crosshairY + size); // Bottom-left to top-right
    drawer.lineTo(crosshairX + size, crosshairY - size); // Top-right

    drawer.stroke(); // Apply stroke for the "X"
  }
}

export default Throable;
