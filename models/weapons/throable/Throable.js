import Canvas from "../../config/Canvas.js";
import Weapon from "../Weapon.js";
import Main from "../../Main.js";
import GameEvents from "../../config/GameEvents.js";

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

  // Item arremessavel nao recarrega: 'r' nao faz nada.
  reload() {}

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
    drawer.setTransform(1, 0, 0, 1, 0, 0);

    const [start, control_start, control_end, end] = GameEvents.getThrowPath(player_pos, crosshair_pos);

    drawer.strokeStyle = 'red';
    drawer.lineWidth = 5;

    drawer.beginPath();
    drawer.moveTo(start.x, start.y);
    drawer.bezierCurveTo(control_start.x, control_start.y, control_end.x, control_end.y, end.x, end.y);
    drawer.stroke();

    // Draw the "X" at the target position
    const size = 20; // Size of the X

    drawer.beginPath();
    drawer.moveTo(end.x - size, end.y - size); // Top-left to bottom-right
    drawer.lineTo(end.x + size, end.y + size);

    drawer.moveTo(end.x - size, end.y + size); // Bottom-left to top-right
    drawer.lineTo(end.x + size, end.y - size);

    drawer.stroke();
  }
}

export default Throable;
