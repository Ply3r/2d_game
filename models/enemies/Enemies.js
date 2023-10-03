import StandardZombie from "./StandardZombie.js";

class Enemies {
  constructor() {
    this.enemies_array = [];
    this.possible_options = [StandardZombie]
  }

  create() {
    const random_enemy = this.possible_options[Math.floor(Math.random() * this.possible_options.length)];
    const random_position = { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }

    this.enemies_array.push(new random_enemy(random_position));
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