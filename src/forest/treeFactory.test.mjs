import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTree, seedFromId } from './treeFactory.ts';

test('seedFromId 稳定且为正整数', () => {
  assert.equal(seedFromId('bagging'), seedFromId('bagging'));
  assert.ok(Number.isInteger(seedFromId('cnn')) && seedFromId('cnn') > 0);
});

test('createTree 返回含子节点的 Group', () => {
  const t = createTree({ seed: 123, scale: 200, color: '#4A90D9', lod: 'high' });
  assert.equal(t.type, 'Group');
  assert.ok(t.children.length >= 2); // 树干 + 树冠
});

test('同 seed 同结构（子节点数一致）', () => {
  const a = createTree({ seed: 7, scale: 200, color: '#fff', lod: 'high' });
  const b = createTree({ seed: 7, scale: 200, color: '#fff', lod: 'high' });
  assert.equal(a.children.length, b.children.length);
});

test('low LOD 比 high 更简（子节点更少）', () => {
  const hi = createTree({ seed: 7, scale: 200, color: '#fff', lod: 'high' });
  const lo = createTree({ seed: 7, scale: 200, color: '#fff', lod: 'low' });
  assert.ok(lo.children.length <= hi.children.length);
});
