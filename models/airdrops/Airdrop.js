import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";

const IMAGE = './assets/airdrop/crate.png';
const PARACHUTE_IMAGE = './assets/airdrop/parachute.png';
const SIZE = 64;
const PARACHUTE = { w: 112, h: 72 };

const GRAVITY = 0.35;            // px/tick^2
const PARACHUTE_SPEED = 4;       // velocidade maxima de descida com o paraquedas aberto
const RELEASE_HEIGHT = 130;      // altura (acima do chao) em que a caixa solta o paraquedas
const RESTITUTION = 0.4;         // parte da velocidade que sobra a cada quicada
const MIN_BOUNCE_SPEED = 1.5;    // abaixo disso a caixa para
const HIT_FLASH_TICKS = 6;
const PARACHUTE_FADE_TICKS = 50;

// Caixa de suprimentos: desce de paraquedas, solta o paraquedas perto do chao, cai em queda
// livre e quica ate parar. Depois de pousar e solida (bloqueia jogador e zumbis) e leva tiros;
// quando a vida acaba, quebra e solta um item.
class Airdrop {
  // landing: onde o canto superior esquerdo da caixa fica ao pousar.
  constructor({ landing, life = 10 }) {
    this.landing = { ...landing };
    this.position = { x: landing.x, y: -(PARACHUTE.h + SIZE) };
    this.size = { x: SIZE, y: SIZE };
    this.velocity = 0;
    this.life = life;
    this.landed = false;
    this.parachute = { open: true, y: 0, alpha: 1 };
    this.flash = 0;
    this.visible = true;
  }

  update() {
    if (this.flash > 0) this.flash -= 1;
    this.updateParachute();
    this.updateFall();

    return this;
  }

  updateFall() {
    const height = this.landing.y - this.position.y;

    if (this.parachute.open) {
      this.velocity = Math.min(this.velocity + GRAVITY, PARACHUTE_SPEED);
      if (height <= RELEASE_HEIGHT) this.releaseParachute();
    } else {
      this.velocity += GRAVITY;
    }

    this.position.y += this.velocity;
    if (this.position.y < this.landing.y) return;

    // tocou o chao: quica com perda de energia ate a velocidade ficar baixa demais
    this.position.y = this.landing.y;
    this.landed = true;
    this.velocity = this.velocity * RESTITUTION >= MIN_BOUNCE_SPEED ? -this.velocity * RESTITUTION : 0;
  }

  releaseParachute() {
    if (!this.parachute.open) return;

    this.parachute.open = false;
    this.parachute.y = this.position.y - PARACHUTE.h + 4;
    this.parachute.ticks = 0;
  }

  // Solto, o paraquedas flutua para baixo devagar e some.
  updateParachute() {
    const chute = this.parachute;
    if (chute.open || chute.alpha <= 0) return;

    chute.ticks += 1;
    chute.y += 1.2;
    chute.alpha = Math.max(0, 1 - chute.ticks / PARACHUTE_FADE_TICKS);
  }

  getHit(strength) {
    if (!this.landed) return;

    this.life -= strength;
    this.flash = HIT_FLASH_TICKS;
    if (this.life <= 0) this.visible = false;
  }

  // Sombra no chao: cresce e escurece conforme a caixa se aproxima.
  drawShadow(drawer) {
    const closeness = Math.min(1, Math.max(0, 1 - (this.landing.y - this.position.y) / 700));
    drawer.save();
    drawer.fillStyle = `rgba(0, 0, 0, ${0.12 + 0.23 * closeness})`;
    drawer.beginPath();
    drawer.ellipse(this.landing.x + SIZE / 2, this.landing.y + SIZE - 2, (SIZE / 2) * (0.5 + 0.5 * closeness), 9 * (0.5 + 0.5 * closeness), 0, 0, Math.PI * 2);
    drawer.fill();
    drawer.restore();
  }

  drawCrate(drawer) {
    drawer.save();
    drawer.imageSmoothingEnabled = false;
    if (this.flash > 0) drawer.filter = "brightness(1.8)";
    drawer.drawImage(Images.get(IMAGE), this.position.x, this.position.y, SIZE, SIZE);
    drawer.restore();
  }

  drawParachute(drawer) {
    const chute = this.parachute;
    if (chute.alpha <= 0) return;

    const y = chute.open ? this.position.y - PARACHUTE.h + 4 : chute.y;
    drawer.save();
    drawer.imageSmoothingEnabled = false;
    drawer.globalAlpha = chute.alpha;
    drawer.drawImage(Images.get(PARACHUTE_IMAGE), this.position.x + (SIZE - PARACHUTE.w) / 2, y, PARACHUTE.w, PARACHUTE.h);
    drawer.restore();
  }

  // No chao: sombra e caixa, por baixo de jogador e inimigos.
  draw() {
    const drawer = Canvas.drawer();
    this.drawShadow(drawer);
    if (this.landed) this.drawCrate(drawer);
  }

  // No ar: a caixa descendo e o paraquedas, por cima de tudo.
  drawAir() {
    if (this.landed && this.parachute.alpha <= 0) return;

    const drawer = Canvas.drawer();
    if (!this.landed) this.drawCrate(drawer);
    this.drawParachute(drawer);
  }

  isVisible() {
    return this.visible;
  }

  // So bloqueia e leva tiro depois de tocar o chao.
  isSolid() {
    return this.landed;
  }

  hitbox() {
    return { x: this.position.x, y: this.position.y, w: SIZE, h: SIZE };
  }

  center() {
    return { x: this.position.x + SIZE / 2, y: this.position.y + SIZE / 2 };
  }
}

export default Airdrop;
