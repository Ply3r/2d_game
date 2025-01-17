import Canvas from "./Canvas.js";
import Controls from "./Controls.js";
import Main from "../Main.js";
import GameEvents from "./GameEvents.js";

class Player {
  SPRITE_WIDTH = 16;
  SPRITE_HEIGHT = 20;
  PLAYER_SIZE = { x: 80, y: 80 };
  MOVE_SPEED = 8;
  PLAYER_TOTAL_LIFE = 3;
  INVENCIBLE_TIME_AFTER_HIT = 500;

  constructor() {
    this.setup();
  }

  setup() {
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
    this.inventory = { 1: GameEvents.randomWeapon('gun'), 2: GameEvents.randomWeapon('melee'), 3: GameEvents.randomWeapon('throable'), 4: null };
    this.curr_item = 1;
    this.current_sprite = 0;
    this.life = this.PLAYER_TOTAL_LIFE;
    this.invencible = false;
    this.enemies_killed = 0;
    this.changing_inventory = false;
  }

  draw() {
    this.update();
    const drawer = Canvas.drawer();

    // Personagem
    const player_img = new Image();
    const img_pos = this.getImagePosition();
    player_img.src = './assets/player.png';
    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.drawImage(player_img, img_pos.x, img_pos.y, this.SPRITE_WIDTH, this.SPRITE_HEIGHT, -40, 0, this.PLAYER_SIZE.x, this.PLAYER_SIZE.y)

    // weapon
    const weapon = this.inventory[this.curr_item];
    if (weapon) weapon.draw(this.position, Controls.getMousePosition());
  }

  update() {
    this.move();
    this.automaticAttack();
    this.reload();
    this.changeInventory();
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
    const holding_numbers = holding_keys.filter((key) => key.match(/[1-4]/gm))

    if(holding_numbers.length && this.inventory[holding_numbers[0]]) {
      this.curr_item = holding_numbers[0];
    }

    setTimeout(() => this.changing_inventory = false, 100)
  }

  move() {
    const holding_keys = Controls.getHoldingKeys();
    let move_speed = this.MOVE_SPEED;

    if (this.checkCollisionWithEnemies()) move_speed = move_speed / 4;    
    this.updatePosition(holding_keys, move_speed);
    this.updateSprite(holding_keys);
  }

  checkCollisionWithEnemies() {
    const enemies = Main.instance().getEnemiesInstance().getEnemies();
    return enemies.some(enemy => GameEvents.checkCollision(this, enemy))
  }

  updatePosition(holding_keys, move_speed) {
    if(holding_keys.includes('a') && this.position.x > 40) this.position.x -= move_speed;
    if(holding_keys.includes('w') && this.position.y > 0) this.position.y -= move_speed;
    if(holding_keys.includes('s') && this.position.y < window.innerHeight - this.PLAYER_SIZE.y) this.position.y += move_speed;
    if(holding_keys.includes('d') && this.position.x < window.innerWidth - 40) this.position.x += move_speed;
  }

  updateSprite(holding_keys) {
    const move_keys = ['a', 'w', 's', 'd'];
    if (holding_keys.some((key) => move_keys.includes(key))) {
      this.current_sprite += 1;
      if (this.current_sprite >= 3) this.current_sprite = 0;
    }
  }

  automaticAttack() {
    if (!this.inventory[this.curr_item]) return;
    const weapon_attributes = this.inventory[this.curr_item].attributes();

    if (weapon_attributes.automatic) {
      const holding_click = Controls.getHoldingClick();
      if (!holding_click) return;

      this.attack();
    }
  }

  attack() {
    if (!this.inventory[this.curr_item]) return;
    this.inventory[this.curr_item].attack(this.position, Controls.getMousePosition());
  }

  getHit(strength) {
    this.life -= strength;
    this.invencible = true;

    if (this.life <= 0) Main.instance().finishGame();

    setTimeout(() => {
      this.invencible = false;
    }, this.INVENCIBLE_TIME_AFTER_HIT)
  }

  getLastDirection() {
    const holding_keys = Controls.getHoldingKeys();
    return holding_keys[holding_keys.length - 1];
  }

  getImagePosition() {
    let yOffSet = null;

    switch(this.getLastDirection()) {
      case 'w':
        yOffSet = 3
        break;
      case 'a':
        yOffSet = 1
        break;
      case 'd':
        yOffSet = 2
        break;
      case 's':
        yOffSet = 0
        break;
    }

    const getPos = (offset, width) => offset * width;
    return { x: getPos(this.current_sprite, this.SPRITE_WIDTH), y: getPos(yOffSet, this.SPRITE_HEIGHT) }
  }

  increaseEnemiesKilled() {
    this.enemies_killed += 1;
  }

  increaseLife() {
    this.life += 1;
    if (this.life >= 5) this.life = 5;
  }

  attributes() {
    return {
      inventory: this.inventory,
      life: this.life,
      position: this.position,
      size: this.PLAYER_SIZE,
      invencible: this.invencible,
      enemies_killed: this.enemies_killed
    }
  }
}

export default Player;

