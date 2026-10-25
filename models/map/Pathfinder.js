const CELL = 30;
const MARGIN = 240; // os zumbis nascem fora da tela; a grade cobre essa faixa
const LOOKAHEAD = 8; // quantas celulas a frente tenta alcancar em linha reta (suaviza o caminho)
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

// Acha o caminho dos zumbis ate o jogador desviando dos solidos do mapa.
// Os solidos sao "inchados" pela metade do corpo do zumbi, assim o centro dele pode ser tratado como um ponto.
// Uma unica busca (Dijkstra a partir do jogador) serve a todos os zumbis do mesmo tamanho.
class Pathfinder {
  constructor() {
    this.solids = null;
    this.fields = new Map(); // raio -> { blocked, dist, target_cell }
  }

  // Proximo ponto para onde o centro `from` deve andar para chegar em `target`.
  waypoint(from, target, radius, solids, width, height) {
    const inflated = this.inflate(solids, radius);
    if (!inflated.some((rect) => segmentHitsRect(from, target, rect))) return target;

    const grid = this.grid(width, height);
    const field = this.field(grid, inflated, solids, radius, target);
    const start = this.cellOf(grid, from);

    if (!field || start === null) return target;

    return this.follow(grid, field, inflated, from, start) || target;
  }

  inflate(solids, radius) {
    return solids.map((s) => ({ x: s.x - radius, y: s.y - radius, w: s.w + radius * 2, h: s.h + radius * 2 }));
  }

  grid(width, height) {
    return { cols: Math.ceil((width + MARGIN * 2) / CELL), rows: Math.ceil((height + MARGIN * 2) / CELL) };
  }

  cellOf(grid, point) {
    const col = Math.floor((point.x + MARGIN) / CELL);
    const row = Math.floor((point.y + MARGIN) / CELL);
    if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;

    return row * grid.cols + col;
  }

  center(grid, cell) {
    return { x: (cell % grid.cols) * CELL - MARGIN + CELL / 2, y: Math.floor(cell / grid.cols) * CELL - MARGIN + CELL / 2 };
  }

  // Campo de distancias ate o jogador, refeito so quando o mapa ou a celula do jogador mudam.
  field(grid, inflated, solids, radius, target) {
    if (this.solids !== solids) {
      this.solids = solids;
      this.fields.clear();
    }

    const target_cell = this.cellOf(grid, target);
    if (target_cell === null) return null;

    const cached = this.fields.get(radius);
    if (cached && cached.target_cell === target_cell) return cached;

    const blocked = new Uint8Array(grid.cols * grid.rows);
    inflated.forEach((rect) => {
      const first_col = Math.max(0, Math.floor((rect.x + MARGIN) / CELL));
      const last_col = Math.min(grid.cols - 1, Math.floor((rect.x + rect.w + MARGIN) / CELL));
      const first_row = Math.max(0, Math.floor((rect.y + MARGIN) / CELL));
      const last_row = Math.min(grid.rows - 1, Math.floor((rect.y + rect.h + MARGIN) / CELL));

      for (let row = first_row; row <= last_row; row += 1) {
        for (let col = first_col; col <= last_col; col += 1) blocked[row * grid.cols + col] = 1;
      }
    });

    const field = { blocked, dist: this.distances(grid, blocked, target_cell), target_cell };
    this.fields.set(radius, field);

    return field;
  }

  distances(grid, blocked, source) {
    const { cols, rows } = grid;
    const dist = new Float32Array(cols * rows).fill(Infinity);
    const heap = [[0, source]];
    dist[source] = 0;

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
        if (blocked[next]) continue;
        // Sem atravessar quina entre dois blocos.
        if (dc !== 0 && dr !== 0 && (blocked[row * cols + next_col] || blocked[next_row * cols + col])) continue;

        if (d + cost >= dist[next]) continue;
        dist[next] = d + cost;
        this.push(heap, [dist[next], next]);
      }
    }

    return dist;
  }

  // Desce o campo a partir de `start`, indo ate o ponto mais distante que ainda se alcanca em linha reta.
  follow(grid, field, inflated, from, start) {
    const { cols, rows } = grid;
    let cell = start;
    let best = null;

    for (let step = 0; step < LOOKAHEAD; step += 1) {
      const col = cell % cols;
      const row = Math.floor(cell / cols);
      let next = null;

      for (const [dc, dr] of STEPS) {
        const next_col = col + dc;
        const next_row = row + dr;
        if (next_col < 0 || next_row < 0 || next_col >= cols || next_row >= rows) continue;

        const candidate = next_row * cols + next_col;
        if (field.dist[candidate] >= (next === null ? field.dist[cell] : field.dist[next])) continue;
        if (field.dist[candidate] === Infinity) continue;
        next = candidate;
      }

      if (next === null) break;

      const point = this.center(grid, next);
      // O primeiro passo vale mesmo se o zumbi estiver encostado no solido; os seguintes precisam de linha livre.
      if (best !== null && inflated.some((rect) => segmentHitsRect(from, point, rect))) break;

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
