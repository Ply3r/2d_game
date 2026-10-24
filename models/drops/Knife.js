import Drop from "./Drop.js";
import Main from "../Main.js";
import KnifeWeapon from "../weapons/melee/Knife.js";

class Knife extends Drop {
  constructor(position) {
    super({ position: position, size: { x: 52, y: 24 }, image: '../../assets/weapons/melee/knife/knife.png' });
  }

  addItem() {
    Main.instance().getPlayerInstance().addItem(new KnifeWeapon());
  }

  checkPlayerCollision() {
    super.checkPlayerCollision(this.addItem);
  }
}

export default Knife;
