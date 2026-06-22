import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clusterColorMap, loadPoint } from './forestData.ts';

test('clusterColorMap 映射颜色', () => {
  const idx = { clusters: [{ id: 'cnn', accent: '#d6457a' }], points: [] };
  assert.equal(clusterColorMap(idx).cnn, '#d6457a');
});

test('loadPoint 缓存：同 id 只 import 一次', async () => {
  let calls = 0;
  const importer = async (id) => { calls += 1; return { default: { id, title: 'T' } }; };
  const a = await loadPoint('x', importer);
  const b = await loadPoint('x', importer);
  assert.equal(a.title, 'T');
  assert.equal(b.title, 'T');
  assert.equal(calls, 1);
});
