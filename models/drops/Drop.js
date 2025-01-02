import Canvas from "../config/Canvas.js";
import GameEvents from '../config/GameEvents.js';
import Main from "../Main.js";

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
    drawer.drawImage(image, this.position.x, this.position.y, this.size.x, this.size.y);
  }

  update() {
    this.checkPlayerCollision();
    return this;
  }

  checkPlayerCollision(action) {
    const player = Main.instance().getPlayerInstance();

    if (GameEvents.checkCollision(player, this)) {
      action();
      this.visible = false;
    }
  }

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
