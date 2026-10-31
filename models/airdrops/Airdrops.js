import Airdrop from "./Airdrop.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";
import Grenade from "../drops/Grenade.js";
import Knife from "../drops/Knife.js";
import GameEvents from "../config/GameEvents.js";
import GrenadeWeapon from "../weapons/throable/Grenade.js";
import KnifeWeapon from "../weapons/melee/Knife.js";
import { MultishotDrop, FireRateDrop, DamageDrop, ShieldDrop } from "../drops/Powerup.js";
import { POWERUPS } from "../config/Powerups.js";
import Vendor from "../vendor/Vendor.js";

const POWERUP_WEIGHT = 15;

const MAX_CRATES = 3;
const MIN_DISTANCE_FROM_PLAYER = 220;
const CLEARANCE = 16;                    // folga em volta da caixa para nao pousar colada num objeto
const MARGIN = { left: 60, right: 60, top: 140, bottom: 260 };   // deixa livre o HUD

// Gerencia as caixas de suprimentos: sorteia onde caem, resolve a colisao delas com jogador
// e inimigos e solta o item quando quebram.
class Airdrops {
  constructor() {
    this.crates = [];
  }

  reset() {
    this.crates = [];
  }

  // Solta uma caixa num ponto aleatorio longe do jogador.
  spawn() {
    if (this.crates.length >= MAX_CRATES) return null;

    const crate = new Airdrop({ landing: this.randomLanding() });
    this.crates.push(crate);

    return crate;
  }

  randomLanding() {
    const player = Main.instance().getPlayerInstance().center();
    // Com o vendedor chegando, a caixa nao cai onde a van vai estacionar.
    const parked = Main.instance().getVendorInstance().isPresent() ? Vendor.parkedHitbox() : null;
    const width = window.innerWidth - MARGIN.left - MARGIN.right - 64;
    const height = window.innerHeight - MARGIN.top - MARGIN.bottom - 64;
    let landing;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      landing = { x: MARGIN.left + Math.random() * width, y: MARGIN.top + Math.random() * height };
      const far_from_player = Math.hypot(landing.x + 32 - player.x, landing.y + 32 - player.y) >= MIN_DISTANCE_FROM_PLAYER;
      const area = { x: landing.x - CLEARANCE, y: landing.y - CLEARANCE, w: 64 + 2 * CLEARANCE, h: 64 + 2 * CLEARANCE };
      const under_vendor = parked && GameEvents.rectsOverlap(area, parked);
      if (far_from_player && !under_vendor && !Main.instance().getMapInstance().blocks(area)) break;
    }

    return landing;
  }

  update() {
    this.crates.forEach((crate) => crate.update());

    this.crates.filter((crate) => !crate.isVisible()).forEach((crate) => this.openCrate(crate));
    this.crates = this.crates.filter((crate) => crate.isVisible());
  }

  // Empurra jogador e inimigos para fora das caixas (pelo eixo de menor sobreposicao).
  resolveCollisions() {
    const main = Main.instance();
    const bodies = [main.getPlayerInstance(), ...main.getEnemiesInstance().getEnemies().filter((enemy) => enemy.isVisible())];

    this.crates.filter((crate) => crate.isSolid()).forEach((crate) => {
      bodies.forEach((body) => GameEvents.pushOut(body, crate.hitbox()));
    });
  }

  // Caixas que podem ser atingidas: todas que ainda nao quebraram, no chao ou caindo.
  getHittableCrates() {
    return this.crates.filter((crate) => crate.isVisible());
  }

  // Dano em area (golpe de faca, explosao de granada) nas caixas que tocam `area`.
  hitArea(area, strength) {
    this.getHittableCrates()
      .filter((crate) => GameEvents.rectsOverlap(crate.hitbox(), area))
      .forEach((crate) => crate.getHit(strength));
  }

  // O item cai onde a caixa pousaria, mesmo se ela for destruida ainda no ar.
  openCrate(crate) {
    const center = { x: crate.landing.x + crate.size.x / 2, y: crate.landing.y + crate.size.y / 2 };
    const Loot = this.pickLoot();
    const drop = new Loot({ x: 0, y: 0 });
    drop.position = { x: center.x - drop.size.x / 2, y: center.y - drop.size.y / 2 };

    Main.instance().getItemUpdaterInstance().create(drop);
  }

  // Municao e vida mais comuns; faca e granada so saem se o jogador ainda nao tem;
  // powerups so saem enquanto nao chegaram no maximo.
  pickLoot() {
    const player = Main.instance().getPlayerInstance();
    const owned = Object.values(player.inventory).filter(Boolean);
    const has = (WeaponClass) => owned.some((weapon) => weapon instanceof WeaponClass);
    const hurt = player.life < player.MAX_LIFE;

    const options = [
      { Loot: Ammunition, weight: 40 },
      { Loot: Heart, weight: hurt ? 30 : 8 },
      { Loot: Grenade, weight: has(GrenadeWeapon) ? 0 : 20 },
      { Loot: Knife, weight: has(KnifeWeapon) ? 0 : 20 },
      ...[
        ['multishot', MultishotDrop], ['fire_rate', FireRateDrop], ['damage', DamageDrop], ['shield', ShieldDrop],
      ].map(([type, Loot]) => ({ Loot, weight: player.powerups[type] < POWERUPS[type].max ? POWERUP_WEIGHT : 0 })),
    ];

    let roll = Math.random() * options.reduce((sum, option) => sum + option.weight, 0);
    for (const option of options) {
      roll -= option.weight;
      if (roll < 0) return option.Loot;
    }

    return Ammunition;
  }

  draw() {
    this.crates.forEach((crate) => crate.draw());
  }

  drawAir() {
    this.crates.forEach((crate) => crate.drawAir());
  }
}

export default Airdrops;
