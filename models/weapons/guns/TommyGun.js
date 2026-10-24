import Gun from "./Gun.js";

class TommyGun extends Gun {
  constructor() {
    super({
      name: 'tommy_gun',
      magazine_size: 30, 
      total_ammunition: 90, 
      image: '../../assets/weapons/gun/tommy_gun.png', 
      size: { x: 96, y: 40 },
      grip: { x: 34, y: 22 },
      muzzle: { x: 62, y: -8 },
      automatic: true,
      bullet_time: 200,
      reload_time: 2000,
      strength: 2,
    })
  }
}

export default TommyGun;
