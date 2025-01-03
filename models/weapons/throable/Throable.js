import Weapon from "../Weapon";

class Throable extends Weapon {
  constructor({ name, image, size, type, speed, distance }) {
    super({ name, image, size, type, distance });
    this.speed = speed;
  }

  attack(player_pos, mouse_position) {

  }

  getNextPointInParabola(first_pos, final_pos, speed) {
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

export default Throable;
