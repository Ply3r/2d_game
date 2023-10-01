import Gun from "./Gun.js";

class TommyGun extends Gun {
  constructor() {
    super(30, 90, '../../assets/guns/tommy_gun.png', { x: 100, y: 80 })
  }
}

export default TommyGun;
