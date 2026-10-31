import Canvas from "../config/Canvas.js";
import Images from "../config/Images.js";
import { VENDOR_MESSAGE, VENDOR_TICKS_PER_LETTER } from "./Vendor.js";

const CLOSEUP_IMAGE = './assets/vendor/closeup.png';   // 256x256: a van de perto, com o vendedor na janela
const IMAGE_SIZE = 256;
const CONTENT = { left: 4, top: 59, bottom: 252 };   // onde a van esta na imagem (o resto e transparente)
const HEAD = { x: 196, y: 80 };             // topo da cabeca do vendedor, na imagem
const BALLOON = { font: 40, padding: 22, line: 4, tail: 26, gap: 8 };
const COLORS = { shade: '#1b1720', balloon: '#f1ece3', outline: '#1b1720', text: '#1b1720', hint: 'rgb(255, 255, 255)' };

// Tela do vendedor de perto: abre ao clicar na van parada e fecha no Esc. A imagem preenche a tela
// (escala inteira, para a pixel art ficar nitida): o teto da van no topo, a frente (cortada na imagem)
// na borda direita; o que sobra embaixo (as rodas) fica fora. O vendedor repete a fala letra por letra.
class Shop {
  constructor() {
    this.opened = false;
    this.letters = 0;
    this.letter_ticks = 0;
  }

  open() {
    this.opened = true;
    this.letters = 0;
    this.letter_ticks = 0;
  }

  close() {
    this.opened = false;
  }

  isOpen() {
    return this.opened;
  }

  message() {
    return VENDOR_MESSAGE.slice(0, this.letters);
  }

  // Um tick: a proxima letra da fala.
  update() {
    if (!this.opened || this.letters >= VENDOR_MESSAGE.length) return;

    this.letter_ticks += 1;
    if (this.letter_ticks < VENDOR_TICKS_PER_LETTER) return;

    this.letter_ticks = 0;
    this.letters += 1;
  }

  // Escala e posicao da imagem: a menor escala inteira em que a van cobre a tela toda.
  layout() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = Math.max(2, Math.ceil(width / (IMAGE_SIZE - CONTENT.left)), Math.ceil(height / (CONTENT.bottom - CONTENT.top)));
    const size = IMAGE_SIZE * scale;

    return { scale, x: width - size, y: -CONTENT.top * scale, size };
  }

  draw() {
    if (!this.opened) return;

    const drawer = Canvas.drawer();
    const { scale, x, y, size } = this.layout();

    drawer.save();
    drawer.setTransform(1, 0, 0, 1, 0, 0);
    drawer.fillStyle = COLORS.shade;
    drawer.fillRect(0, 0, window.innerWidth, window.innerHeight);
    drawer.imageSmoothingEnabled = false;
    drawer.drawImage(Images.get(CLOSEUP_IMAGE), x, y, size, size);

    this.drawBalloon(drawer, { x: x + HEAD.x * scale, y: y + HEAD.y * scale });

    drawer.font = `24px "Pixelify Sans"`;
    drawer.textAlign = 'left';
    drawer.textBaseline = 'alphabetic';
    drawer.lineWidth = 5;
    drawer.lineJoin = 'round';
    drawer.strokeStyle = COLORS.outline;
    drawer.strokeText('ESC para sair', 24, window.innerHeight - 24);
    drawer.fillStyle = COLORS.hint;
    drawer.fillText('ESC para sair', 24, window.innerHeight - 24);
    drawer.restore();
  }

  // Balao acima da cabeca do vendedor, com a ponta para baixo, apontando para ele. Tem o tamanho
  // da frase inteira desde a primeira letra, para nao crescer enquanto o texto aparece.
  drawBalloon(drawer, head) {
    if (!this.letters) return;

    const { font, padding, line, tail, gap } = BALLOON;
    drawer.font = `${font}px "Pixelify Sans"`;
    const text_width = drawer.measureText?.(VENDOR_MESSAGE)?.width ?? VENDOR_MESSAGE.length * font * 0.55;
    const w = text_width + padding * 2;
    const h = font + padding * 2;
    const x = Math.max(16, Math.min(head.x - w / 2, window.innerWidth - 16 - w));
    const y = Math.max(16, head.y - gap - tail - h);
    const tip_x = Math.min(Math.max(head.x, x + 30), x + w - 30);
    const step = 6; // cantos "recortados", no estilo pixel

    drawer.beginPath();
    drawer.moveTo(x + step, y);
    drawer.lineTo(x + w - step, y);
    drawer.lineTo(x + w, y + step);
    drawer.lineTo(x + w, y + h - step);
    drawer.lineTo(x + w - step, y + h);
    drawer.lineTo(tip_x + 14, y + h);
    drawer.lineTo(tip_x, y + h + tail);   // ponta para a cabeca do vendedor
    drawer.lineTo(tip_x - 14, y + h);
    drawer.lineTo(x + step, y + h);
    drawer.lineTo(x, y + h - step);
    drawer.lineTo(x, y + step);
    drawer.closePath();
    drawer.fillStyle = COLORS.balloon;
    drawer.fill();
    drawer.lineWidth = line;
    drawer.lineJoin = 'miter';
    drawer.strokeStyle = COLORS.outline;
    drawer.stroke();

    drawer.fillStyle = COLORS.text;
    drawer.textAlign = 'left';
    drawer.textBaseline = 'middle';
    drawer.fillText(this.message(), x + padding, y + h / 2 + 3);
  }
}

export const SHOP_IMAGE = CLOSEUP_IMAGE;

export default Shop;
