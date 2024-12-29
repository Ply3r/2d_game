import Drop from "./Drop.js";
import Main from "../Main.js";

class Heart extends Drop {
  constructor(position) {
    super({ position: position, size: 50, image: '../../assets/heart.png' });
  }

  update() {
    this.checkPlayerCollision();
    return this;
  }

  checkPlayerCollision() {
    const player = Main.instance().getPlayerInstance();
    const { position: player_pos } = player.attributes()

    if (
      Math.abs(player_pos.x - this.position.x) < 50 &&
      Math.abs(player_pos.y - this.position.y) < 50
    ) 
    {
      player.increaseLife();
      this.visible = false;
    }
  }
}

export default Heart;
