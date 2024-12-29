import TommyGun from "../guns/TommyGun.js";
import TecNine from "../guns/TecNine.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";

class GameEvents {
  static randomGun() {
    const guns = [TommyGun];
    const random_index = Math.floor(Math.random() * guns.length);

    return new guns[random_index]();
  }

  static createEnemies() {
    const ENEMY_SPAWN_RATE = 1000;

    return setInterval(() => {
      Main.instance().getEnemiesInstance().create();
    }, ENEMY_SPAWN_RATE)
  }

  static checkCollision(first_element, second_element) {
    const { position: f_pos, size: f_size } = first_element.attributes();
    const { position: s_pos, size: s_size } = second_element.attributes();
    const tolerance = 0.01; // Adjust as needed
  
    return (
      f_pos.x < s_pos.x + s_size.x + tolerance &&
      f_pos.x + f_size.x > s_pos.x - tolerance &&
      f_pos.y < s_pos.y + s_size.y + tolerance &&
      f_pos.y + f_size.y > s_pos.y - tolerance
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
