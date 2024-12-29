import Gun from "./Gun.js";

class TecNine extends Gun {
  constructor() {
    super({ 
      magazine_size: 20, 
      total_ammunition: 40, 
      image: '../../assets/guns/tec_9.png', 
      gun_size: { x: 60, y: 40 },
      reloading_time: 2000,
    })
  }
}

export default TecNine;
