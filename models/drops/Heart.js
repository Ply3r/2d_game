import Drop from "./Drop.js";
import Main from "../Main.js";

class Heart extends Drop {
  constructor(position) {
    super({ position: position, size: { x: 50, y: 50 }, image: '../../assets/heart.png' });
  }

  increaseLife() {
    const player = Main.instance().getPlayerInstance();
    player.increaseLife();
  }

  checkPlayerCollision() {
    super.checkPlayerCollision(this.increaseLife);
  }
}

export default Heart;
