import Canvas from "./Canvas.js";
import Particles from "./Particles.js";

class Gun {
  MAGAZINE_SIZE = 30

  constructor() {
    this.total_ammunition = 90
    this.using_ammunition = 30
    this.reloading = false;
    
  }

  draw(player_pos, crosshair_pos) {
    const drawer = Canvas.drawer();

    const gun_img = new Image();
    gun_img.src = '../assets/guns/tommy_gun.png';

    drawer.setTransform(1, 0, 0, 1, player_pos.x + 40, player_pos.y + 70);
    const angle = Math.atan2(crosshair_pos.y - player_pos.y, crosshair_pos.x - player_pos.x);
    drawer.rotate(angle)

    drawer.drawImage(gun_img, 0, -50, 100, 80);
  }

  getAmmunition(amount) {
  }

  fire(player_pos, mouse_position) {
    if (this.reloading) return;

    if (this.using_ammunition > 0) {
      this.using_ammunition -= 1;
    } else {
      this.reloading = true;

      const new_using_ammunition = this.total_ammunition >= this.MAGAZINE_SIZE ? this.MAGAZINE_SIZE : this.total_ammunition;
      this.total_ammunition -= new_using_ammunition;
      this.using_ammunition += new_using_ammunition;

      setTimeout(() => this.reloading = false, 2000);
    }

    const position = { x: player_pos.x + 40, y: player_pos.y + 70 };
    Particles.create(position, mouse_position, 15, null, 10);
  }
}

export default Gun;
