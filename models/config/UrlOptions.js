import { POWERUPS } from "./Powerups.js";

// Opcoes de teste pela URL, para nao precisar jogar ate la para ver algo:
//   index.html?horda=10                      comeca na horda 10
//   index.html?powerups=shield:3,damage:2    comeca com esses powerups
// Sem parametros, o jogo comeca normal.
const param = (name) => new URLSearchParams(globalThis.location?.search ?? '').get(name);

// Horda inicial (1 sem o parametro ou com valor invalido).
export function startingWave() {
  const wave = Math.floor(Number(param('horda')));
  return Number.isFinite(wave) && wave >= 1 ? wave : 1;
}

// Niveis iniciais dos powerups; tipos desconhecidos e niveis invalidos sao ignorados.
export function startingPowerups() {
  const value = param('powerups');
  if (!value) return {};

  return Object.fromEntries(value.split(',').map((pair) => pair.split(':'))
    .filter(([type, level]) => POWERUPS[type] && Number(level) > 0)
    .map(([type, level]) => [type, Math.min(Math.floor(Number(level)), POWERUPS[type].max)]));
}
