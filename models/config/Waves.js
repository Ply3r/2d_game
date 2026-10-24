import StandardZombie from "../enemies/StandardZombie.js";
import RunningZombie from "../enemies/RunningZombie.js";

const TICKS_PER_SECOND = 60;
const FIRST_WAVE_DELAY = 2 * TICKS_PER_SECOND;
const INTERMISSION = 5 * TICKS_PER_SECOND;
const MAX_ALIVE = 30;

// Sistema de hordas. Cada horda tem uma quantidade fixa de inimigos que vai aparecendo aos
// poucos; a proxima so comeca depois de matar todos e de um intervalo para respirar.
// A quantidade, o ritmo de aparicao e a chance de zumbis rapidos crescem a cada horda.
class Waves {
  constructor() {
    this.reset();
  }

  reset() {
    this.wave = 0;
    this.state = 'intermission';
    this.timer = FIRST_WAVE_DELAY;
    this.remaining = 0;
    this.spawn_timer = 0;
  }

  // 4, 7, 10, 13, ...
  static enemiesInWave(wave) {
    return 4 + 3 * (wave - 1);
  }

  // Ticks entre um inimigo e outro: 50 na horda 1, mais rapido a cada horda, minimo de 12.
  static spawnInterval(wave) {
    return Math.max(12, 50 - 4 * (wave - 1));
  }

  // Chance de o inimigo ser um zumbi rapido: 0% na horda 1, +8% por horda, maximo de 50%.
  static runnerChance(wave) {
    return Math.min(0.5, 0.08 * (wave - 1));
  }

  update(enemies) {
    if (this.state === 'intermission') return this.updateIntermission();

    const alive = enemies.getEnemies().filter((enemy) => enemy.isVisible() && enemy.life > 0).length;

    if (this.remaining === 0) {
      if (alive === 0) this.startIntermission();
      return;
    }

    this.spawn_timer -= 1;
    if (this.spawn_timer > 0 || alive >= MAX_ALIVE) return;

    enemies.create(this.pickEnemy());
    this.remaining -= 1;
    this.spawn_timer = Waves.spawnInterval(this.wave);
  }

  updateIntermission() {
    this.timer -= 1;
    if (this.timer > 0) return;

    this.wave += 1;
    this.state = 'active';
    this.remaining = Waves.enemiesInWave(this.wave);
    this.spawn_timer = 0;
  }

  startIntermission() {
    this.state = 'intermission';
    this.timer = INTERMISSION;
  }

  pickEnemy() {
    return Math.random() < Waves.runnerChance(this.wave) ? RunningZombie : StandardZombie;
  }

  // Dados para o HUD.
  attributes(enemies) {
    const alive = enemies.getEnemies().filter((enemy) => enemy.isVisible() && enemy.life > 0).length;

    return {
      wave: this.wave,
      next_wave: this.wave + 1,
      intermission: this.state === 'intermission',
      seconds_left: Math.ceil(this.timer / TICKS_PER_SECOND),
      enemies_left: this.remaining + alive,
    };
  }
}

export default Waves;
