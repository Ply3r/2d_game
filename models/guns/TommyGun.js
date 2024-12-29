import Gun from "./Gun.js";

class TommyGun extends Gun {
  constructor() {
    super({
      magazine_size: 30, 
      total_ammunition: 90, 
      image: '../../assets/guns/tommy_gun.png', 
      gun_size: { x: 100, y: 80 },
      automatic: true,
      bullet_time: 200,
      reloading_time: 2000,
    })
  }
}

export default TommyGun;
