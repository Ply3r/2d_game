import './helpers/env.js';
import { test } from 'node:test';
import { readdirSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const walk = (dir) => readdirSync(dir).flatMap((file) => {
  const full = path.join(dir, file);
  return statSync(full).isDirectory() ? walk(full) : [full];
});

test('todos os modulos de models/ carregam', async () => {
  await import('../models/Main.js'); // evita problemas de import circular
  for (const file of walk('models').filter((f) => f.endsWith('.js'))) {
    await import(pathToFileURL(path.resolve(file)).href);
  }
});
