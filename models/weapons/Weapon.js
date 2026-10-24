import Canvas from "../config/Canvas.js";
import { HAND_Y } from "../config/Hand.js";
import Images from "../config/Images.js";

const SKIN = "#e8b48a";
const OUTLINE = "#1b1720";

class Weapon {
  // grip: ponto do sprite (em px, a partir do canto superior esquerdo) onde a mao segura a arma.
  // muzzle: ponta do cano, em px a partir do grip, com o sprite apontando para a direita.
  constructor({ name, image, size, reload_time, type, strength, grip = { x: 0, y: 0 }, muzzle = { x: 0, y: 0 } }) {
    this.name = name;
    this.image = image;
    this.size = size;
    this.reload_time = reload_time;
    this.grip = grip;
    this.muzzle = muzzle;
    this.type = type;
    this.strength = strength;
    this.reloading = false;
    this.reload_start_time = null;
  }

  // O sprite gira em torno da mao, que fica em (player.x, player.y + HAND_Y), e espelha
  // verticalmente quando se mira para a esquerda.
  transformParams(player_pos, crosshair_pos) {
    const pivot = { x: player_pos.x, y: player_pos.y + HAND_Y };
    const direction = crosshair_pos.x > pivot.x ? 1 : -1;
    const angle = direction * Math.atan2(crosshair_pos.y - pivot.y, crosshair_pos.x - pivot.x);

    return { pivot, direction, angle };
  }

  draw(player_pos, crosshair_pos) {
    const drawer = Canvas.drawer();
    const { pivot, direction, angle } = this.transformParams(player_pos, crosshair_pos);

    drawer.setTransform(1, 0, 0, 1, pivot.x, pivot.y);
    drawer.scale(1, direction);
    drawer.rotate(angle);

    drawer.drawImage(Images.get(this.image), -this.grip.x, -this.grip.y, this.size.x, this.size.y);

    // mao fechada sobre a empunhadura
    drawer.fillStyle = OUTLINE;
    drawer.fillRect(-6, -6, 12, 12);
    drawer.fillStyle = SKIN;
    drawer.fillRect(-4, -4, 8, 8);
  }

  // Ponta do cano em coordenadas do mundo (de onde sai a bala).
  muzzlePosition(player_pos, crosshair_pos) {
    const { pivot, direction, angle } = this.transformParams(player_pos, crosshair_pos);
    const x = this.muzzle.x * Math.cos(angle) - this.muzzle.y * Math.sin(angle);
    const y = this.muzzle.x * Math.sin(angle) + this.muzzle.y * Math.cos(angle);

    return { x: pivot.x + x, y: pivot.y + direction * y };
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
