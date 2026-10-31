const MARGIN = 6; // celulas extras de cada lado da tela: os zumbis nascem fora dela
const LOOKAHEAD = 8; // quantas celulas a frente tenta alcancar em linha reta (suaviza o caminho)
const NEAREST_DEPTH = 8; // ate quantas celulas procura um no livre perto de um ponto bloqueado
const EPSILON = 0.01;
const EXIT_PENALTY = 60; // custo extra (em celulas) para um zumbi sair da tela: so quando nao ha caminho por dentro
const STEPS = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

// O segmento a->b atravessa o interior de rect? (Liang-Barsky; encostar na borda nao conta)
function segmentHitsRect(a, b, rect) {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const edges = [
    [-dx, a.x - rect.x], [dx, rect.x + rect.w - a.x],
    [-dy, a.y - rect.y], [dy, rect.y + rect.h - a.y],
  ];

  for (const [p, q] of edges) {
    if (p === 0) {
      if (q <= 0) return false;
      continue;
    }

    const t = q / p;
    if (p < 0) t0 = Math.max(t0, t);
    else t1 = Math.min(t1, t);
    if (t0 >= t1) return false;
  }

  return true;
}

// Acha o caminho dos zumbis ate o jogador usando a mesma grade do mapa.
// Cada no da navegacao e o centro de uma celula (a grade do mapa mais MARGIN celulas em volta).
// Um no e livre para um corpo de raio r se o quadrado de lado 2r centrado nele nao encosta em celula bloqueada,
// assim o centro do zumbi pode ser tratado como um ponto. A faixa fora da tela serve para entrar nela;
// um zumbi que ja esta na tela so sai dela para contornar um solido se nao houver outro caminho.
// Uma unica busca (Dijkstra a partir do jogador)
// serve a todos os zumbis do mesmo tamanho; ela so e refeita quando o jogador muda de celula.
class Pathfinder {
  constructor() {
    this.grid = null;
    this.layers = new Map(); // raio -> { cols, rows, walkable, open, inside, walls, field }
  }

  // Proximo ponto para onde o centro `from` deve andar para chegar em `target`.
  // grid = { cols, rows, cell_w, cell_h, blocked } (ver GameMap.grid()).
  waypoint(from, target, radius, grid) {
    const layer = this.layer(grid, radius);
    if (!layer.walls.some((rect) => segmentHitsRect(from, target, rect))) return target;

    const dist = this.field(grid, layer, target);
    const start = this.nodeOf(grid, layer, from);
    if (!dist || start === null) return target;

    return this.follow(grid, layer, dist, from, start) || target;
  }

  layer(grid, radius) {
    if (this.grid !== grid) {
      this.grid = grid;
      this.layers.clear();
    }

    if (!this.layers.has(radius)) this.layers.set(radius, this.buildLayer(grid, radius));
    return this.layers.get(radius);
  }

  buildLayer(grid, radius) {
    const cols = grid.cols + MARGIN * 2;
    const rows = grid.rows + MARGIN * 2;
    const size = cols * rows;
    const layer = { cols, rows, walkable: new Uint8Array(size), open: new Uint8Array(size), inside: new Uint8Array(size), walls: this.walls(grid, radius), field: null };

    for (let node = 0; node < size; node += 1) {
      const col = (node % cols) - MARGIN;
      const row = Math.floor(node / cols) - MARGIN;
      const { x, y } = this.center(grid, layer, node);
      layer.inside[node] = col >= 0 && row >= 0 && col < grid.cols && row < grid.rows ? 1 : 0;
      layer.walkable[node] = this.fits(grid, x, y, radius) ? 1 : 0;
      layer.open[node] = this.fits(grid, x, y, EPSILON * 2) ? 1 : 0;
    }

    return layer;
  }

  // O quadrado de lado 2r centrado em (x, y) fica longe de todas as celulas bloqueadas?
  fits(grid, x, y, radius) {
    const r = radius - EPSILON;
    const first_col = Math.max(0, Math.floor((x - r) / grid.cell_w));
    const last_col = Math.min(grid.cols - 1, Math.ceil((x + r) / grid.cell_w) - 1);
    const first_row = Math.max(0, Math.floor((y - r) / grid.cell_h));
    const last_row = Math.min(grid.rows - 1, Math.ceil((y + r) / grid.cell_h) - 1);

    for (let row = first_row; row <= last_row; row += 1) {
      for (let col = first_col; col <= last_col; col += 1) if (grid.blocked[row * grid.cols + col]) return false;
    }

    return true;
  }

  // Celulas bloqueadas juntadas em faixas horizontais e "infladas" pelo raio, para testar linha livre.
  walls(grid, radius) {
    const rects = [];
    const pad = Math.max(0, radius - 0.5);

    for (let row = 0; row < grid.rows; row += 1) {
      let col = 0;
      while (col < grid.cols) {
        if (!grid.blocked[row * grid.cols + col]) { col += 1; continue; }

        const first = col;
        while (col < grid.cols && grid.blocked[row * grid.cols + col]) col += 1;
        rects.push({
          x: first * grid.cell_w - pad,
          y: row * grid.cell_h - pad,
          w: (col - first) * grid.cell_w + pad * 2,
          h: grid.cell_h + pad * 2,
        });
      }
    }

    return rects;
  }

  nodeOf(grid, layer, point) {
    const col = Math.floor(point.x / grid.cell_w) + MARGIN;
    const row = Math.floor(point.y / grid.cell_h) + MARGIN;
    if (!Number.isFinite(col) || !Number.isFinite(row) || col < 0 || row < 0 || col >= layer.cols || row >= layer.rows) return null;

    return row * layer.cols + col;
  }

  center(grid, layer, node) {
    return {
      x: ((node % layer.cols) - MARGIN + 0.5) * grid.cell_w,
      y: (Math.floor(node / layer.cols) - MARGIN + 0.5) * grid.cell_h,
    };
  }

  // Campo de distancias ate o jogador, refeito so quando o mapa, a janela ou a celula do jogador mudam.
  field(grid, layer, target) {
    const target_node = this.nodeOf(grid, layer, target);
    if (target_node === null) return null;
    if (layer.field && layer.field.target_node === target_node) return layer.field.dist;

    // Jogador encostado num solido: o no dele nao cabe um zumbi, entao a busca parte dos nos livres mais proximos.
    const seeds = layer.walkable[target_node] ? [[0, target_node]] : this.nearest(layer, target_node);
    const dist = this.distances(layer, seeds);
    layer.field = { target_node, dist };

    return dist;
  }

  // Nos livres mais proximos de `source` sem atravessar celulas bloqueadas: [[distancia, no], ...].
  nearest(layer, source) {
    const { cols, rows } = layer;
    const seen = new Set([source]);
    let frontier = [source];

    for (let depth = 0; depth < NEAREST_DEPTH && frontier.length; depth += 1) {
      const next_frontier = [];

      for (const node of frontier) {
        const col = node % cols;
        const row = Math.floor(node / cols);

        for (const [dc, dr] of STEPS) {
          const next_col = col + dc;
          const next_row = row + dr;
          if (next_col < 0 || next_row < 0 || next_col >= cols || next_row >= rows) continue;

          const next = next_row * cols + next_col;
          if (seen.has(next) || !layer.open[next]) continue;
          if (dc !== 0 && dr !== 0 && (!layer.open[row * cols + next_col] || !layer.open[next_row * cols + col])) continue;

          seen.add(next);
          next_frontier.push(next);
        }
      }

      const found = next_frontier.filter((node) => layer.walkable[node]);
      if (found.length) {
        const distance = (node) => Math.hypot((node % cols) - (source % cols), Math.floor(node / cols) - Math.floor(source / cols));
        return found.map((node) => [distance(node), node]);
      }

      frontier = next_frontier;
    }

    return [];
  }

  distances(layer, seeds) {
    const { cols, rows, walkable, inside } = layer;
    const dist = new Float32Array(cols * rows).fill(Infinity);
    const heap = [];
    seeds.forEach(([d, node]) => {
      if (d >= dist[node]) return;
      dist[node] = d;
      this.push(heap, [d, node]);
    });

    while (heap.length) {
      const [d, cell] = this.pop(heap);
      if (d > dist[cell]) continue;

      const col = cell % cols;
      const row = Math.floor(cell / cols);

      for (const [dc, dr, cost] of STEPS) {
        const next_col = col + dc;
        const next_row = row + dr;
        if (next_col < 0 || next_row < 0 || next_col >= cols || next_row >= rows) continue;

        const next = next_row * cols + next_col;
        if (!walkable[next]) continue;
        // Sem atravessar quina entre dois blocos.
        if (dc !== 0 && dr !== 0 && (!walkable[row * cols + next_col] || !walkable[next_row * cols + col])) continue;

        // A busca anda ao contrario (do jogador para o zumbi): ir de `cell` para `next` aqui e o zumbi ir de
        // `next` para `cell`. Da tela para fora custa caro.
        const step = cost + (inside[next] && !inside[cell] ? EXIT_PENALTY : 0);
        if (d + step >= dist[next]) continue;
        dist[next] = d + step;
        this.push(heap, [dist[next], next]);
      }
    }

    return dist;
  }

  // Vizinho com a menor distancia, se for menor que a do proprio no; null se nao ha para onde descer.
  downhill(layer, dist, cell) {
    const { cols, rows, walkable } = layer;
    const col = cell % cols;
    const row = Math.floor(cell / cols);
    let best = null;

    for (const [dc, dr] of STEPS) {
      const next_col = col + dc;
      const next_row = row + dr;
      if (next_col < 0 || next_row < 0 || next_col >= cols || next_row >= rows) continue;

      const candidate = next_row * cols + next_col;
      if (dist[candidate] === Infinity || dist[candidate] >= (best === null ? dist[cell] : dist[best])) continue;
      if (walkable[cell] && dc !== 0 && dr !== 0 && (!walkable[row * cols + next_col] || !walkable[next_row * cols + col])) continue;
      best = candidate;
    }

    return best;
  }

  // Desce o campo a partir de `start`, indo ate o ponto mais distante que ainda se alcanca em linha reta.
  follow(grid, layer, dist, from, start) {
    // Zumbi preso num no que nao cabe ele e sem vizinho livre: sai pelo no livre mais perto.
    if (dist[start] === Infinity && this.downhill(layer, dist, start) === null) {
      const exits = this.nearest(layer, start).filter(([, node]) => dist[node] < Infinity).sort((a, b) => a[0] - b[0]);
      return exits.length ? this.center(grid, layer, exits[0][1]) : null;
    }

    let cell = start;
    let best = null;

    for (let step = 0; step < LOOKAHEAD; step += 1) {
      const next = this.downhill(layer, dist, cell);
      if (next === null) break;

      const point = this.center(grid, layer, next);
      // O primeiro passo vale mesmo se o zumbi estiver encostado no solido; os seguintes precisam de linha livre.
      if (best !== null && layer.walls.some((rect) => segmentHitsRect(from, point, rect))) break;

      best = point;
      cell = next;
    }

    return best;
  }

  push(heap, item) {
    heap.push(item);
    let i = heap.length - 1;

    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  }

  pop(heap) {
    const top = heap[0];
    const last = heap.pop();

    if (heap.length) {
      heap[0] = last;
      let i = 0;

      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }

    return top;
  }
}

export default Pathfinder;
