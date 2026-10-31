import Weapon from "../Weapon.js";
import Canvas from '../../config/Canvas.js';
import GameEvents from "../../config/GameEvents.js";
import Images from "../../config/Images.js";
import Main from "../../Main.js";
import Clock from "../../config/Clock.js";

class Melee extends Weapon {
  ATTACK_TIME = 100
  ATTACK_SIZE = { x: 350, y: 350 }
  // Faixa do sprite (apontando para cima, a partir do centro dele) que o golpe realmente
  // cobre: o crescente fica entre 16 e 104 px abaixo do centro, e o resto ate o jogador
  // (175 px) e o caminho do golpe. Fora disso o sprite e transparente.
  HIT_BAND = { from: 16, to: 175 }

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
    const hit_area = this.getHitArea(this.attack_direction);
    this.attacking = true;
    this.attack_started_time = Clock.now();
    Clock.after(this.ATTACK_TIME, () => this.attacking = false);

    // Acerta quem tem a hitbox tocando a faixa que o golpe cobre.
    const enemies = Main.instance().getEnemiesInstance().getEnemies();
    enemies
      .filter((enemy) => enemy.isVisible() && GameEvents.rectsOverlap(enemy.hitbox(), hit_area))
      .forEach((enemy) => enemy.getHit(this.strength));
    Main.instance().getAirdropsInstance().hitArea(hit_area, this.strength);

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

    const diff_in_ms = Clock.now() - this.attack_started_time;
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

  // Parte da area de ataque que o golpe cobre de fato (a faixa HIT_BAND do sprite, girada
  // para a direcao do ataque), em coordenadas absolutas.
  getHitArea(attack_direction) {
    const area = this.getAttackArea(attack_direction);
    const { from, to } = this.HIT_BAND;
    const half = area.w / 2;
    const band = to - from;

    switch (attack_direction) {
      case 'top':
        return { x: area.x, y: area.y + area.h / 2 + from, w: area.w, h: band };
      case 'bottom':
        return { x: area.x, y: area.y + area.h / 2 - to, w: area.w, h: band };
      case 'left':
        return { x: area.x + half + from, y: area.y, w: band, h: area.h };
      case 'right':
        return { x: area.x + half - to, y: area.y, w: band, h: area.h };
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
