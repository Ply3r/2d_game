import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
import GameEvents from "../config/GameEvents.js";

const DRIVING_IMAGE = './assets/vendor/driving.png';   // 9 quadros de 256x256 lado a lado, van virada para a esquerda
const PARKED_IMAGE = './assets/vendor/parked.png';     // o primeiro quadro, sem a fumaca: a van parada
const FRAME = 256;
const FRAMES = 9;
const TICKS_PER_FRAME = 4;
const SCALE = 3;           // desenhada em 3x (escala inteira: pixel art nitida); a van fica com ~400 px
// Ponto do quadro (em px do sprite) que fica sobre a "ancora" do vendedor: centro da van, fundo das rodas.
// O quadro e desenhado espelhado (o original olha para a esquerda), com a van indo para a direita.
const ANCHOR = { x: FRAME - 100.5, y: 158 };
const FRONT = (FRAME - 32 - ANCHOR.x) * SCALE;   // da ancora ate a frente da van, na tela

const STOP_Y = 290;        // altura do fundo das rodas, na parte de cima da tela
// Base solida da van (no quadro, sem espelhar): do para-choque da frente ao de tras, e a faixa de baixo
// (rodas e saia). Como nos objetos do mapa, quem passa atras da parte alta fica escondido por ela.
const BASE = { left: 34, right: 167, top: 125, bottom: 158 };
// A van inteira no quadro parado (sem a fumaca), para o mouse: passar o cursor em cima dela.
const BODY = { left: 32, right: 171, top: 87, bottom: 159 };
const KNOCKBACK = { min: 10, per_speed: 2.5 };   // velocidade do empurrao: min + per_speed * velocidade da van
const MAX_SPEED = 9;       // px por tick
const MIN_SPEED = 1.5;     // chegando, desacelera ate isto
const BRAKE = 0.06;        // chegando, a velocidade e esta fracao da distancia que falta
const ACCELERATION = 0.25; // saindo
const MESSAGE = 'Bora comprar?';
const TICKS_PER_LETTER = 4;

const BALLOON = { font: 24, padding: 14, line: 3, tail: 16 };
const COLORS = { balloon: '#f1ece3', outline: '#1b1720', text: '#1b1720' };

// Vendedor que aparece no fim das hordas 5, 10, 15...: chega dirigindo ate o centro da parte de
// cima da tela, para, oferece "Bora comprar?" e vai embora quando o jogador aperta espaco.
// Quando ele sai da tela, chama onLeave() (o jogo comeca a proxima horda).
class Vendor {
  constructor({ onLeave = () => {} } = {}) {
    this.onLeave = onLeave;
    this.reset();
  }

  reset() {
    this.state = 'away';   // away -> arriving -> stopped -> leaving -> away
    this.x = -FRAME * SCALE;   // centro da van; assim ela comeca inteira fora da tela
    this.speed = 0;
    this.frame = 0;
    this.frame_ticks = 0;
    this.letters = 0;
    this.letter_ticks = 0;
  }

  arrive() {
    this.reset();
    this.state = 'arriving';
    this.speed = MAX_SPEED;
  }

  // Espaco: so vale depois que ele parou. Devolve se foi embora.
  dismiss() {
    if (this.state !== 'stopped') return false;

    this.state = 'leaving';
    this.speed = 0;
    return true;
  }

  isPresent() {
    return this.state !== 'away';
  }

  isMoving() {
    return this.state === 'arriving' || this.state === 'leaving';
  }

  // Base solida na tela (null fora da tela). Espelhada: a frente fica a direita.
  hitbox() {
    if (!this.isPresent()) return null;

    return {
      x: this.x + (ANCHOR.x - (FRAME - BASE.left)) * SCALE,
      y: STOP_Y - (ANCHOR.y - BASE.top) * SCALE,
      w: (BASE.right - BASE.left) * SCALE,
      h: (BASE.bottom - BASE.top) * SCALE,
    };
  }

  // Retangulo da van inteira na tela (espelhada).
  bodyRect() {
    return {
      x: this.x + (ANCHOR.x - (FRAME - BODY.left)) * SCALE,
      y: STOP_Y - (ANCHOR.y - BODY.top) * SCALE,
      w: (BODY.right - BODY.left) * SCALE,
      h: (BODY.bottom - BODY.top) * SCALE,
    };
  }

  // O mouse esta sobre a van parada? (cursor de conversa; clicar abre o close do vendedor)
  isHovered(point) {
    if (this.state !== 'stopped') return false;

    const rect = this.bodyRect();
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  // Onde a van fica parada (para o airdrop nao cair embaixo dela).
  static parkedHitbox() {
    const vendor = new Vendor();
    vendor.state = 'stopped';
    vendor.x = window.innerWidth / 2;
    return vendor.hitbox();
  }

  // Ninguem atravessa a van. Andando, quem estiver na frente dela e jogado para a frente
  // (para a direita, o sentido em que ela anda), com mais forca quanto mais rapido ela vai.
  collide(player) {
    const box = this.hitbox();
    if (!box) return;

    const body = player.hitbox();
    if (!GameEvents.rectsOverlap(body, box)) return;

    const in_front = body.x + body.w / 2 > this.x;
    if (!this.isMoving() || !in_front) {
      Vendor.pushOutNearestSide(player, box);
      return;
    }

    const ahead = box.x + box.w + body.w / 2;   // position.x do jogador e o centro dele
    if (ahead <= window.innerWidth - body.w / 2) {
      player.position.x = ahead;
      player.knockBack(KNOCKBACK.min + KNOCKBACK.per_speed * this.speed);
    } else {
      // encostado na borda da tela, nao tem para onde ir na frente: sai por cima ou por baixo
      Vendor.pushOutNearestSide(player, box, ['up', 'down']);
    }
  }

  // Tira o corpo de dentro de `box` pelo lado mais perto (a van e grande: o jogador pode estar
  // la no meio, e o pushOut do mapa so resolve sobreposicoes pequenas).
  static pushOutNearestSide(player, box, sides = ['left', 'right', 'up', 'down']) {
    const body = player.hitbox();
    const moves = {
      left: { x: box.x - (body.x + body.w), y: 0 },
      right: { x: box.x + box.w - body.x, y: 0 },
      up: { x: 0, y: box.y - (body.y + body.h) },
      down: { x: 0, y: box.y + box.h - body.y },
    };
    const size = ({ x, y }) => Math.abs(x) + Math.abs(y);
    const move = sides.map((side) => moves[side]).reduce((best, other) => (size(other) < size(best) ? other : best));

    player.position.x += move.x;
    player.position.y += move.y;
  }

  isWaitingForPlayer() {
    return this.state === 'stopped';
  }

  message() {
    return MESSAGE.slice(0, this.letters);
  }

  update() {
    if (this.state === 'arriving') this.updateArriving();
    else if (this.state === 'stopped') this.updateMessage();
    else if (this.state === 'leaving') this.updateLeaving();
  }

  updateArriving() {
    const target = window.innerWidth / 2;
    const remaining = target - this.x;
    this.speed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, remaining * BRAKE));
    this.x += Math.min(this.speed, remaining);
    this.animate();

    if (this.x >= target) this.state = 'stopped';
  }

  // "Bora comprar?" aparece letra por letra.
  updateMessage() {
    if (this.letters >= MESSAGE.length) return;

    this.letter_ticks += 1;
    if (this.letter_ticks < TICKS_PER_LETTER) return;

    this.letter_ticks = 0;
    this.letters += 1;
  }

  updateLeaving() {
    this.speed = Math.min(MAX_SPEED, this.speed + ACCELERATION);
    this.x += this.speed;
    this.animate();

    if (this.x - ANCHOR.x * SCALE > window.innerWidth) {
      this.reset();
      this.onLeave();
    }
  }

  animate() {
    this.frame_ticks += 1;
    if (this.frame_ticks < TICKS_PER_FRAME) return;

    this.frame_ticks = 0;
    this.frame = (this.frame + 1) % FRAMES;
  }

  draw() {
    if (!this.isPresent()) return;

    const drawer = Canvas.drawer();
    drawer.save();
    drawer.setTransform(1, 0, 0, 1, 0, 0);
    drawer.imageSmoothingEnabled = false;

    // Parada, congela no primeiro quadro (sem fumaca); andando, o quadro atual da animacao.
    const parked = this.state === 'stopped';
    drawer.save();
    drawer.translate(this.x + (FRAME - ANCHOR.x) * SCALE, STOP_Y - ANCHOR.y * SCALE);
    drawer.scale(-SCALE, SCALE);
    if (parked) drawer.drawImage(Images.get(PARKED_IMAGE), 0, 0, FRAME, FRAME);
    else drawer.drawImage(Images.get(DRIVING_IMAGE), this.frame * FRAME, 0, FRAME, FRAME, 0, 0, FRAME, FRAME);
    drawer.restore();

    if (parked) this.drawBalloon(drawer);
    drawer.restore();
  }

  // Balao de fala a direita da van, com a ponta apontando para o motorista. O tamanho e o da frase
  // inteira desde a primeira letra, para o balao nao crescer enquanto o texto aparece.
  drawBalloon(drawer) {
    if (!this.letters) return;

    const { font, padding, line, tail } = BALLOON;
    drawer.font = `${font}px "Pixelify Sans"`;
    const text_width = drawer.measureText?.(MESSAGE)?.width ?? MESSAGE.length * font * 0.55;
    const w = text_width + padding * 2;
    const h = font + padding * 2;
    const x = this.x + FRONT + tail + 10;   // logo depois da frente da van
    const y = STOP_Y - 190;                 // na altura da cabine
    const step = 4; // cantos "recortados", no estilo pixel

    const outline = () => {
      drawer.beginPath();
      drawer.moveTo(x + step, y);
      drawer.lineTo(x + w - step, y);
      drawer.lineTo(x + w, y + step);
      drawer.lineTo(x + w, y + h - step);
      drawer.lineTo(x + w - step, y + h);
      drawer.lineTo(x + step, y + h);
      drawer.lineTo(x, y + h - step);
      drawer.lineTo(x, y + h * 0.65);
      drawer.lineTo(x - tail, y + h * 0.8);   // ponta para o motorista
      drawer.lineTo(x, y + h * 0.4);
      drawer.lineTo(x, y + step);
      drawer.closePath();
    };

    outline();
    drawer.fillStyle = COLORS.balloon;
    drawer.fill();
    drawer.lineWidth = line;
    drawer.lineJoin = 'miter';
    drawer.strokeStyle = COLORS.outline;
    drawer.stroke();

    drawer.fillStyle = COLORS.text;
    drawer.textAlign = 'left';
    drawer.textBaseline = 'middle';
    drawer.fillText(this.message(), x + padding, y + h / 2 + 2);
  }
}

export const VENDOR_IMAGES = [DRIVING_IMAGE, PARKED_IMAGE];
export const VENDOR_MESSAGE = MESSAGE;
export const VENDOR_TICKS_PER_LETTER = TICKS_PER_LETTER;
export const VENDOR_STOP_Y = STOP_Y;

export default Vendor;
