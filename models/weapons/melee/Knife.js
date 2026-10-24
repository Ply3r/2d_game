import Melee from "./Melee.js";

class Knife extends Melee {
  constructor() {
    super({
      name: 'knife',
      image: '../../assets/weapons/melee/knife/knife.png', 
      size: { x: 52, y: 24 },
      grip: { x: 12, y: 12 },
      reload_time: 200,
      total_sprites: 5,
      strength: 1
    })
  }
}

export default Knife;
