import Particle from "./Particle.js";
import Canvas from "../config/Canvas.js";
import GameEvents from "../config/GameEvents.js";
import Main from "../Main.js";

class Bullet extends Particle {
  constructor({ start_pos, end_pos, strength }) {
    const final_position = Bullet.getBulletFinalPosition(start_pos, end_pos);
    super({ start_pos, end_pos: final_position, speed: 50, size: { x: 10, y: 10 } });
    this.strength = strength;
  }

  draw() {
    const drawer = Canvas.drawer();

    drawer.fillStyle = "rgb(255, 255, 255)";
    drawer.fillRect(this.curr_pos.x, this.curr_pos.y, this.size.x, this.size.y);
  }

  update() {
    super.update();
    this.checkColitionWithEnemies();

    return this;
  }

  static getBulletFinalPosition(first_position, mouse_position) {
    const direction = {
      x: mouse_position.x - first_position.x,
      y: mouse_position.y - first_position.y,
    };

    // Mouse exatamente sobre o ponto de saida: sem direcao, atira para a direita.
    const magnitude = Math.hypot(direction.x, direction.y);
    const normalizedDirection = magnitude === 0
      ? { x: 1, y: 0 }
      : { x: direction.x / magnitude, y: direction.y / magnitude };

    // A diagonal da tela e longe o bastante para sair dela partindo de qualquer ponto
    // (sem dividir pelas componentes, que davam NaN em tiros exatamente na vertical/horizontal).
    const reach = Math.hypot(window.innerWidth, window.innerHeight);

    return {
      x: first_position.x + normalizedDirection.x * reach,
      y: first_position.y + normalizedDirection.y * reach,
    };
  }

  // A bala acerta o alvo mais proximo de onde saiu entre os que ela toca (inimigos e caixas de
  // suprimentos), e some. Antes ela atravessava inimigos recem-atingidos e acertava todos.
  checkColitionWithEnemies() {
    const main = Main.instance();
    const touched = [...main.getEnemiesInstance().getEnemies(), ...main.getAirdropsInstance().getSolidCrates()]
      .filter((target) => target.isVisible() && GameEvents.checkCollision(this, target));

    if (!touched.length) return;

    const distance = (target) => Math.hypot(target.center().x - this.start_pos.x, target.center().y - this.start_pos.y);
    const target = touched.reduce((nearest, other) => (distance(other) < distance(nearest) ? other : nearest));

    target.getHit(this.strength);
    this.visible = false;
  }
}

export default Bullet;
