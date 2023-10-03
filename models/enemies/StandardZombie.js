import Enemy from "./Enemy.js";

class StandardZombie extends Enemy {
  constructor(position) {
    super({
      life: 3,
      strength: 1,
      speed: 5,
      size: { x: 80, y: 100 },
      position: position,
      name: 'standard_zombie',
      total_sprites: 6
    })
  }

  move() {
    super.move();

    if (Math.random() < 0.2) this.generateRandomMove();
  }

  generateRandomMove() {
    if (Math.random() > 0.5) this.position.x += Math.random() > 0.5 ? 1 : -1 * this.speed * 2;
    if (Math.random() > 0.5) this.position.y += Math.random() > 0.5 ? 1 : -1 * this.speed * 2;
  }
}

export default StandardZombie
