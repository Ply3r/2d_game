import Canvas from "../config/Canvas.js";
import Main from "../Main.js";
import Bullet from "../particles/Bullet.js";

class Gun {
  constructor({ magazine_size, total_ammunition, image, gun_size, automatic, bullet_time, reloading_time }) {
    this.magazine_size = magazine_size;
    this.using_ammunition = magazine_size;
    this.total_ammunition = total_ammunition;
    this.reloading_time = reloading_time;
    this.image = image;
    this.gun_size = gun_size;
    this.automatic = automatic;
    this.bullet_time = bullet_time;
    this.can_shoot = true;
    this.reloading = false;
    this.reload_start_time = 0;
  }

  draw(player_pos, crosshair_pos) {
    const drawer = Canvas.drawer();

    const gun_img = new Image();
    gun_img.src = this.image;

    drawer.setTransform(1, 0, 0, 1, player_pos.x, player_pos.y + 70);
    const angle = Math.atan2(crosshair_pos.y - player_pos.y, crosshair_pos.x - player_pos.x);

    const direction = crosshair_pos.x > player_pos.x ? 1 : -1;
    drawer.scale(1, direction * 1);
    drawer.rotate(direction * angle);

    const half = this.gun_size.y / 2
    drawer.drawImage(gun_img, -40, -half, this.gun_size.x, this.gun_size.y);
  }

  getAmmunition(amount) {
    this.using_ammunition += amount;

    if (this.using_ammunition > this.magazine_size) {
      const remaining = this.using_ammunition - this.magazine_size;
      this.using_ammunition = this.magazine_size;
      this.total_ammunition += remaining
    }
  }

  fire(player_pos, mouse_position) {
    if (this.reloading || !this.can_shoot) return;
    if (this.using_ammunition <= 0) return this.reload();

    if (this.automatic) {
      this.can_shoot = false;
      setTimeout(() => this.can_shoot = true, this.bullet_time);
    }

    this.using_ammunition -= 1;
    const position = { x: player_pos.x, y: player_pos.y + 50 };
    const itemUpdater = Main.instance().getItemUpdaterInstance();
    itemUpdater.create(new Bullet({ start_pos: position, end_pos: mouse_position }));
  }

  reload() {
    this.reloading = true;

    const new_using_ammunition = this.total_ammunition >= this.magazine_size ? this.magazine_size : this.total_ammunition;
    this.total_ammunition -= new_using_ammunition;
    this.using_ammunition += new_using_ammunition;

    this.reload_start_time = Date.now();
    setTimeout(() => this.reloading = false, this.reloading_time);
  }

  attributes() {
    return {
      total_ammunition: this.total_ammunition,
      using_ammunition: this.using_ammunition,
      automatic: this.automatic,
      reloading: this.reloading,
      reloading_time: this.reloading_time,
      reload_start_time: this.reload_start_time,
      image: this.image
    }
  }
}

export default Gun;
