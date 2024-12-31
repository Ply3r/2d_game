import Weapon from "../Weapon.js";
import Canvas from '../../config/Canvas.js';
import Main from "../../Main.js";

class Melee extends Weapon {
  constructor({ name, image, total_sprites, size, distance, reload_time }) {
    super({ name, image, size, reload_time, distance, type: 'melee' });
    this.total_sprites = total_sprites;
  }

  attack(player_pos, mouse_position) {
    const attack_direction = this.getAttackDirection(player_pos, mouse_position);
    const attack_area = this.getAttackArea(player_pos, attack_direction, { x: 0, y: 20 });

    // The draw part needs to be improved!
    // this.drawAttackArea(attack_area, attack_direction);

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

  drawAttackArea(attack_area, attack_direction) {
    const drawer = Canvas.drawer();

    // Calculate the center of the attack area for transformation
    const centerX = (attack_area.x1 + attack_area.x2) / 2;
    const centerY = (attack_area.y1 + attack_area.y2) / 2;

    // Save the current canvas state
    drawer.save();

    // Apply transformations (e.g., rotation, scale)
    drawer.translate(centerX, centerY); // Move to the center of the rectangle
    const direction_dict = { top: 0, right: 1, bottom: 2, left: 3 }
    const rotation_angle = (90 * direction_dict[attack_direction]) * (Math.PI / 180);
    drawer.rotate(rotation_angle);

    // Draw the rectangle
    const width = attack_area.x2 - attack_area.x1;
    const height = attack_area.y2 - attack_area.y1;

    // for(let curr_sprite = 1; curr_sprite <= this.total_sprites; curr_sprite += 1) {
    //   const image = new Image();
    //   image.src = `../../assets/weapons/${this.name}/${this.name}_animation/${curr_sprite}.png`;
    //   drawer.drawImage(image, -width / 2, -height / 2, width, height);
    // }

    drawer.fillStyle = "rgb(255, 255, 255)";
    drawer.fillRect(-width / 2, -height / 2, width, height); // Centered rectangle

    // Restore the canvas state
    drawer.restore();
  }

  getAttackArea(player_pos, attack_direction, offset = { x: 0, y: 0 }) {
    const attack_size = { x: 350, y: 220 }; // Adjust the size as needed
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
