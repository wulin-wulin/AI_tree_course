import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapDifficulty, buildComparisons, pickShortSummary, mapKeyTerms, mapKpToPoint } from './transform.mjs';

test('mapDifficulty 分档', () => {
  assert.equal(mapDifficulty(0.2), '基础');
  assert.equal(mapDifficulty(0.5), '中等');
  assert.equal(mapDifficulty(0.9), '进阶');
  assert.equal(mapDifficulty(undefined), '中等');
});

test('buildComparisons 拼维度', () => {
  assert.deepEqual(buildComparisons({ a: '高', b: '低' }), ['a: 高', 'b: 低']);
  assert.deepEqual(buildComparisons(undefined), []);
});

test('pickShortSummary 优先 intuition 并截断', () => {
  const s = pickShortSummary({ intuition: '简短直觉', definition: '很长很长的定义'.repeat(20) });
  assert.equal(s, '简短直觉');
  const long = pickShortSummary({ definition: 'x'.repeat(200) });
  assert.ok(long.length <= 121);
});

test('mapKeyTerms 合并去重截断', () => {
  const r = mapKeyTerms({ keywords: ['a', 'b', 'a'] }, ['b', 'c']);
  assert.deepEqual(r, ['a', 'b', 'c']);
});

test('mapKpToPoint 映射核心字段', () => {
  const kp = {
    id: 'kp_bagging', name_zh: 'Bagging', importance: 0.059, tags: ['集成学习'],
    facets: {
      definition: '定义', core_content: '核心', applications: ['应用1'],
      keywords: ['自助采样'], difficulty: 0.4, comparison_values: { dim_x: '高' }, formalization: '',
    },
  };
  const p = mapKpToPoint(kp, 'ensemble');
  assert.equal(p.id, 'kp_bagging');
  assert.equal(p.title, 'Bagging');
  assert.equal(p.clusterId, 'ensemble');
  assert.equal(p.coreIdea, '核心');
  assert.equal(p.difficulty, '中等');
  assert.deepEqual(p.applications, ['应用1']);
  assert.deepEqual(p.comparisons, ['dim_x: 高']);
  assert.equal(p.formula, undefined); // 空字符串不设
  assert.equal(p.importance, 0.059);
});
