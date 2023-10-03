import Canvas from "../Canvas.js";
import GameEvents from "../GameEvents.js";

class Particle {
  MAX_TIME_ON_SCREEN = 1000

  constructor({ start_pos, end_pos, speed, image, size }) {
    this.image = image;
    this.start_pos = { ...start_pos }
    this.curr_pos = { ...start_pos };
    this.end_pos = { ...end_pos };
    this.speed = speed;
    this.size = size
    this.visible = true;

    setTimeout(() => this.visible = false, this.MAX_TIME_ON_SCREEN)
  }

  draw() {
    const drawer = Canvas.drawer();

    const image = new Image();
    image.src = this.image;
    drawer.drawImage(this.image, this.curr_pos.x, this.curr_pos.y, this.size, this.size);
  }

  update() {
    this.updatePosition();

    if (Math.abs(this.curr_pos.x - this.end_pos.x) <= this.speed &&
        Math.abs(this.curr_pos.y - this.end_pos.y) <= this.speed) 
    {
      this.visible = false;
    }

    return this;
  }

  checkParticleOutOfWorld() {
    return this.curr_pos.x < 0 ||
           this.curr_pos.x > window.innerWidth ||
           this.curr_pos.y < 0 ||
           this.curr_pos.y > window.innerHeight
  }

  updatePosition() {
    const { x, y } = GameEvents.getNextPointInLine(this.curr_pos, this.end_pos, this.speed);
    this.curr_pos.x = x;
    this.curr_pos.y = y;
  }

  isVisible() {
    return this.visible;
  }

  attributes() {
    return {
      position: this.curr_pos,
      size: this.size
    }
  }
}

export default Particle;
