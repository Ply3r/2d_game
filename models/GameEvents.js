import TommyGun from "./guns/TommyGun.js";
import TecNine from "./guns/TecNine.js";

class GameEvents {
  static randomGun() {
    const guns = [TommyGun, TecNine];
    const random_index = Math.floor(Math.random() * guns.length);

    return new guns[random_index]();
  }
}

export default GameEvents;
