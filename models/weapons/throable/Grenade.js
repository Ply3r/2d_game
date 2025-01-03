import Throable from "./Throable.js";

class Grenade extends Throable {
  constructor() {
    super({
      name: 'grenade',
      image: '../../assets/weapons/Throable/grenade/grenade.png',
      impact_image: '../../assets/weapons/Throable/grenade/explosion.png',
      speed: 25,
      impact_area: 100,
      size: { x: 100, y: 100 },
      distance: { x: 40, y: -35 },
    })
  }
}

export default Grenade;
