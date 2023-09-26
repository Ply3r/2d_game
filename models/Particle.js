import Canvas from "./Canvas.js";

class Particle {
  constructor(start_pos, end_pos, speed, img = null, size = 5) {
    let image = null;

    if (img) {
      image = new Image();
      image.src = img;
    }
    
    this.image = image;
    this.start_pos = { ...start_pos }
    this.curr_pos = { ...start_pos };
    this.end_pos = { ...end_pos };
    this.equation = null;
    this.speed = speed;
    this.size = size
    this.visible = true;
  }

  draw() {
    const drawer = Canvas.drawer();

    if (this.image) {
      drawer.drawImage(this.image, this.curr_pos.x, this.curr_pos.y, this.size, this.size);
    } else {
      drawer.fillStyle = "rgb(255, 255, 255)";
      drawer.fillRect(this.curr_pos.x, this.curr_pos.y, this.size, this.size);
    }
  }

  update() {
    if (!this.equation) this.lineEquation();
    this.updatePosition();

    if (Math.abs(this.curr_pos.x - this.end_pos.x) <= this.speed &&
        Math.abs(this.curr_pos.y - this.end_pos.y) <= this.speed) 
    {
      this.visible = false;
    }

    return this;
  }

  lineEquation() {
    const slope = (this.start_pos.y - this.end_pos.y) / (this.start_pos.x - this.end_pos.x);
    const b = this.start_pos.y - slope * this.start_pos.x;

    this.equation = (x) => {
      const new_y = slope * x + b;
      
      return { x: x, y: new_y }
    }
  }

  // checkParticleOutOfWorld() {
  //   return this.curr_pos.x < 0 ||
  //          this.curr_pos.x > window.innerWidth ||
  //          this.curr_pos.y < 0 ||
  //          this.curr_pos.y > window.innerHeight
  // }

  updatePosition() {
    if (!this.equation) this.lineEquation();
    this.curr_pos.x += this.curr_pos.x < this.end_pos.x ? this.speed : -this.speed;
    const { x, y } = this.equation(this.curr_pos.x)
    this.curr_pos.x = x;
    this.curr_pos.y = y;
  }

  isVisible() {
    return this.visible;
  }
}

export default Particle;
