import Particle from "./Particle.js";
import Main from "../Main.js";

class Heart extends Particle {
  constructor(position) {
    super({ start_pos: position, end_pos: position, size: 50, image: '../../assets/heart.png' });
  }

  update() {
    this.checkPlayerCollision();
    return this;
  }

  checkPlayerCollision() {
    const player = Main.instance().getPlayerInstance();
    const { position: player_pos } = player.attributes()

    if (
      Math.abs(player_pos.x - this.curr_pos.x) < 50 &&
      Math.abs(player_pos.y - this.curr_pos.y) < 50
    ) 
    {
      player.increaseLife();
      this.visible = false;
    }
  }
}

export default Heart;
