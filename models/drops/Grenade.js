import Drop from "./Drop.js";
import Main from "../Main.js";
import GrenadeWeapon from "../weapons/throable/Grenade.js";

class Grenade extends Drop {
  constructor(position) {
    super({ position: position, size: { x: 48, y: 48 }, image: '../../assets/drops/grenade.png' });
  }

  addItem() {
    const player = Main.instance().getPlayerInstance();
    player.addItem(new GrenadeWeapon());
  }

  checkPlayerCollision() {
    super.checkPlayerCollision(this.addItem);
  }
}

export default Grenade;
