// Ambiente minimo de navegador para rodar os modulos do jogo no Node.
// Importe este arquivo antes de qualquer modulo de models/.
export const calls = [];
export const state = { recording: false };
export const docListeners = {};
export const winListeners = {};

const ctx = new Proxy({}, {
  get: (target, key) => {
    if (key in target) return target[key];
    return (...args) => { if (state.recording) calls.push([key, ...args]); };
  },
  set: (target, key, value) => (target[key] = value, true),
});

globalThis.window = {
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener: (type, fn) => { winListeners[type] = fn; },
};
globalThis.Image = class {};
globalThis.document = {
  getElementById: () => ({ width: 0, height: 0, getContext: () => ctx }),
  addEventListener: (type, fn) => (docListeners[type] ??= []).push(fn),
  body: { style: {} },
  fonts: { load: () => Promise.resolve() },
};

export const fire = (type, key) => docListeners[type].forEach((fn) => fn({ key }));

// Grava as chamadas feitas ao canvas durante fn() e as devolve.
export const record = (fn) => {
  calls.length = 0;
  state.recording = true;
  try { fn(); } finally { state.recording = false; }
  return [...calls];
};

// Timers do jogo (ex.: partículas vivem 10 s) não devem segurar o processo de teste.
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (...args) => {
  const timer = realSetTimeout(...args);
  timer.unref?.();
  return timer;
};
