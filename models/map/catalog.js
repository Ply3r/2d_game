// Objetos que podem ser colocados no mapa. Posicao e tamanho em pixels da tela do jogo;
// hitbox (so dos solidos) e relativa ao canto superior esquerdo do sprite.
//   solid: bloqueia jogador, zumbis e balas.
//   decor: so enfeite, nao colide.
export const CATALOG = {
  rock_large: { label: 'Pedra grande', category: 'solid', image: './assets/scenery/rock_large.png', size: { x: 96, y: 72 }, hitbox: { x: 4, y: 14, w: 88, h: 54 } },
  cactus: { label: 'Cacto', category: 'solid', image: './assets/scenery/cactus.png', size: { x: 48, y: 96 }, hitbox: { x: 12, y: 44, w: 24, h: 48 } },
  crate_wood: { label: 'Caixa de madeira', category: 'solid', image: './assets/scenery/crate_wood.png', size: { x: 64, y: 64 }, hitbox: { x: 0, y: 0, w: 64, h: 64 } },
  barrel: { label: 'Barril', category: 'solid', image: './assets/scenery/barrel.png', size: { x: 48, y: 64 }, hitbox: { x: 2, y: 8, w: 44, h: 54 } },
  sandbags: { label: 'Sacos de areia', category: 'solid', image: './assets/scenery/sandbags.png', size: { x: 112, y: 48 }, hitbox: { x: 2, y: 6, w: 108, h: 40 } },
  bush: { label: 'Arbusto', category: 'decor', image: './assets/scenery/bush.png', size: { x: 64, y: 48 } },
  grass: { label: 'Mato', category: 'decor', image: './assets/scenery/grass.png', size: { x: 40, y: 32 } },
  pebbles: { label: 'Pedrinhas', category: 'decor', image: './assets/scenery/pebbles.png', size: { x: 48, y: 24 } },
  bones: { label: 'Ossos', category: 'decor', image: './assets/scenery/bones.png', size: { x: 48, y: 32 } },
};

export const CATEGORIES = { solid: 'Sólidos', decor: 'Decoração' };
