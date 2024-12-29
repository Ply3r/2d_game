import Gun from "./Gun.js";

class TecNine extends Gun {
  constructor() {
    super({ 
      magazine_size: 20, 
      total_ammunition: 40, 
      image: '../../assets/weapons/tec_9.png', 
      size: { x: 60, y: 40 },
      distance: 50,
      reloading_time: 2000,
    })
  }
}

export default TecNine;
