import Canvas from "./Canvas.js";
import Images from "./Images.js";
import Clock from "./Clock.js";
import GameEvents from "./GameEvents.js";
import Main from "../Main.js";
import { SHIELD_IMAGE } from "./Powerups.js";

const ORBIT_RADIUS = 85;      // distancia do centro do jogador
const SIZE = 32;              // o sprite tem 16x16 pixels de arte, desenhado a 2x
const SPIN = 0.06;            // rad por tick
const HIT_COOLDOWN = 500;     // ms entre dois danos do mesmo escudo no mesmo alvo

// Escudos que orbitam o jogador (um por nivel do powerup) e machucam quem encostam.
// O dano e o da arma de fogo do jogador, ja com o bonus de dano.
class Shields {
  constructor(player) {
    this.player = player;
    this.reset();
  }

  reset() {
    this.angle = 0;
    this.last_hit = new WeakMap();   // alvo -> [instante do ultimo dano de cada escudo]
  }

  count() {
    return this.player.powerups.shield;
  }

  // Centro de cada escudo, igualmente espacados na orbita.
  positions() {
    const center = this.player.center();
    const count = this.count();

    return Array.from({ length: count }, (_, i) => {
      const angle = this.angle + (i * Math.PI * 2) / count;
      return { x: center.x + Math.cos(angle) * ORBIT_RADIUS, y: center.y + Math.sin(angle) * ORBIT_RADIUS };
    });
  }

  hitboxes() {
    return this.positions().map(({ x, y }) => ({ x: x - SIZE / 2, y: y - SIZE / 2, w: SIZE, h: SIZE }));
  }

  update() {
    if (!this.count()) return;

    this.angle = (this.angle + SPIN) % (Math.PI * 2);

    const main = Main.instance();
    const targets = [
      ...main.getEnemiesInstance().getEnemies().filter((enemy) => enemy.isVisible() && enemy.life > 0),
      ...main.getAirdropsInstance().getHittableCrates(),
    ];
    const damage = this.player.gunDamage();
    const now = Clock.now();

    this.hitboxes().forEach((box, index) => {
      targets.filter((target) => GameEvents.rectsOverlap(box, target.hitbox())).forEach((target) => {
        const hits = this.last_hit.get(target) || [];
        if (hits[index] !== undefined && now - hits[index] < HIT_COOLDOWN) return;

        hits[index] = now;
        this.last_hit.set(target, hits);
        target.getHit(damage);
      });
    });
  }

  draw() {
    if (!this.count()) return;

    const drawer = Canvas.drawer();
    drawer.save();
    drawer.setTransform(1, 0, 0, 1, 0, 0);

    drawer.imageSmoothingEnabled = false;
    const image = Images.get(SHIELD_IMAGE);

    this.positions().forEach(({ x, y }) => {
      // brilho azul por tras do escudo
      drawer.fillStyle = 'rgba(90, 169, 255, 0.25)';
      drawer.beginPath();
      drawer.arc(x, y, SIZE / 2 + 6, 0, Math.PI * 2);
      drawer.fill();
      drawer.drawImage(image, x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);
    });

    drawer.restore();
  }
}

export default Shields;
