import Main from "../../Main.js";
import Bullet from "../../particles/Bullet.js";
import Weapon from "../Weapon.js";
import Clock from "../../config/Clock.js";
import { SEMI_AUTO_INTERVAL, bulletLook, fireInterval, multishotAngles } from "../../config/Powerups.js";

class Gun extends Weapon {
  constructor({ strength, name, magazine_size, total_ammunition, image, grip, muzzle, size, automatic, bullet_time, reload_time }) {
    super({ strength, name, image, size, reload_time, grip, muzzle, type: 'gun' });

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

    const player = Main.instance().getPlayerInstance();
    const { powerups } = player;

    // Intervalo entre tiros: o da arma, encurtado pela cadencia. Arma de clique so tem intervalo com o powerup.
    const base_interval = this.automatic ? this.bullet_time : (powerups.fire_rate > 0 ? SEMI_AUTO_INTERVAL : 0);
    if (base_interval > 0) {
      this.can_shoot = false;
      Clock.after(fireInterval(base_interval, powerups.fire_rate), () => this.can_shoot = true);
    }

    this.using_ammunition -= 1;
    const muzzle = this.muzzlePosition(player_pos, mouse_position);
    const look = bulletLook(powerups.damage);
    const position = { x: muzzle.x - look.size / 2, y: muzzle.y - look.size / 2 };   // a bala sai centrada no cano
    const strength = player.gunDamage();
    const itemUpdater = Main.instance().getItemUpdaterInstance();

    // Tiro multiplo: a bala da mira mais as outras abertas em leque, gastando uma municao so.
    multishotAngles(powerups.multishot).forEach((angle) => {
      const end_pos = Gun.rotateAround(muzzle, mouse_position, angle);
      itemUpdater.create(new Bullet({ start_pos: position, end_pos, strength, size: look.size, color: look.color }));
    });
  }

  // `point` girado `angle` radianos em volta de `center`.
  static rotateAround(center, point, angle) {
    if (angle === 0) return point;

    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  }

  reload() {
    if (this.reloading) return;

    // Nao recarrega mais do que a reserva tem (evita total_ammunition negativo).
    const new_using_ammunition = Math.min(this.magazine_size - this.using_ammunition, this.total_ammunition);
    if (new_using_ammunition <= 0) return;

    this.reloading = true;
    this.total_ammunition -= new_using_ammunition;
    this.using_ammunition += new_using_ammunition;
    this.reload_start_time = Clock.now();

    Clock.after(this.reload_time, () => this.reloading = false);
  }

  attributes() {
    return {
      name: this.name,
      total_ammunition: this.total_ammunition,
      using_ammunition: this.using_ammunition,
      automatic: this.automatic,
      magazine_size: this.magazine_size,
      reloading: this.reloading,
      reload_time: this.reload_time,
      reload_start_time: this.reload_start_time,
      type: this.type,
      image: this.image
    }
  }
}

export default Gun;
