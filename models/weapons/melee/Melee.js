import Weapon from "../Weapon.js";
import Canvas from '../../config/Canvas.js';
import GameEvents from "../../config/GameEvents.js";
import Images from "../../config/Images.js";
import Main from "../../Main.js";

class Melee extends Weapon {
  ATTACK_TIME = 100
  ATTACK_SIZE = { x: 350, y: 350 }

  constructor({ strength, name, image, total_sprites, size, grip, reload_time }) {
    super({ strength, name, image, size, reload_time, grip, type: 'melee' });
    this.attacking = false;
    this.attack_direction = null;
    this.attack_started_time = null;
    this.total_sprites = total_sprites;
  }

  attack(player_pos, mouse_position) {
    if (this.reloading) return;

    this.attack_direction = this.getAttackDirection(mouse_position);
    const attack_area = this.getAttackArea(this.attack_direction);
    this.attacking = true;
    this.attack_started_time = Date.now();
    setTimeout(() => this.attacking = false, this.ATTACK_TIME);

    // A mesma area que e desenhada: acerta quem tem a hitbox tocando nela.
    const enemies = Main.instance().getEnemiesInstance().getEnemies();
    enemies
      .filter((enemy) => enemy.isVisible() && GameEvents.rectsOverlap(enemy.hitbox(), attack_area))
      .forEach((enemy) => enemy.getHit(this.strength));

    this.reload();
  }

  draw(player_pos, crosshair_pos) {
    if (this.attacking) return this.drawAttackArea(this.attack_direction);
    super.draw(player_pos, crosshair_pos);
  }

  // Desenha a animacao do golpe exatamente sobre a area de ataque (a hitbox do golpe),
  // girada para a direcao do ataque. O sprite foi feito apontando para cima.
  drawAttackArea(attack_direction) {
    const attack_area = this.getAttackArea(attack_direction);
    const drawer = Canvas.drawer();

    const rotations = { top: 0, right: 90, bottom: 180, left: 270 };
    const rotation_angle = rotations[attack_direction] * (Math.PI / 180);

    const diff_in_ms = Date.now() - this.attack_started_time;
    let image_number = Math.ceil((this.total_sprites * diff_in_ms) / this.ATTACK_TIME);
    image_number = Math.min(Math.max(image_number, 1), this.total_sprites);

    const image = Images.get(`../../assets/weapons/melee/${this.name}/${this.name}_hit/${this.name}_hit${image_number}.png`);

    drawer.save();
    drawer.setTransform(1, 0, 0, 1, attack_area.x + attack_area.w / 2, attack_area.y + attack_area.h / 2);
    drawer.rotate(rotation_angle);
    drawer.drawImage(image, -attack_area.w / 2, -attack_area.h / 2, attack_area.w, attack_area.h);
    drawer.restore();
  }

  // Quadrado de ataque ao lado do jogador: centrado nele no eixo perpendicular e saindo
  // do centro do corpo na direcao do golpe. Retorna { x, y, w, h } absoluto.
  getAttackArea(attack_direction) {
    const { x: w, y: h } = this.ATTACK_SIZE;
    const center = Main.instance().getPlayerInstance().center();

    switch (attack_direction) {
      case 'top':
        return { x: center.x - w / 2, y: center.y - h, w, h };
      case 'bottom':
        return { x: center.x - w / 2, y: center.y, w, h };
      case 'left':
        return { x: center.x - w, y: center.y - h / 2, w, h };
      case 'right':
        return { x: center.x, y: center.y - h / 2, w, h };
      default:
        throw new Error('Invalid attack direction');
    }
  }

  getAttackDirection(mouse_position) {
    const center = Main.instance().getPlayerInstance().center();
    const dx = mouse_position.x - center.x;
    const dy = mouse_position.y - center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }

    return dy > 0 ? 'bottom' : 'top';
  }
}

export default Melee;
