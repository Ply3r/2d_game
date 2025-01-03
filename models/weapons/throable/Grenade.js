import Throable from "./Throable.js";
import Main from "../../Main.js";
import GrenadeParticle from "../../particles/Grenade.js";

class Grenade extends Throable {
  constructor() {
    super({
      name: 'grenade',
      image: '../../assets/weapons/Throable/grenade/grenade.png',
      impact_image: '../../assets/weapons/Throable/grenade/explosion.png',
      speed: 25,
      impact_size: { x: 500, y: 500 },
      size: { x: 50, y: 50 },
      distance: { x: 50, y: 0 },
      duration: 1000
    })
  }

  attack(player_pos, mouse_position) {
    const itemUpdater = Main.instance().getItemUpdaterInstance();
    itemUpdater.create(new GrenadeParticle({ start_pos: player_pos, end_pos: mouse_position, speed: this.speed, size: this.size, duration: this.duration }));
    super.attack(player_pos, mouse_position);
  }
}

export default Grenade;
