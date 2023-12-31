import Canvas from "../Canvas.js";
import GameEvents from "../GameEvents.js";
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
    this.invencible = false;
  }

  draw() {
    const drawer = Canvas.drawer();

    const image = new Image();
    image.src = `../../assets/enemies/${this.name}/${this.curr_sprite}.gif`;

    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.scale(this.direction, 1);
    drawer.drawImage(image, 0, 0, this.size.x, this.size.y);
    drawer.restore();

    this.curr_sprite += 1;
    if (this.curr_sprite > this.total_sprites) this.curr_sprite = 0;
  }

  getHit() {
    this.life -= 1;
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
    player.getHit();
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
