import Canvas from "../Canvas.js";
import Particles from "../particles/Particles.js";

class Gun {
  constructor(magazine_size, total_ammunition, image, gun_size) {
    this.magazine_size = magazine_size
    this.using_ammunition = magazine_size
    this.total_ammunition = total_ammunition
    this.reloading = false;
    this.image = image;
    this.gun_size = gun_size;
  }

  draw(player_pos, crosshair_pos) {
    const drawer = Canvas.drawer();

    const gun_img = new Image();
    gun_img.src = this.image;

    drawer.setTransform(1, 0, 0, 1, player_pos.x + 40, player_pos.y + 70);
    const angle = Math.atan2(crosshair_pos.y - player_pos.y, crosshair_pos.x - player_pos.x);
    drawer.rotate(angle)

    const half = this.gun_size.y / 2
    drawer.drawImage(gun_img, 0, -half, this.gun_size.x, this.gun_size.y);
  }

  getAmmunition(amount) {
    const remaining = amount - this.using_ammunition;
    this.using_ammunition = amount >= this.magazine_size ? this.magazine_size : this.using_ammunition + amount;

    if (remaining > 0) this.total_ammunition += remaining;
  }

  fire(player_pos, mouse_position) {
    if (this.reloading) return;

    if (this.using_ammunition > 0) {
      this.using_ammunition -= 1;
    } else {
      this.reloading = true;

      const new_using_ammunition = this.total_ammunition >= this.magazine_size ? this.magazine_size : this.total_ammunition;
      this.total_ammunition -= new_using_ammunition;
      this.using_ammunition += new_using_ammunition;

      setTimeout(() => this.reloading = false, 2000);
      return;
    }

    const position = { x: player_pos.x + 40, y: player_pos.y + 50 };
    Particles.create(position, mouse_position, 50, null, 10);
  }

  attributes() {
    return {
      total_ammunition: this.total_ammunition,
      using_ammunition: this.using_ammunition,
      reloading: this.reloading,
      image: this.image
    }
  }
}

export default Gun;
