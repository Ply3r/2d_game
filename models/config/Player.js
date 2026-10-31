import Canvas from "./Canvas.js";
import Images from "./Images.js";
import Controls from "./Controls.js";
import Main from "../Main.js";
import GameEvents from "./GameEvents.js";
import Clock from "./Clock.js";
import Shields from "./Shields.js";
import { startingPowerups } from "./UrlOptions.js";
import { POWERUPS, emptyPowerups, damageMultiplier } from "./Powerups.js";

class Player {
  SPRITE_SIZE = 80;
  WALK_FRAMES = 4;
  TICKS_PER_FRAME = 6;
  PLAYER_SIZE = { x: 80, y: 80 };
  MOVE_SPEED = 8;
  PLAYER_TOTAL_LIFE = 3;
  MAX_LIFE = 5;
  INVENCIBLE_TIME_AFTER_HIT = 500;
  KNOCKBACK_FRICTION = 0.85;   // a cada tick o empurrao perde 15% da forca

  constructor() {
    this.setup();
  }

  setup() {
    this.shields = new Shields(this);
    this.reset();
    Canvas.addListener('click', () => this.attack());
  }

  addItem(item) {
    let empty_slot = Object.values(this.inventory).findIndex((item) => !item) + 1;
    if (!empty_slot) empty_slot = this.curr_item;
    this.inventory[empty_slot] = item;
  }

  reset() {
    this.position = { x: Math.floor(window.innerWidth / 2), y: Math.floor(window.innerHeight / 2) };
    this.inventory = { 1: GameEvents.randomWeapon('gun'), 2: null, 3: null, 4: null };
    this.curr_item = 1;
    this.current_sprite = 0;
    this.sprite_ticks = 0;
    this.life = this.PLAYER_TOTAL_LIFE;
    this.invencible = false;
    this.last_hit_time = 0;
    this.enemies_killed = 0;
    this.changing_inventory = false;
    this.knockback = { x: 0, y: 0 };   // empurrao recebido (px por tick), ex.: atropelado pelo vendedor
    this.powerups = { ...emptyPowerups(), ...startingPowerups() };
    this.powerup_toast = null;   // { type, time }: aviso do ultimo powerup pego
    this.shields?.reset();
  }

  // Ganha um nivel do powerup; devolve false se ele ja esta no maximo.
  addPowerup(type) {
    if (this.powerups[type] >= POWERUPS[type].max) return false;

    this.powerups[type] += 1;
    this.powerup_toast = { type, time: Clock.now() };
    return true;
  }

  // A arma de fogo do jogador: a da mao, ou a do slot 1 se ele estiver com faca/granada.
  gun() {
    const current = this.inventory[this.curr_item];
    if (current?.getType() === 'gun') return current;
    return this.inventory[1]?.getType() === 'gun' ? this.inventory[1] : null;
  }

  // Dano de cada projetil (e de cada escudo): o da arma de fogo com o bonus de dano.
  gunDamage() {
    return (this.gun()?.strength ?? 1) * damageMultiplier(this.powerups.damage);
  }

  draw() {
    const drawer = Canvas.drawer();

    // Personagem
    const player_img = Images.get('./assets/player.png');
    const img_pos = this.getImagePosition();
    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.drawImage(player_img, img_pos.x, img_pos.y, this.SPRITE_SIZE, this.SPRITE_SIZE, -40, 0, this.PLAYER_SIZE.x, this.PLAYER_SIZE.y)

    // weapon
    const weapon = this.inventory[this.curr_item];
    if (weapon) weapon.draw(this.position, Controls.getMousePosition());

    this.shields.draw();
  }

  update() {
    this.move();
    this.updateKnockback();
    this.automaticAttack();
    this.reload();
    this.changeInventory();
    this.shields.update();
  }

  reload() {
    const holding_keys = Controls.getHoldingKeys();
    if (!holding_keys.includes('r')) return;
    this.inventory[this.curr_item].reload();
  };

  changeInventory() {
    if (this.changing_inventory) return;
  
    this.changing_inventory = true;
    const holding_keys = Controls.getHoldingKeys();
    const holding_numbers = holding_keys.filter((key) => key.match(/^[1-4]$/))

    if(holding_numbers.length && this.inventory[holding_numbers[0]]) {
      this.curr_item = holding_numbers[0];
    }

    Clock.after(100, () => this.changing_inventory = false)
  }

  move() {
    const holding_keys = Controls.getHoldingKeys();
    let move_speed = this.MOVE_SPEED;

    if (this.checkCollisionWithEnemies()) move_speed = move_speed / 4;    
    this.updatePosition(holding_keys, move_speed);
    this.updateSprite(holding_keys);
  }

  // Lanca o jogador com a velocidade (vx, vy); soma com o empurrao que ele ja estiver levando.
  knockBack(vx, vy = 0) {
    this.knockback.x += vx;
    this.knockback.y += vy;
  }

  updateKnockback() {
    const { knockback } = this;
    if (Math.abs(knockback.x) < 0.1 && Math.abs(knockback.y) < 0.1) {
      knockback.x = 0;
      knockback.y = 0;
      return;
    }

    // mesmos limites do movimento normal: nao sai da tela
    this.position.x = Math.min(window.innerWidth - 40, Math.max(40, this.position.x + knockback.x));
    this.position.y = Math.min(window.innerHeight - this.PLAYER_SIZE.y, Math.max(0, this.position.y + knockback.y));
    knockback.x *= this.KNOCKBACK_FRICTION;
    knockback.y *= this.KNOCKBACK_FRICTION;
  }

  checkCollisionWithEnemies() {
    const enemies = Main.instance().getEnemiesInstance().getEnemies();
    return enemies.some(enemy => enemy.isVisible() && GameEvents.checkCollision(this, enemy))
  }

  updatePosition(holding_keys, move_speed) {
    if(holding_keys.includes('a') && this.position.x > 40) this.position.x -= move_speed;
    if(holding_keys.includes('w') && this.position.y > 0) this.position.y -= move_speed;
    if(holding_keys.includes('s') && this.position.y < window.innerHeight - this.PLAYER_SIZE.y) this.position.y += move_speed;
    if(holding_keys.includes('d') && this.position.x < window.innerWidth - 40) this.position.x += move_speed;
  }

  // Quadros de caminhada so rodam andando (a cada TICKS_PER_FRAME ticks); parado volta ao quadro 0.
  updateSprite(holding_keys) {
    const move_keys = ['a', 'w', 's', 'd'];

    if (!holding_keys.some((key) => move_keys.includes(key))) {
      this.current_sprite = 0;
      this.sprite_ticks = 0;
      return;
    }

    this.sprite_ticks += 1;
    if (this.sprite_ticks >= this.TICKS_PER_FRAME) {
      this.sprite_ticks = 0;
      this.current_sprite = (this.current_sprite + 1) % this.WALK_FRAMES;
    }
  }

  automaticAttack() {
    if (!this.inventory[this.curr_item]) return;
    const weapon_attributes = this.inventory[this.curr_item].attributes();

    // Com o powerup de cadencia, armas de clique tambem atiram segurando o botao.
    const auto_fire = weapon_attributes.automatic || (weapon_attributes.type === 'gun' && this.powerups.fire_rate > 0);
    if (auto_fire) {
      const holding_click = Controls.getHoldingClick();
      if (!holding_click) return;

      this.attack();
    }
  }

  attack() {
    if (!this.inventory[this.curr_item] || Main.instance().blocksAttack()) return;
    this.inventory[this.curr_item].attack(this.position, Controls.getMousePosition());
  }

  getHit(strength) {
    if (this.invencible) return;

    this.life -= strength;
    this.invencible = true;
    this.last_hit_time = Clock.now();

    if (this.life <= 0) Main.instance().finishGame();

    Clock.after(this.INVENCIBLE_TIME_AFTER_HIT, () => {
      this.invencible = false;
    });
  }

  // O corpo olha na direcao da mira (eixo dominante), a mesma em que a arma aponta.
  getFacing() {
    const mouse = Controls.getMousePosition();
    const dx = mouse.x - this.position.x;
    const dy = mouse.y - (this.position.y + this.PLAYER_SIZE.y / 2);

    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  getImagePosition() {
    const rows = { down: 0, left: 1, right: 2, up: 3 };

    return { x: this.current_sprite * this.SPRITE_SIZE, y: rows[this.getFacing()] * this.SPRITE_SIZE };
  }

  increaseEnemiesKilled() {
    this.enemies_killed += 1;
  }

  increaseLife() {
    this.life += 1;
    if (this.life >= this.MAX_LIFE) this.life = this.MAX_LIFE;
  }

  // O sprite e desenhado de position.x - 40 a position.x + 40 (position e o topo, no centro).
  hitbox() {
    return { x: this.position.x - this.PLAYER_SIZE.x / 2, y: this.position.y, w: this.PLAYER_SIZE.x, h: this.PLAYER_SIZE.y };
  }

  center() {
    return { x: this.position.x, y: this.position.y + this.PLAYER_SIZE.y / 2 };
  }

  attributes() {
    return {
      inventory: this.inventory,
      life: this.life,
      max_life: this.MAX_LIFE,
      last_hit_time: this.last_hit_time,
      position: this.position,
      size: this.PLAYER_SIZE,
      invencible: this.invencible,
      enemies_killed: this.enemies_killed,
      powerups: this.powerups,
      powerup_toast: this.powerup_toast,
    }
  }
}

export default Player;

