import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutByCluster } from './layout.mjs';

const pts = [
  { id: 'a', clusterId: 'c1', importance: 1.0 },
  { id: 'b', clusterId: 'c1', importance: 0.0 },
  { id: 'c', clusterId: 'c2', importance: 0.5 },
];

test('每点都有坐标且无 NaN', () => {
  const m = layoutByCluster(pts);
  for (const p of pts) {
    const r = m.get(p.id);
    assert.ok(r, `${p.id} 缺布局`);
    assert.ok(Number.isFinite(r.pos[0]) && Number.isFinite(r.pos[1]));
  }
});

test('scale 随 importance 单调', () => {
  const m = layoutByCluster(pts);
  assert.ok(m.get('a').scale > m.get('b').scale);
  assert.equal(m.get('b').scale, 0.6);
});

test('确定性：两次结果一致', () => {
  const m1 = layoutByCluster(pts);
  const m2 = layoutByCluster(pts);
  assert.deepEqual(m1.get('a').pos, m2.get('a').pos);
});

test('同簇点不重合', () => {
  const m = layoutByCluster(pts);
  const [ax, ay] = m.get('a').pos, [bx, by] = m.get('b').pos;
  assert.ok(Math.hypot(ax - bx, ay - by) > 1);
});
