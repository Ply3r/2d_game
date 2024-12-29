import Canvas from "../config/Canvas.js";

class Drop {
  MAX_TIME_ON_SCREEN = 10000

  constructor({ position, image, size }) {
    this.image = image;
    this.position = position;
    this.size = size
    this.visible = true;

    setTimeout(() => this.visible = false, this.MAX_TIME_ON_SCREEN)
  }

  draw() {
    const drawer = Canvas.drawer();

    const image = new Image();
    image.src = this.image;
    drawer.drawImage(image, this.position.x, this.position.y, this.size, this.size);
  }

  update() {}

  isVisible() {
    return this.visible;
  }

  attributes() {
    return {
      position: this.position,
      size: this.size
    }
  }
}

export default Drop;
