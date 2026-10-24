import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState, snap } from '../editor/EditorState.js';
import { MAX_OBJECTS } from '../models/map/MapData.js';

const types = (state) => state.map.objects.map((o) => o.type);

describe('estado do editor', () => {
  it('adiciona objetos e seleciona o novo', () => {
    const state = new EditorState();
    assert.equal(state.add('cactus', 0.2, 0.3), 0);
    assert.equal(state.add('barrel', 0.5, 0.5, true), 1);
    assert.deepEqual(types(state), ['cactus', 'barrel']);
    assert.equal(state.selected, 1);
    assert.equal(state.map.objects[1].flip, true);
  });

  it('desfaz e refaz', () => {
    const state = new EditorState();
    state.add('cactus', 0.2, 0.3);
    state.add('barrel', 0.5, 0.5);
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
    state.add('cactus', 0.2, 0.3);
    state.undo();
    state.add('barrel', 0.5, 0.5);
    assert.equal(state.redo(), false);
  });

  it('pintar varios objetos sem checkpoint vira uma unica acao de desfazer', () => {
    const state = new EditorState();
    state.add('grass', 0.1, 0.1);
    state.checkpoint();                       // inicio da pincelada
    for (let i = 0; i < 10; i += 1) state.add('grass', 0.2 + i / 100, 0.5, false, false);
    assert.equal(state.map.objects.length, 11);
    state.undo();
    assert.equal(state.map.objects.length, 1);
  });

  it('remove, zera a selecao e ignora indice invalido', () => {
    const state = new EditorState();
    state.add('cactus', 0.2, 0.3);
    state.add('barrel', 0.5, 0.5);
    assert.ok(state.remove(0));
    assert.deepEqual(types(state), ['barrel']);
    assert.equal(state.selected, -1);
    assert.equal(state.remove(9), false);
    state.undo();
    assert.deepEqual(types(state), ['cactus', 'barrel']);
  });

  it('arrastar e uma unica acao e fica dentro da tela', () => {
    const state = new EditorState();
    state.add('cactus', 0.2, 0.3);
    state.beginMove();
    state.moveTo(0, 0.4, 0.4);
    state.moveTo(0, 1.5, -1);
    state.endMove();
    assert.deepEqual([state.map.objects[0].x, state.map.objects[0].y], [1, 0]);
    state.undo();
    assert.deepEqual([state.map.objects[0].x, state.map.objects[0].y], [0.2, 0.3]);
  });

  it('um clique sem mexer nao polui o historico', () => {
    const state = new EditorState();
    state.add('cactus', 0.2, 0.3);
    const before = state.past.length;
    state.beginMove();
    state.endMove();
    assert.equal(state.past.length, before);
  });

  it('espelha e desfaz o espelhamento', () => {
    const state = new EditorState();
    state.add('cactus', 0.2, 0.3);
    assert.ok(state.flip(0));
    assert.equal(state.map.objects[0].flip, true);
    state.undo();
    assert.equal(state.map.objects[0].flip, false);
  });

  it('limpar e importar entram no historico; reset nao', () => {
    const state = new EditorState({ objects: [{ type: 'bush', x: 0.1, y: 0.1 }] });
    assert.equal(state.undo(), false);
    state.clear();
    assert.deepEqual(types(state), []);
    state.undo();
    assert.deepEqual(types(state), ['bush']);
    state.load({ objects: [{ type: 'bones', x: 0.5, y: 0.5 }] });
    assert.deepEqual(types(state), ['bones']);
    state.undo();
    assert.deepEqual(types(state), ['bush']);
    state.reset({ objects: [] });
    assert.equal(state.past.length, 0);
  });

  it('nao passa do limite de objetos', () => {
    const state = new EditorState();
    for (let i = 0; i < MAX_OBJECTS; i += 1) state.add('grass', 0.5, 0.5, false, false);
    assert.equal(state.add('grass', 0.5, 0.5), -1);
    assert.equal(state.map.objects.length, MAX_OBJECTS);
  });

  it('o historico tem tamanho maximo', () => {
    const state = new EditorState();
    for (let i = 0; i < 150; i += 1) state.add('grass', 0.1, 0.1);
    assert.equal(state.past.length, 100);
  });
});

describe('grade', () => {
  it('alinha ao multiplo mais proximo e 0 desliga', () => {
    assert.equal(snap(23, 16), 16);
    assert.equal(snap(25, 16), 32);
    assert.equal(snap(23.7, 0), 23.7);
  });
});
