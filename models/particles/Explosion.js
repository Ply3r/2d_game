import Particle from "./Particle.js";
class Explosion extends Particle {
  constructor({ start_pos, end_pos, speed, size, duration }) {
    super({ start_pos, end_pos, speed, size, image: '../../assets/weapons/Throable/grenade/explosion.png' });
    setTimeout(() => this.visible = false, duration);    
  }

  update() {
    return this;
  }
}

export default Explosion;
