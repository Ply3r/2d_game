// Objetos que podem ser colocados no mapa.
//   size: tamanho do sprite em pixels quando a celula da grade tem REFERENCE_CELL px (tela 1280x720).
//   cells: base do objeto na grade (largura x altura em celulas). Nos solidos e a area que bloqueia;
//          o sprite fica apoiado no fundo da base e pode passar dela para cima (profundidade).
//   solid: bloqueia jogador, zumbis e balas.
//   decor: so enfeite, nao colide.
export const CATALOG = {
  rock_large: { label: 'Pedra grande', category: 'solid', image: './assets/scenery/rock_large.png', size: { x: 96, y: 72 }, cells: { w: 2, h: 1 } },
  cactus: { label: 'Cacto', category: 'solid', image: './assets/scenery/cactus.png', size: { x: 48, y: 96 }, cells: { w: 1, h: 1 } },
  crate_wood: { label: 'Caixa de madeira', category: 'solid', image: './assets/scenery/crate_wood.png', size: { x: 64, y: 64 }, cells: { w: 2, h: 1 } },
  barrel: { label: 'Barril', category: 'solid', image: './assets/scenery/barrel.png', size: { x: 48, y: 64 }, cells: { w: 1, h: 1 } },
  sandbags: { label: 'Sacos de areia', category: 'solid', image: './assets/scenery/sandbags.png', size: { x: 112, y: 48 }, cells: { w: 3, h: 1 } },
  bush: { label: 'Arbusto', category: 'decor', image: './assets/scenery/bush.png', size: { x: 64, y: 48 }, cells: { w: 1, h: 1 } },
  grass: { label: 'Mato', category: 'decor', image: './assets/scenery/grass.png', size: { x: 40, y: 32 }, cells: { w: 1, h: 1 } },
  pebbles: { label: 'Pedrinhas', category: 'decor', image: './assets/scenery/pebbles.png', size: { x: 48, y: 24 }, cells: { w: 1, h: 1 } },
  bones: { label: 'Ossos', category: 'decor', image: './assets/scenery/bones.png', size: { x: 48, y: 32 }, cells: { w: 1, h: 1 } },
};

export const CATEGORIES = { solid: 'Sólidos', decor: 'Decoração' };
