import StandardZombie from "./StandardZombie.js";
import RunningZombie from "./RunningZombie.js";

class Enemies {
  constructor() {
    this.enemies_array = [];
    this.possible_options = [StandardZombie, RunningZombie]
  }

  reset() {
    this.enemies_array = [];
  }

  create() {
    const random_enemy = this.possible_options[Math.floor(Math.random() * this.possible_options.length)];

    const randomPositions = () => {
      const side = Math.floor(Math.random() * 4); // 0 = top, 1 = right, 2 = bottom, 3 = left
      let x, y;

      switch (side) {
        case 0: // Top
          x = Math.random() * window.innerWidth; // Anywhere along the top edge
          y = -50; // Above the screen
          break;
        case 1: // Right
          x = window.innerWidth + 50; // Beyond the right edge
          y = Math.random() * window.innerHeight; // Anywhere along the right edge
          break;
        case 2: // Bottom
          x = Math.random() * window.innerWidth; // Anywhere along the bottom edge
          y = window.innerHeight + 50; // Below the screen
          break;
        case 3: // Left
          x = -50; // Left of the screen
          y = Math.random() * window.innerHeight; // Anywhere along the left edge
          break;
      }

      return { x, y };
    }

    this.enemies_array.push(new random_enemy(randomPositions()));
  }

  draw() {
    this.enemies_array.forEach((enemy) => enemy.draw());
    this.update();
  }

  update() {
    this.enemies_array = this.enemies_array.map((enemy) => enemy.update());
    this.enemies_array = this.enemies_array.filter((enemy) => enemy.isVisible());
  }

  getEnemies() {
    return this.enemies_array;
  }
}

export default Enemies;