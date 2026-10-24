import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
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

    const image = Images.get(`../../assets/enemies/${this.name}/${this.curr_sprite}.gif`);

    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.scale(this.direction, 1);

    const x_position = this.direction === -1 ? -this.size.x :0;

    if (this.invencible) {
      drawer.filter = "brightness(1.5)"; // Increase brightness (1.5 = 150%)
    }

    drawer.drawImage(image, x_position, 0, this.size.x, this.size.y);
    drawer.filter = "none";
    drawer.restore();
  }

  updateSprite() {
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
    // Um inimigo morto por tiro/faca/granada depois do seu update ainda estaria no array:
    // so contabiliza a morte, sem se mover nem machucar o jogador.
    if (this.life <= 0) {
      this.checkIsDead();
      return this;
    }

    this.updateSprite();
    this.move();
    if (this.invencible) this.takingHit();
    this.checkCollisionWithPlayer();
    this.checkIsDead();

    return this;
  }

  // Move o inimigo (pelo centro) em direcao a um ponto; speed negativo afasta.
  moveTowards(target, speed) {
    const { x, y } = GameEvents.getNextPointInLine(this.center(), target, speed);
    this.position.x = x - this.size.x / 2;
    this.position.y = y - this.size.y / 2;
  }

  move() {
    const player = Main.instance().getPlayerInstance();
    const player_center = player.center();

    if (GameEvents.checkCollision(player, this)) return;

    this.direction = this.center().x >= player_center.x ? -1 : 1;
    this.moveTowards(player_center, this.speed);
  }

  takingHit() {
    this.moveTowards(Main.instance().getPlayerInstance().center(), -(this.speed * 2));
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

  hitbox() {
    return { x: this.position.x, y: this.position.y, w: this.size.x, h: this.size.y };
  }

  center() {
    return { x: this.position.x + this.size.x / 2, y: this.position.y + this.size.y / 2 };
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
