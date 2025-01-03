import Enemy from "./Enemy.js";

class StandardZombie extends Enemy {
  constructor(position) {
    super({
      life: 3,
      strength: 2,
      speed: 3,
      size: { x: 120, y: 120 },
      position: position,
      name: 'standard_zombie',
      total_sprites: 6
    })
  }

  move() {
    super.move();
  }
}

export default StandardZombie
