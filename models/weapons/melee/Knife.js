import Melee from "./Melee.js";

class Knife extends Melee {
  constructor() {
    super({
      name: 'knife',
      image: '../../assets/weapons/knife/knife.png', 
      size: { x: 100, y: 100 },
      distance: { x: 40, y: -35 },
      reload_time: 200,
      total_sprites: 6
    })
  }
}

export default Knife;
