import Canvas from "./Canvas.js";

class Particle {
  constructor(start_pos, end_pos, speed, img = null, size = 5) {
    let image = null;

    if (img) {
      image = new Image();
      image.src = img;
    }
    
    this.image = image;
    this.curr_pos = { ...start_pos };
    this.end_pos = { ...end_pos };
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
    this.curr_pos.x += this.curr_pos.x < this.end_pos.x ? this.speed : -this.speed;
    this.curr_pos.y += this.curr_pos.y < this.end_pos.y ? this.speed : -this.speed;

    if (Math.abs(this.curr_pos.x - this.end_pos.x) <= this.speed &&
        Math.abs(this.curr_pos.y - this.end_pos.y) <= this.speed) 
    {
      this.visible = false;
    }

    return this;
  }

  isVisible() {
    return this.visible;
  }

  
}

export default Particle;
