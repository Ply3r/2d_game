import Main from "../Main.js";
import Drop from "./Drop.js";

class Ammunition extends Drop {
  constructor(position) {
    super({ position: position, size: 50, image: '../../assets/ammunition.png' });
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
      Math.abs(player_pos.x - this.position.x) < 50 &&
      Math.abs(player_pos.y - this.position.y) < 50
    ) 
    {
      const gun = player.attributes().curr_gun;
      gun.getAmmunition(this.randomAmmo());
      this.visible = false;
    }
  }
}

export default Ammunition;
