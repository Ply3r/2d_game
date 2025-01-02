import Weapon from "../Weapon.js";
import Canvas from '../../config/Canvas.js';
import Main from "../../Main.js";

class Melee extends Weapon {
  ATTACK_TIME = 100

  constructor({ name, image, total_sprites, size, distance, reload_time }) {
    super({ name, image, size, reload_time, distance, type: 'melee' });
    this.attacking = false;
    this.attack_started_time = null;
    this.total_sprites = total_sprites;
  }

  attack(player_pos, mouse_position) {
    if (this.reloading) return;

    this.attack_direction = this.getAttackDirection(player_pos, mouse_position);
    const attack_area = this.getAttackArea(player_pos, this.attack_direction, { x: 0, y: 20 });
    this.attacking = true;
    this.attack_started_time = Date.now();
    setTimeout(() => this.attacking = false, this.ATTACK_TIME);

    const enemies = Main.instance().getEnemiesInstance().getEnemies();
    const enemies_in_area = enemies.filter(({ position }) => {
      return position.x >= attack_area.x1 &&
             position.x <= attack_area.x2 &&
             position.y >= attack_area.y1 &&
             position.y <= attack_area.y2;
    });

    enemies_in_area.forEach((enemy) => enemy.getHit());
    this.reload();
  }

  draw(player_pos, crosshair_pos) {
    // The draw part needs to be improved!
    if (this.attacking) return this.drawAttackArea(player_pos, this.attack_direction);
    super.draw(player_pos, crosshair_pos);
  }

  drawAttackArea(player_pos, attack_direction) {
    const attack_area = this.getAttackArea(player_pos, attack_direction, { x: 0, y: 20 });
    const drawer = Canvas.drawer();

    // Save the current canvas state
    drawer.save();

    // translate
    const directionOffsets = {
      top: { x: 0, y: -80 },
      right: { x: 80, y: 50 },
      bottom: { x: 0, y: 120 },
      left: { x: -80, y: 0 },
    };

    const offset = directionOffsets[attack_direction];
    drawer.translate(offset.x, offset.y);

    // rotate
    const direction_dict = { top: 0, right: 1, bottom: 2, left: 3 };
    const rotation_angle = (90 * direction_dict[attack_direction]) * (Math.PI / 180);
    drawer.rotate(rotation_angle);

    // Draw the rectangle
    const width = attack_area.x2 - attack_area.x1;
    const height = attack_area.y2 - attack_area.y1;

    const image = new Image();
    const diff_in_sec = Date.now() - this.attack_started_time;
    const image_number = Math.ceil((this.total_sprites * diff_in_sec) / this.ATTACK_TIME);

    image.src = `../../assets/weapons/${this.name}/${this.name}_hit/${this.name}_hit${image_number}.png`;
    drawer.drawImage(image, -width / 2, -height / 2, width, height);

    // Restore the canvas state
    drawer.restore();
}

  getAttackArea(player_pos, attack_direction, offset = { x: 0, y: 0 }) {
    const attack_size = { x: 350, y: 350 }; // Adjust the size as needed
    let attack_area;
  
    switch (attack_direction) {
      case 'top':
        attack_area = {
          x1: player_pos.x - attack_size.x / 2 + offset.x,
          x2: player_pos.x + attack_size.x / 2 + offset.x,
          y1: player_pos.y - attack_size.y + offset.y,
          y2: player_pos.y + offset.y
        };
        break;
  
      case 'bottom':
        attack_area = {
          x1: player_pos.x - attack_size.x / 2 + offset.x,
          x2: player_pos.x + attack_size.x / 2 + offset.x,
          y1: player_pos.y + offset.y,
          y2: player_pos.y + attack_size.y + offset.y
        };
        break;
  
      case 'left':
        attack_area = {
          x1: player_pos.x - attack_size.x + offset.x,
          x2: player_pos.x + offset.x,
          y1: player_pos.y - attack_size.y / 2 + offset.y,
          y2: player_pos.y + attack_size.y / 2 + offset.y
        };
        break;
  
      case 'right':
        attack_area = {
          x1: player_pos.x + offset.x,
          x2: player_pos.x + attack_size.x + offset.x,
          y1: player_pos.y - attack_size.y / 2 + offset.y,
          y2: player_pos.y + attack_size.y / 2 + offset.y
        };
        break;
  
      default:
        throw new Error('Invalid attack direction');
    }
  
    return attack_area;
  }

  getAttackDirection(player_pos, mouse_position) {
    const dx = mouse_position.x - player_pos.x;
    const dy = mouse_position.y - player_pos.y;

    let direction;
  
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal direction
      direction = dx > 0 ? 'right' : 'left';
    } else {
      // Vertical direction
      direction = dy > 0 ? 'bottom' : 'top';
    }

    return direction;
  }
}

export default Melee;
