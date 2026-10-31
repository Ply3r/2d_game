import StandardZombie from "../enemies/StandardZombie.js";
import RunningZombie from "../enemies/RunningZombie.js";
import { startingWave } from "./UrlOptions.js";

const TICKS_PER_SECOND = 60;
const FIRST_WAVE_DELAY = 2 * TICKS_PER_SECOND;
const INTERMISSION = 5 * TICKS_PER_SECOND;
const CHECKPOINT_EVERY = 5;   // depois das hordas 5, 10, 15... o jogo espera o jogador apertar espaco
const MAX_ALIVE = 30;

// Sistema de hordas. Cada horda tem uma quantidade fixa de inimigos que vai aparecendo aos
// poucos; a proxima so comeca depois de matar todos e de um intervalo para respirar. A cada
// CHECKPOINT_EVERY hordas o intervalo nao acaba sozinho: espera o jogador apertar espaco (start()).
// A quantidade, o ritmo de aparicao e a chance de zumbis rapidos crescem a cada horda.
class Waves {
  constructor() {
    this.reset();
  }

  // No intervalo, `wave` e a horda que acabou; a primeira a comecar e startingWave() (1, ou ?horda=N).
  reset() {
    this.wave = startingWave() - 1;
    this.state = 'intermission';
    this.timer = FIRST_WAVE_DELAY;
    this.waiting = false;   // intervalo que so acaba quando o jogador aperta espaco
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

  // Devolve 'cleared' no tick em que a ultima horda termina (todos os inimigos mortos).
  update(enemies) {
    if (this.state === 'intermission') return this.updateIntermission();

    const alive = enemies.getEnemies().filter((enemy) => enemy.isVisible() && enemy.life > 0).length;

    if (this.remaining === 0) {
      if (alive === 0) {
        this.startIntermission();
        return 'cleared';
      }
      return;
    }

    this.spawn_timer -= 1;
    if (this.spawn_timer > 0 || alive >= MAX_ALIVE) return;

    enemies.create(this.pickEnemy());
    this.remaining -= 1;
    this.spawn_timer = Waves.spawnInterval(this.wave);
  }

  // Chamado quando o jogador aperta espaco: se o intervalo esta esperando, a proxima horda comeca no proximo tick.
  start() {
    if (this.state !== 'intermission' || !this.waiting) return;

    this.waiting = false;
    this.timer = 0;
  }

  updateIntermission() {
    if (this.waiting) return;

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
    this.waiting = this.wave % CHECKPOINT_EVERY === 0;
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
      waiting: this.state === 'intermission' && this.waiting,   // esperando o jogador apertar espaco
      seconds_left: Math.ceil(this.timer / TICKS_PER_SECOND),
      enemies_left: this.remaining + alive,
    };
  }
}

export default Waves;
