// Relogio do jogo: para durante o pause. Toda logica que depende de tempo (recarga, invencibilidade,
// granada, itens que somem) usa Clock.now() e Clock.after() em vez de Date.now() e setTimeout,
// para que nada avance enquanto o jogo esta pausado.
let paused_at = null;    // Date.now() de quando pausou, ou null
let paused_total = 0;    // tempo total ja passado em pause
const timers = new Set();

function schedule(timer) {
  timer.id = setTimeout(() => {
    timers.delete(timer);
    timer.fn();
  }, Math.max(0, timer.due - Clock.now()));
}

class Clock {
  // Milissegundos de jogo (como Date.now(), mas sem contar o tempo em pause).
  static now() {
    return (paused_at ?? Date.now()) - paused_total;
  }

  // setTimeout que congela durante o pause.
  static after(ms, fn) {
    const timer = { due: Clock.now() + ms, fn, id: null };
    timers.add(timer);
    if (paused_at === null) schedule(timer);

    return timer;
  }

  static isPaused() {
    return paused_at !== null;
  }

  static pause() {
    if (paused_at !== null) return;

    paused_at = Date.now();
    timers.forEach((timer) => clearTimeout(timer.id));
  }

  static resume() {
    if (paused_at === null) return;

    paused_total += Date.now() - paused_at;
    paused_at = null;
    timers.forEach(schedule);
  }
}

export default Clock;
