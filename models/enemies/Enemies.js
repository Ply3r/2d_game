import StandardZombie from "./StandardZombie.js";
import RunningZombie from "./RunningZombie.js";

class Enemies {
  constructor() {
    this.enemies_array = [];
    this.possible_options = [StandardZombie, RunningZombie]
  }

  create() {
    const random_enemy = this.possible_options[Math.floor(Math.random() * this.possible_options.length)];

    const random_position = (ceil) => {
      const random_direction = () => Math.random() > 0.5 ? 1 : -1;
      let pos = Math.random() * ceil;
      pos += random_direction() * pos;

      return pos;
    }

    this.enemies_array.push(new random_enemy({ x: random_position(window.innerWidth), y: random_position(window.innerHeight) }));
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