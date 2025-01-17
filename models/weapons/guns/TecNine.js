import Gun from "./Gun.js";

class TecNine extends Gun {
  constructor() {
    super({
      name: 'tec_nine',
      magazine_size: 20, 
      total_ammunition: 40, 
      image: '../../assets/weapons/gun/tec_9.png', 
      size: { x: 60, y: 40 },
      automatic: false,
      distance: { x: 50, y: 0 },
      reload_time: 1000,
      strength: 1
    })
  }
}

export default TecNine;
