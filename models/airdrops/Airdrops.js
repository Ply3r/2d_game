import Airdrop from "./Airdrop.js";
import Main from "../Main.js";
import Ammunition from "../drops/Ammunition.js";
import Heart from "../drops/Heart.js";
import Grenade from "../drops/Grenade.js";
import Knife from "../drops/Knife.js";
import GameEvents from "../config/GameEvents.js";
import GrenadeWeapon from "../weapons/throable/Grenade.js";
import KnifeWeapon from "../weapons/melee/Knife.js";

const MAX_CRATES = 3;
const MIN_DISTANCE_FROM_PLAYER = 220;
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
    const width = window.innerWidth - MARGIN.left - MARGIN.right - 64;
    const height = window.innerHeight - MARGIN.top - MARGIN.bottom - 64;
    let landing;

    for (let attempt = 0; attempt < 20; attempt += 1) {
      landing = { x: MARGIN.left + Math.random() * width, y: MARGIN.top + Math.random() * height };
      if (Math.hypot(landing.x + 32 - player.x, landing.y + 32 - player.y) >= MIN_DISTANCE_FROM_PLAYER) break;
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
      bodies.forEach((body) => Airdrops.pushOut(body, crate));
    });
  }

  static pushOut(body, crate) {
    const a = body.hitbox();
    const b = crate.hitbox();
    if (!GameEvents.rectsOverlap(a, b)) return;

    const overlap_x = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const overlap_y = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);

    if (overlap_x < overlap_y) {
      body.position.x += (a.x + a.w / 2 <= b.x + b.w / 2) ? -overlap_x : overlap_x;
    } else {
      body.position.y += (a.y + a.h / 2 <= b.y + b.h / 2) ? -overlap_y : overlap_y;
    }
  }

  // Caixas pousadas, para as balas.
  getSolidCrates() {
    return this.crates.filter((crate) => crate.isSolid() && crate.isVisible());
  }

  openCrate(crate) {
    const center = crate.center();
    const Loot = this.pickLoot();
    const drop = new Loot({ x: 0, y: 0 });
    drop.position = { x: center.x - drop.size.x / 2, y: center.y - drop.size.y / 2 };

    Main.instance().getItemUpdaterInstance().create(drop);
  }

  // Municao e vida mais comuns; faca e granada so saem se o jogador ainda nao tem.
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
