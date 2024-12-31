import Main from "../../Main.js";
import Bullet from "../../particles/Bullet.js";
import Weapon from "../Weapon.js";

class Gun extends Weapon {
  constructor({ name, magazine_size, total_ammunition, image, distance, size, automatic, bullet_time, reload_time }) {
    super({ name, image, size, reload_time, distance, type: 'gun' });

    this.magazine_size = magazine_size;
    this.using_ammunition = magazine_size;
    this.total_ammunition = total_ammunition;
    this.image = image;
    this.size = size;
    this.automatic = automatic;
    this.bullet_time = bullet_time;
    this.can_shoot = true;
  }

  getAmmunition(amount) {
    this.using_ammunition += amount;

    if (this.using_ammunition > this.magazine_size) {
      const remaining = this.using_ammunition - this.magazine_size;
      this.using_ammunition = this.magazine_size;
      this.total_ammunition += remaining
    }
  }

  attack(player_pos, mouse_position) {
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
    if (this.reloading) return;

    this.reloading = true;
    let new_using_ammunition;

    if (this.using_ammunition > 0) {
      new_using_ammunition = this.magazine_size - this.using_ammunition;
    } else {
      new_using_ammunition = this.total_ammunition >= this.magazine_size ? this.magazine_size : this.total_ammunition;
    }

    this.total_ammunition -= new_using_ammunition;
    this.using_ammunition += new_using_ammunition;
    this.reload_start_time = Date.now();

    setTimeout(() => this.reloading = false, this.reload_time);
  }

  attributes() {
    return {
      name: this.name,
      total_ammunition: this.total_ammunition,
      using_ammunition: this.using_ammunition,
      automatic: this.automatic,
      reloading: this.reloading,
      reload_time: this.reload_time,
      reload_start_time: this.reload_start_time,
      type: this.type,
      image: this.image
    }
  }
}

export default Gun;
