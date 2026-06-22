import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSceneInputs } from './forestAdapter.ts';

const idx = {
  clusters: [{ id: 'cnn', title: '卷积神经网络', accent: '#d6457a', polygon: [[0, 0], [10, 0], [10, 10], [0, 10]], labelPos: [5, 2] }],
  points: [{ id: 'lenet', clusterId: 'cnn', pos: [3, 3], scale: 1.2, importance: 0.5 }],
};

test('layout.domains 来自簇并带 polygon/color', () => {
  const { layout } = buildSceneInputs(idx);
  assert.equal(layout.domains[0].id, 'cnn');
  assert.equal(layout.domains[0].color, '#d6457a');
  assert.equal(layout.domains[0].polygon.length, 4);
});

test('data 索引齐全', () => {
  const { data } = buildSceneInputs(idx);
  assert.equal(data.kpById.lenet.category_id, 'cnn');
  assert.equal(data.catById.cnn.domain_id, 'cnn');
  assert.equal(data.domById.cnn.name_zh, '卷积神经网络');
  assert.equal(data.kpsByCat.cnn.length, 1);
  assert.equal(data.kpsByDom.cnn.length, 1);
});
