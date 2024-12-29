import Canvas from "../config/Canvas.js";

class Weapon {
  constructor({ image, size, distance = 0 }) {
    this.image = image;
    this.size = size;
    this.distance = distance;
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
    drawer.drawImage(img, -40 + this.distance, -half, this.size.x, this.size.y);
  }

  attack(player_pos, mouse_position) {

  }

  attributes() {
    return {
      image: this.image,
      size: this.size
    }
  }
}

export default Weapon;
