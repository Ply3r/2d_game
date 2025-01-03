import Particle from "./Particle.js";
import GameEvents from "../config/GameEvents.js";
import Main from "../Main.js";

class Explosion extends Particle {
  constructor({ start_pos, end_pos, speed, size, duration }) {
    super({ start_pos, end_pos, speed, size, image: '../../assets/weapons/Throable/grenade/explosion.png' });
    this.start = null;
    this.duration = duration;
  }

  update() {
    super.update();
    return this;
  }

  updatePosition() {
    this.start ??= Date.now();

    const delta = Date.now() - this.start;
    const progress = Math.min(delta / this.duration, 1)

    if (progress === 1) {
      
      return this.visible = false;
    }

    const control_pos = { x: (this.end_pos.x) / 2, y: Math.min(0, this.end_pos.y) };
    const direction = this.end_pos.x > this.start_pos.x ? 1 : -1;
    let new_start_pos = { x: this.start_pos.x + (40 * direction), y: this.start_pos.y + 70 }
    
    this.curr_pos = GameEvents.getNextPositionOnBezier(new_start_pos, control_pos, this.end_pos, 0, progress);
  }
}

export default Grenade;
