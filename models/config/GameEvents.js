import TommyGun from "../weapons/guns/TommyGun.js";
import TecNine from "../weapons/guns/TecNine.js";
import Knife from "../weapons/melee/Knife.js";
import Grenade from "../weapons/throable/Grenade.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";

class GameEvents {
  static randomWeapon(type = null) {
    const types = {
      gun: [TommyGun, TecNine],
      melee: [Knife],
      throable: [Grenade]
    }
    
    const available_types = ['gun', 'melee', 'throable'];
    if (!type) type = available_types[Math.floor(Math.random() * available_types.length)];
    const random_index = Math.floor(Math.random() * types[type].length);

    return new types[type][random_index]();
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

  static getNextPositionOnBezier(start_pos, control_pos, end_pos, t0, t1) {
    if (t0 === 0.0 && t1 === 1.0) {
      // If t0 is 0 and t1 is 1, draw the entire Bezier curve
      return { x: start_pos.x, y: start_pos.y }
    }
    
    return GameEvents.calculatePointOnBezier(start_pos, control_pos, end_pos, t1);
  }

  static calculatePointOnBezier(start_pos, control_pos, end_pos, t) {
    const t0 = 1 - t;
    const t0Sq = t0 * t0;
    const t1 = 2 * t * t0;
    const t2 = t * t;

    // Calculate the position on the curve at t
    const nx = t0Sq * start_pos.x + t1 * control_pos.x + t2 * end_pos.x;
    const ny = t0Sq * start_pos.y + t1 * control_pos.y + t2 * end_pos.y;

    return { x: nx, y: ny };
}
}

export default GameEvents;
