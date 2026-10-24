import StandardZombie from "./StandardZombie.js";
import RunningZombie from "./RunningZombie.js";
import GameEvents from "../config/GameEvents.js";

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
  }

  update() {
    this.enemies_array = this.enemies_array.map((enemy) => enemy.update());
    this.separate();
    this.enemies_array = this.enemies_array.filter((enemy) => enemy.isVisible());
  }

  // Zumbis que perseguem o mesmo ponto acabavam empilhados (um por cima do outro). Quando as
  // hitboxes se sobrepoem, empurra cada um metade da sobreposicao, pelo eixo mais raso.
  separate() {
    const enemies = this.enemies_array;

    for (let i = 0; i < enemies.length; i += 1) {
      for (let j = i + 1; j < enemies.length; j += 1) {
        const first = enemies[i];
        const second = enemies[j];
        if (!first.isVisible() || !second.isVisible()) continue;

        const a = first.hitbox();
        const b = second.hitbox();
        if (!GameEvents.rectsOverlap(a, b)) continue;

        const overlap_x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlap_y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        const a_center = first.center();
        const b_center = second.center();

        if (overlap_x < overlap_y) {
          const push = (overlap_x / 2) * (a_center.x <= b_center.x ? -1 : 1);
          first.position.x += push;
          second.position.x -= push;
        } else {
          const push = (overlap_y / 2) * (a_center.y <= b_center.y ? -1 : 1);
          first.position.y += push;
          second.position.y -= push;
        }
      }
    }
  }

  getEnemies() {
    return this.enemies_array;
  }
}

export default Enemies;