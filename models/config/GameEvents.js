import TommyGun from "../guns/TommyGun.js";
import TecNine from "../guns/TecNine.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";

const ENEMY_SPAWN_RATE = 1000;

class GameEvents {
  static randomGun() {
    const guns = [TommyGun];
    const random_index = Math.floor(Math.random() * guns.length);

    return new guns[random_index]();
  }

  static createEnemies() {
    setInterval(() => {
      Main.instance().getEnemiesInstance().create();
    }, ENEMY_SPAWN_RATE)
  }

  static checkCollision(first_element, second_element) {
    const { position: f_pos, size: f_size } = first_element.attributes();
    const { position: s_pos, size: s_size } = second_element.attributes();
  
    return (
      f_pos.x < s_pos.x + s_size.x && // Right side of first is left of second
      f_pos.x + f_size.x > s_pos.x && // Left side of first is right of second
      f_pos.y < s_pos.y + s_size.y && // Bottom of first is above top of second
      f_pos.y + f_size.y > s_pos.y    // Top of first is below bottom of second
    );
  }

  static dropLoot(position) {
    if (Math.random() > 0.3) return;

    const possible_loots = [Ammunition, Heart];
    const random_index = Math.floor(Math.random() * possible_loots.length)
    Main.instance().getItemUpdaterInstance().create(new possible_loots[random_index](position))
  }

  static getNextPointInLine(first_point, second_point, speed) {
    const slope = (first_point.y - second_point.y) / (first_point.x - second_point.x);
    const direction = first_point.x > second_point.x ? -1 : 1;
    const deltaX = (speed * direction) / Math.sqrt(1 + slope ** 2);
    const deltaY = slope * deltaX;

    return { x: first_point.x + deltaX, y: first_point.y + deltaY }
  }
}

export default GameEvents;
