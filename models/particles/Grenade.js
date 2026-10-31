import Particle from "./Particle.js";
import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
import GameEvents from "../config/GameEvents.js";
import Clock from "../config/Clock.js";

class Grenade extends Particle {
  constructor({ start_pos, end_pos, speed, size, duration }) {
    super({ start_pos, end_pos, speed, size, image: '../../assets/weapons/throable/grenade/grenade.png' });
    this.duration = duration;
    this.start = Clock.now(); // mesmo instante do timeout da explosao, em Grenade (arma)
    this.path = GameEvents.getThrowPath(start_pos, end_pos);
    this.curr_pos = { ...this.path[0] };
  }

  // A granada e centrada na curva, assim ela pousa no ponto marcado pela previa, e gira no ar.
  draw() {
    const drawer = Canvas.drawer();
    const image = Images.get(this.image);
    const progress = Math.min((Clock.now() - this.start) / this.duration, 1);

    // save/restore: as particulas sao desenhadas em sequencia e esperam a transformacao original
    drawer.save();
    drawer.translate(this.curr_pos.x, this.curr_pos.y);
    drawer.rotate(progress * Math.PI * 6);
    drawer.drawImage(image, -this.size.x / 2, -this.size.y / 2, this.size.x, this.size.y);
    drawer.restore();
  }

  // Nao usa a checagem de "chegou perto do fim" da Particle: o voo termina pelo tempo.
  update() {
    this.updatePosition();
    return this;
  }

  updatePosition() {
    const progress = Math.min((Clock.now() - this.start) / this.duration, 1);

    if (progress === 1) return this.visible = false;

    this.curr_pos = GameEvents.calculatePointOnBezier(this.path, progress);
  }
}

export default Grenade;
