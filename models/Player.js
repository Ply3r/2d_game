import Canvas from "./Canvas.js";
import GameEvents from "./GameEvents.js";
import Controls from "./Controls.js";

class Player {
  SPRITE_WIDTH = 16;
  SPRITE_HEIGHT = 20;
  PLAYER_SIZE = 80;
  MOVE_SPEED = 8;
  PLAYER_TOTAL_LIFE = 3;
  INVENCIBLE_TIME_AFTER_HIT = 500;

  constructor() {
    this.setup();
  }

  setup() {
    this.position = { x: Math.floor(window.innerWidth / 2), y: Math.floor(window.innerHeight / 2) };
    this.inventory = [GameEvents.randomGun()];
    this.current_sprite = 0;
    this.life = this.PLAYER_TOTAL_LIFE;
    this.invencible = false;

    Canvas.addListener('click', () => this.shoot());
  }

  draw() {
    this.update();
    const drawer = Canvas.drawer();

    // Personagem
    const player_img = new Image();
    const img_pos = this.getImagePosition();
    player_img.src = './assets/player.png';
    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.drawImage(player_img, img_pos.x, img_pos.y, this.SPRITE_WIDTH, this.SPRITE_HEIGHT, -40, 0, this.PLAYER_SIZE, this.PLAYER_SIZE)

    // Gun
    const gun = this.inventory[0];
    gun.draw(this.position, Controls.getMousePosition());
  }

  update() {
    this.move();
    this.automaticShoot();
  }

  move() {
    const holding_keys = Controls.getHoldingKeys();

    if(holding_keys.includes('a')) this.position.x -= this.MOVE_SPEED;
    if(holding_keys.includes('w')) this.position.y -= this.MOVE_SPEED;
    if(holding_keys.includes('s')) this.position.y += this.MOVE_SPEED;
    if(holding_keys.includes('d')) this.position.x += this.MOVE_SPEED;

    const move_keys = ['a', 'w', 's', 'd'];
    if (holding_keys.some((key) => move_keys.includes(key))) {
      this.current_sprite += 1;
      if (this.current_sprite >= 3) this.current_sprite = 0;
    }
  }
  
  automaticShoot() {
    const gun_attributes = this.inventory[0].attributes();

    if (gun_attributes.automatic) {
      const holding_click = Controls.getHoldingClick();
      if (!holding_click) return;

      this.shoot();
    }
  }

  shoot() {
    this.inventory[0].fire(this.position, Controls.getMousePosition());
  }

  getHit() {
    if (this.life <= 0) {
      location.reload();
    }

    this.life -= 1;
    this.invencible = true;

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

  attributes() {
    return {
      curr_gun: this.inventory[0],
      life: this.life,
      position: this.position,
      size: this.PLAYER_SIZE,
      invencible: this.invencible,
    }
  }
}

export default Player;

