import Canvas from "../config/Canvas.js";
import GameEvents from "../config/GameEvents.js";
import Main from "../Main.js";

class Enemy {
  INVENCIBLE_TIME_AFTER_HIT = 100;

  constructor({ life, strength, size, speed, position, total_sprites, name }) {
    this.life = life;
    this.strength = strength;
    this.size = size;
    this.speed = speed;
    this.position = position;
    this.name = name;
    this.total_sprites = total_sprites;
    this.curr_sprite = 0;
    this.direction = 1;
    this.frame_counter = 0;
    this.invencible = false;
  }

  draw() {
    const drawer = Canvas.drawer();

    const image = new Image();
    image.src = `../../assets/enemies/${this.name}/${this.curr_sprite}.gif`;

    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.scale(this.direction, 1);

    const x_position = this.direction === -1 ? -this.size.x :0;

    if (this.invencible) {
      drawer.filter = "brightness(1.5)"; // Increase brightness (1.5 = 150%)
    }

    drawer.drawImage(image, x_position, 0, this.size.x, this.size.y);
    drawer.filter = "none";
    drawer.restore();

    const sprite_speed = Math.max(1, Math.floor(10 / this.speed)); 
    this.frame_counter++;

    if (this.frame_counter >= sprite_speed) {
      this.curr_sprite += 1;
      if (this.curr_sprite >= this.total_sprites) this.curr_sprite = 0;
      this.frame_counter = 0; // Reset the counter
    }
  }

  getHit(strength) {
    this.life -= strength;
    this.invencible = true;

    setTimeout(() => this.invencible = false, this.INVENCIBLE_TIME_AFTER_HIT)
  }

  update() {
    this.move();
    if (this.invencible) this.takingHit();
    this.checkCollisionWithPlayer();
    this.checkIsDead();

    return this;
  }

  move() {
    const player = Main.instance().getPlayerInstance()
    const { position: player_pos } = player.attributes();

    if (GameEvents.checkCollision(player, this)) return;
      
    this.direction = this.position.x >= player_pos.x ? -1 : 1;
    const { x, y } = GameEvents.getNextPointInLine(this.position, player_pos, this.speed);
    this.position.x = x;
    this.position.y = y;
  }

  takingHit() {
    const { position: player_pos } = Main.instance().getPlayerInstance().attributes();
    const { x, y } = GameEvents.getNextPointInLine(this.position, player_pos, -(this.speed * 2));
    this.position.x = x;
    this.position.y = y;
  }

  checkCollisionWithPlayer() {
    const player = Main.instance().getPlayerInstance();
    const { invencible: player_invencible } = player.attributes();

    if (player_invencible) return;
    const colision = GameEvents.checkCollision(player, this);

    if (!colision) return;
    player.getHit(this.strength);
  }

  checkIsDead() {
    const is_dead = this.life <= 0;
    if (!is_dead) return;

    GameEvents.dropLoot(this.position);
    Main.instance().getPlayerInstance().increaseEnemiesKilled();
  }

  isVisible() {
    return this.life > 0;
  }

  attributes() {
    return {
      life: this.life,
      strength: this.strength,
      position: this.position,
      size: this.size,
      invencible: this.invencible
    }
  }
}

export default Enemy;
