import Canvas from "../config/Canvas.js";

class Weapon {
  constructor({ name, image, size, reload_time, use_ammunition, type, distance = { x: 0, y: 0 } }) {
    this.name = name;
    this.image = image;
    this.size = size;
    this.use_ammunition = use_ammunition;
    this.reload_time = reload_time;
    this.distance = distance;
    this.type = type;
    this.reloading = false;
    this.reload_start_time = null;
  }

  draw(player_pos, crosshair_pos) {
    const drawer = Canvas.drawer();

    const img = new Image();
    img.src = this.image;

    drawer.setTransform(1, 0, 0, 1, player_pos.x, player_pos.y + 70);
    const angle = Math.atan2(crosshair_pos.y - player_pos.y, crosshair_pos.x - player_pos.x);

    const direction = crosshair_pos.x > player_pos.x ? 1 : -1;
    drawer.scale(1, direction * 1);
    drawer.rotate(direction * angle);

    const half = this.size.y / 2
    drawer.drawImage(img, -40 + this.distance.x, -half + this.distance.y, this.size.x, this.size.y);
  }

  attack(_player_pos, _mouse_position) {}

  reload() {
    if (this.reloading) return;

    this.reloading = true;
    this.reload_start_time = Date.now();
    setTimeout(() => this.reloading = false, this.reload_time);
  }

  getType() {
    return this.type;
  }

  attributes() {
    return {
      name: this.name,
      image: this.image,
      size: this.size,
      type: this.type,
      reloading: this.reloading,
      reload_time: this.reload_time,
      reload_start_time: this.reload_start_time,
    }
  }
}

export default Weapon;
