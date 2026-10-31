import Images from "./Images.js";

export const SHIELD_IMAGE = './assets/powerups/shield.png';

// Powerups que caem das caixas de suprimentos. Duram a partida inteira e acumulam:
// sem limite, menos o escudo (ate `max`).
export const POWERUPS = {
  multishot: { label: 'TIRO MÚLTIPLO', color: '#f2c14e', max: Infinity },
  fire_rate: { label: 'CADÊNCIA', color: '#4ade80', max: Infinity },
  damage: { label: 'DANO', color: '#e8453c', max: Infinity },
  shield: { label: 'ESCUDO', color: '#5aa9ff', max: 3 },
};

const MULTISHOT_SPREAD = 0.18;           // angulo (rad) entre tiros vizinhos do tiro multiplo...
const MULTISHOT_MAX_FAN = 1.05;          // ...ate o leque inteiro chegar a ~60 graus; depois as balas se juntam
const FIRE_RATE_STEP = 0.75;             // cada nivel multiplica o intervalo entre tiros por isto
const MIN_FIRE_INTERVAL = 40;            // ms: limite da cadencia
const DAMAGE_STEP = 0.5;                 // cada nivel soma 50% do dano base
const MAX_BULLET_SIZE = 30;
export const SEMI_AUTO_INTERVAL = 350;   // armas de clique viram automaticas com cadencia, neste ritmo base

export const emptyPowerups = () => Object.fromEntries(Object.keys(POWERUPS).map((type) => [type, 0]));

// Angulos (rad, relativos a mira) das balas de um disparo: 1 bala, e +2 por nivel de tiro multiplo.
export function multishotAngles(level) {
  const count = 1 + 2 * level;
  if (count === 1) return [0];

  const step = Math.min(MULTISHOT_SPREAD, MULTISHOT_MAX_FAN / (count - 1));
  return Array.from({ length: count }, (_, i) => (i - (count - 1) / 2) * step);
}

// Intervalo entre tiros com a cadencia aplicada.
export const fireInterval = (base, level) => Math.max(MIN_FIRE_INTERVAL, base * FIRE_RATE_STEP ** level);
export const damageMultiplier = (level) => 1 + DAMAGE_STEP * level;

// A bala cresce (ate MAX_BULLET_SIZE) e vai de branco para vermelho conforme o nivel de dano;
// cada nivel deixa mais vermelha, chegando perto de rgb(255, 30, 30).
export function bulletLook(level) {
  const fade = Math.round(225 * (1 - 0.5 ** level));
  return { size: Math.min(10 + 4 * level, MAX_BULLET_SIZE), color: `rgb(255, ${255 - fade}, ${255 - fade})` };
}

// Texto do nivel: "2/3" para quem tem limite, "x2" para quem nao tem.
export const levelText = (type, level) => (Number.isFinite(POWERUPS[type].max) ? `${level}/${POWERUPS[type].max}` : `x${level}`);

// Icone do powerup (usado no item do chao e no HUD), desenhado sem sprite em um quadrado de `size`.
export function drawPowerupIcon(drawer, type, x, y, size) {
  const { color } = POWERUPS[type];
  const s = size / 48;
  const cx = x + size / 2;
  const cy = y + size / 2;

  drawer.save();
  drawer.fillStyle = 'rgba(29, 28, 27, 0.9)';
  drawer.fillRect(x, y, size, size);
  drawer.strokeStyle = color;
  drawer.lineWidth = 3 * s;
  drawer.strokeRect(x + 1.5 * s, y + 1.5 * s, size - 3 * s, size - 3 * s);
  drawer.fillStyle = color;
  drawer.strokeStyle = color;

  if (type === 'multishot') {
    // tres balas em leque saindo de baixo
    [-0.45, 0, 0.45].forEach((angle) => {
      drawer.save();
      drawer.translate(cx, y + size - 10 * s);
      drawer.rotate(angle);
      drawer.fillRect(-3 * s, -28 * s, 6 * s, 9 * s);
      drawer.fillRect(-1 * s, -16 * s, 2 * s, 8 * s);
      drawer.restore();
    });
  } else if (type === 'fire_rate') {
    // >> (duas setas)
    drawer.lineWidth = 5 * s;
    drawer.lineJoin = 'miter';
    [-7, 7].forEach((dx) => {
      drawer.beginPath();
      drawer.moveTo(cx + (dx - 6) * s, cy - 11 * s);
      drawer.lineTo(cx + (dx + 5) * s, cy);
      drawer.lineTo(cx + (dx - 6) * s, cy + 11 * s);
      drawer.stroke();
    });
  } else if (type === 'damage') {
    // bala grande vermelha com brilho
    drawer.fillRect(cx - 9 * s, cy - 9 * s, 18 * s, 18 * s);
    drawer.fillStyle = '#ffd0d0';
    drawer.fillRect(cx - 5 * s, cy - 5 * s, 6 * s, 6 * s);
  } else if (type === 'shield') {
    // a mesma pixel art dos escudos que orbitam (16x16 de arte, em multiplo inteiro para nao borrar)
    const art = Math.max(16, Math.round((size - 12 * s) / 16) * 16);
    drawer.imageSmoothingEnabled = false;
    drawer.drawImage(Images.get(SHIELD_IMAGE), cx - art / 2, cy - art / 2, art, art);
  }

  drawer.restore();
}
