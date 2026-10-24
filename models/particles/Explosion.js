import Particle from "./Particle.js";
import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";

const FRAMES = 6;
const FRAME_SIZE = 500;   // lado de cada quadro da folha, em px

class Explosion extends Particle {
  constructor({ start_pos, end_pos, speed, size, duration }) {
    super({ start_pos, end_pos, speed, size, image: '../../assets/weapons/throable/grenade/explosion.png' });
    this.duration = duration;
    this.start = Date.now();
    setTimeout(() => this.visible = false, duration);
  }

  // Os quadros passam ao longo da duracao: chama, fumaca e some.
  draw() {
    const drawer = Canvas.drawer();
    const frame = Math.min(Math.floor(((Date.now() - this.start) / this.duration) * FRAMES), FRAMES - 1);

    drawer.drawImage(Images.get(this.image), frame * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE, this.curr_pos.x, this.curr_pos.y, this.size.x, this.size.y);
  }

  update() {
    return this;
  }
}

export default Explosion;
