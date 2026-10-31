import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '../editor/EditorState.js';
import { MAX_OBJECTS, COLS, ROWS } from '../models/map/MapData.js';

const types = (state) => state.map.objects.map((o) => o.type);
const at = (state, index) => [state.map.objects[index].col, state.map.objects[index].row];

// Enche o mapa de mato, uma decoracao por celula.
const fillDecor = (state, count) => {
  for (let i = 0; i < count; i += 1) state.add('grass', i % COLS, Math.floor(i / COLS), false, false);
};

describe('estado do editor', () => {
  it('adiciona objetos e seleciona o novo', () => {
    const state = new EditorState();
    assert.equal(state.add('cactus', 2, 3), 0);
    assert.equal(state.add('barrel', 10, 5, true), 1);
    assert.deepEqual(types(state), ['cactus', 'barrel']);
    assert.equal(state.selected, 1);
    assert.equal(state.map.objects[1].flip, true);
  });

  it('desfaz e refaz', () => {
    const state = new EditorState();
    state.add('cactus', 2, 3);
    state.add('barrel', 10, 5);
    assert.ok(state.undo());
    assert.deepEqual(types(state), ['cactus']);
    assert.ok(state.undo());
    assert.deepEqual(types(state), []);
    assert.equal(state.undo(), false);
    assert.ok(state.redo());
    assert.ok(state.redo());
    assert.deepEqual(types(state), ['cactus', 'barrel']);
    assert.equal(state.redo(), false);
  });

  it('uma acao nova depois de desfazer descarta o refazer', () => {
    const state = new EditorState();
    state.add('cactus', 2, 3);
    state.undo();
    state.add('barrel', 10, 5);
    assert.equal(state.redo(), false);
  });

  it('pintar varios objetos sem checkpoint vira uma unica acao de desfazer', () => {
    const state = new EditorState();
    state.add('grass', 0, 0);
    state.checkpoint();                       // inicio da pincelada
    for (let i = 0; i < 10; i += 1) state.add('grass', 5 + i, 9, false, false);
    assert.equal(state.map.objects.length, 11);
    state.undo();
    assert.equal(state.map.objects.length, 1);
  });

  it('nao deixa dois solidos dividirem uma celula', () => {
    const state = new EditorState();
    assert.equal(state.add('sandbags', 4, 4), 0);   // ocupa 4..6 da linha 4
    assert.equal(state.add('cactus', 6, 4), -1);
    assert.equal(state.add('cactus', 7, 4), 1);
    assert.equal(state.add('rock_large', 3, 4), -1);
    assert.equal(state.past.length, 2, 'tentativa recusada nao entra no historico');
  });

  it('decoracao pode ficar sob um solido, e decoracao nova troca a da celula', () => {
    const state = new EditorState();
    state.add('crate_wood', 4, 4);
    assert.ok(state.add('bush', 4, 4) >= 0);
    assert.ok(state.add('grass', 4, 4) >= 0);
    assert.deepEqual(types(state), ['crate_wood', 'grass']);
    assert.equal(state.add('grass', 4, 4), -1, 'repetir o mesmo enfeite nao faz nada');
    state.undo();
    assert.deepEqual(types(state), ['crate_wood', 'bush']);
  });

  it('nao coloca fora da grade', () => {
    const state = new EditorState();
    assert.equal(state.add('sandbags', COLS - 2, 0), -1);
    assert.equal(state.add('cactus', -1, 0), -1);
    assert.equal(state.add('cactus', 0, ROWS), -1);
    assert.equal(state.add('sandbags', COLS - 3, ROWS - 1), 0);
  });

  it('remove, zera a selecao e ignora indice invalido', () => {
    const state = new EditorState();
    state.add('cactus', 2, 3);
    state.add('barrel', 10, 5);
    assert.ok(state.remove(0));
    assert.deepEqual(types(state), ['barrel']);
    assert.equal(state.selected, -1);
    assert.equal(state.remove(9), false);
    state.undo();
    assert.deepEqual(types(state), ['cactus', 'barrel']);
  });

  it('arrastar e uma unica acao e fica dentro da grade', () => {
    const state = new EditorState();
    state.add('sandbags', 2, 3);
    state.beginMove();
    state.moveTo(0, 4, 4);
    state.moveTo(0, 99, -5);
    state.endMove();
    assert.deepEqual(at(state, 0), [COLS - 3, 0]);
    state.undo();
    assert.deepEqual(at(state, 0), [2, 3]);
  });

  it('mover para cima de outro solido nao mexe', () => {
    const state = new EditorState();
    state.add('cactus', 2, 3);
    state.add('barrel', 5, 3);
    assert.equal(state.moveTo(0, 5, 3), false);
    assert.deepEqual(at(state, 0), [2, 3]);
    assert.ok(state.moveTo(0, 4, 3));
  });

  it('um clique sem mexer nao polui o historico', () => {
    const state = new EditorState();
    state.add('cactus', 2, 3);
    const before = state.past.length;
    state.beginMove();
    state.endMove();
    assert.equal(state.past.length, before);
  });

  it('espelha e desfaz o espelhamento', () => {
    const state = new EditorState();
    state.add('cactus', 2, 3);
    assert.ok(state.flip(0));
    assert.equal(state.map.objects[0].flip, true);
    state.undo();
    assert.equal(state.map.objects[0].flip, false);
  });

  it('limpar e importar entram no historico; reset nao', () => {
    const state = new EditorState({ version: 2, objects: [{ type: 'bush', col: 1, row: 1 }] });
    assert.equal(state.undo(), false);
    state.clear();
    assert.deepEqual(types(state), []);
    state.undo();
    assert.deepEqual(types(state), ['bush']);
    state.load({ version: 2, objects: [{ type: 'bones', col: 5, row: 5 }] });
    assert.deepEqual(types(state), ['bones']);
    state.undo();
    assert.deepEqual(types(state), ['bush']);
    state.reset({ objects: [] });
    assert.equal(state.past.length, 0);
  });

  it('nao passa do limite de objetos', () => {
    const state = new EditorState();
    fillDecor(state, MAX_OBJECTS);
    assert.equal(state.map.objects.length, MAX_OBJECTS);
    assert.equal(state.add('cactus', 31, 17), -1);
    assert.equal(state.map.objects.length, MAX_OBJECTS);
  });

  it('o historico tem tamanho maximo', () => {
    const state = new EditorState();
    for (let i = 0; i < 150; i += 1) state.add(i % 2 ? 'grass' : 'bush', 1, 1);
    assert.equal(state.past.length, 100);
  });
});
