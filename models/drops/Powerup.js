import Drop from "./Drop.js";
import Canvas from "../config/Canvas.js";
import Clock from "../config/Clock.js";
import Main from "../Main.js";
import { drawPowerupIcon } from "../config/Powerups.js";

const SIZE = 48;

// Powerup no chao: ao pegar, o jogador ganha um nivel daquele powerup.
class Powerup extends Drop {
  constructor(position, type) {
    super({ position, size: { x: SIZE, y: SIZE }, image: null });
    this.type = type;
  }

  // Flutua um pouco para chamar atencao.
  draw() {
    const bob = Math.sin(Clock.now() / 180) * 3;
    drawPowerupIcon(Canvas.drawer(), this.type, this.position.x, this.position.y + bob, SIZE);
  }

  pickUp() {
    Main.instance().getPlayerInstance().addPowerup(this.type);
  }

  checkPlayerCollision() {
    super.checkPlayerCollision(this.pickUp);
  }
}

// Uma classe por tipo, para o sorteio da caixa tratar todos os itens do mesmo jeito (new Loot(position)).
const drop = (type) => class extends Powerup {
  constructor(position) {
    super(position, type);
  }
};

export const MultishotDrop = drop('multishot');
export const FireRateDrop = drop('fire_rate');
export const DamageDrop = drop('damage');
export const ShieldDrop = drop('shield');

export default Powerup;
