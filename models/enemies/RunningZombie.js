import Enemy from "./Enemy.js";

class RunningZombie extends Enemy {
  constructor(position) {
    super({
      life: 1,
      strength: 1,
      speed: 10,
      size: { x: 120, y: 120 },
      position: position,
      name: 'running_zombie',
      total_sprites: 6
    })
  }
}

export default RunningZombie;

