import Main from "../Main.js";
import Drop from "./Drop.js";

class Ammunition extends Drop {
  constructor(position) {
    super({ position: position, size: { x: 50, y: 50 }, image: '../../assets/ammunition.png' });
  }

  addAmmo() {
    const player = Main.instance().getPlayerInstance();
    let weapon = player.inventory[player.curr_item];

    if (weapon.getType() !== 'gun') {
      weapon = player.inventory[1];
    }

    const options = [10, 15, 30, 40];
    const random_option = Math.floor(Math.random() * options.length)
    weapon.getAmmunition(options[random_option]);
  }

  checkPlayerCollision() {
    super.checkPlayerCollision(this.addAmmo);
  }
}

export default Ammunition;
