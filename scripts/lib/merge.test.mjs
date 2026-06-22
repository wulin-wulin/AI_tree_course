import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePrereqs, dedupPoints, normalizeId } from './merge.mjs';

test('normalizeId 规范化', () => {
  assert.equal(normalizeId('kp_random_forest'), 'random-forest');
  assert.equal(normalizeId('A Star Search'), 'a-star-search');
});

test('resolvePrereqs 转换并丢弃悬空', () => {
  const p = { prerequisites: ['kp_decision_tree', 'kp_missing'] };
  resolvePrereqs(p, { kp_decision_tree: 'decision-tree' });
  assert.deepEqual(p.prerequisites, ['decision-tree']);
});

test('dedupPoints 冲突保留 authored', () => {
  const authored = [{ id: 'decision-tree', title: '决策树', coreIdea: '手写版' }];
  const mined = [{ id: 'decision-tree', title: '决策树', coreIdea: '挖矿版' }, { id: 'bagging', title: 'Bagging' }];
  const out = dedupPoints(authored, mined);
  assert.equal(out.length, 2);
  assert.equal(out.find(p => p.id === 'decision-tree').coreIdea, '手写版');
});
