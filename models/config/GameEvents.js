import TommyGun from "../weapons/guns/TommyGun.js";
import TecNine from "../weapons/guns/TecNine.js";
import Knife from "../weapons/melee/Knife.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";

class GameEvents {
  static randomWeapon(type = null) {
    const types = ['Gun', 'Melee'];

    if (!type) type = types[Math.floor(Math.random() * types.length)];
    return this[`random${type}`]();
  }

  static randomGun() {
    const guns = [TommyGun, TecNine];
    const random_index = Math.floor(Math.random() * guns.length);

    return new guns[random_index]();
  }

  static randomMelee() {
    const weapons = [Knife];
    const random_index = Math.floor(Math.random() * weapons.length);

    return new weapons[random_index]();
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

  static getNextPointInParabola(first_pos, final_pos, speed) {
    const x1 = first_pos.x, y1 = first_pos.y;
    const x2 = final_pos.x, y2 = final_pos.y;
  
    // Calculate parabola coefficients
    const peak_x = (x1 + x2) / 2; // Optional: Assume peak is at midpoint
    const peak_y = Math.max(y1, y2) + 10; // Optional: Peak is 10 units above the higher point
  
    // Solve for a, b, and c
    const c = y1;
    const b = ((y2 - c) - ((peak_y - c) / (peak_x - x1)) * (x2 - x1)) / (x2 - x1);
    const a = (peak_y - c - b * (peak_x - x1)) / (peak_x - x1) ** 2;
  
    // Calculate next point
    const direction = x1 < x2 ? 1 : -1; // Determine horizontal movement direction
    const deltaX = speed * direction;   // Move horizontally by speed
    const nextX = first_pos.x + deltaX;
  
    // Use the parabola equation to find the corresponding y
    const nextY = a * nextX ** 2 + b * nextX + c;
  
    return { x: nextX, y: nextY };
  }
}

export default GameEvents;
