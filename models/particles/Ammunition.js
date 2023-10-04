import Main from "../Main.js";
import Particle from "./Particle.js";

class Ammunition extends Particle {
  constructor(position) {
    super({ start_pos: position, end_pos: position, size: 50, image: '../../assets/ammunition.png' });
  }

  update() {
    this.checkPlayerCollision();
    return this;
  }

  randomAmmo() {
    const options = [10, 15, 30, 40];
    const random_option = Math.floor(Math.random() * options.length)
    return options[random_option];
  }

  checkPlayerCollision() {
    const player = Main.instance().getPlayerInstance();
    const { position: player_pos } = player.attributes()

    if (
      Math.abs(player_pos.x - this.curr_pos.x) < 50 &&
      Math.abs(player_pos.y - this.curr_pos.y) < 50
    ) 
    {
      const gun = player.attributes().curr_gun;
      gun.getAmmunition(this.randomAmmo());
      this.visible = false;
    }
  }
}

export default Ammunition;
