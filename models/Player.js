import Canvas from "./Canvas.js";
import Gun from "./Gun.js"

class Player {
  SPRITE_WIDTH = 16
  SPRITE_HEIGHT = 20
  PLAYER_SIZE = 80
  MOVE_SPEED = 25

  constructor() {
    this.setup();
  }

  setup() {
    this.position = { x: Math.floor(window.innerWidth / 2), y: Math.floor(window.innerHeight / 2) };
    this.mouse_position = { x: 0, y: 0 };
    this.inventory = [new Gun()];
    this.direction = 'bottom';
    this.current_sprite = 0;

    this.add_event_handlers();
  }

  draw() {
    const drawer = Canvas.drawer();

    // Personagem
    const player_img = new Image();
    const img_pos = this.getImagePosition();
    player_img.src = './assets/player.png';
    drawer.setTransform(1, 0, 0, 1, this.position.x, this.position.y);
    drawer.drawImage(player_img, img_pos.x, img_pos.y, this.SPRITE_WIDTH, this.SPRITE_HEIGHT, 0, 0, this.PLAYER_SIZE, this.PLAYER_SIZE)


    // Crosshair
    const crosshair_img = new Image();
    crosshair_img.src = './assets/crosshair.png';
    drawer.setTransform(1, 0, 0, 1, this.mouse_position.x, this.mouse_position.y);
    drawer.drawImage(crosshair_img, 0, 0, 25, 25);

    const gun = this.inventory[0];
    gun.draw(this.position, this.mouse_position);
  }

  getImagePosition() {
    let yOffSet = null;

    switch(this.direction) {
      case 'top':
        yOffSet = 3
        break;
      case 'left':
        yOffSet = 1
        break;
      case 'right':
        yOffSet = 2
        break;
      case 'bottom':
        yOffSet = 0
        break;
    }

    const getPos = (offset, width) => offset * width;
    return { x: getPos(this.current_sprite, this.SPRITE_WIDTH), y: getPos(yOffSet, this.SPRITE_HEIGHT) }
  }

  changeDirection(direction) {
    if (this.direction !== direction) {
      this.current_sprite = 0;
    }

    this.direction = direction;
  }

  movePlayer(event) {
    switch(event.key) {
      case 'a':
        this.position.x -= this.MOVE_SPEED;
        this.changeDirection('left')
        break;
      case 'w':
        this.position.y -= this.MOVE_SPEED;
        this.changeDirection('top');
        break;
      case 's':
        this.position.y += this.MOVE_SPEED;
        this.changeDirection('bottom');
        break;
      case 'd':
        this.position.x += this.MOVE_SPEED;
        this.changeDirection('right');
        break;
      default:
        return;
    }

    this.current_sprite += 1;
    if (this.current_sprite >= 3) this.current_sprite = 0;
  }

  moveMouse(event) {
    this.mouse_position.x = event.clientX
    this.mouse_position.y = event.clientY
  }

  shoot() {
    this.inventory[0].fire(this.position, this.mouse_position);
  }

  add_event_handlers() {
    Canvas.addListener('keydown', (event) => this.movePlayer(event))
    Canvas.addListener('mousemove', (event) => this.moveMouse(event))
    Canvas.addListener('click', () => this.shoot())
  }
}

export default Player;

