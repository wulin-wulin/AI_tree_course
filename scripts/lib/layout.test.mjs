import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutByCluster } from './layout.mjs';

const pts = [
  { id: 'a', clusterId: 'c1', importance: 1.0 },
  { id: 'b', clusterId: 'c1', importance: 0.0 },
  { id: 'c', clusterId: 'c2', importance: 0.5 },
];

test('每点都有坐标且无 NaN', () => {
  const { positions } = layoutByCluster(pts);
  for (const p of pts) {
    const r = positions.get(p.id);
    assert.ok(r, `${p.id} 缺布局`);
    assert.ok(Number.isFinite(r.pos[0]) && Number.isFinite(r.pos[1]));
  }
});

test('scale 随 importance 单调', () => {
  const { positions } = layoutByCluster(pts);
  assert.ok(positions.get('a').scale > positions.get('b').scale);
  assert.equal(positions.get('b').scale, 0.6);
});

test('确定性：两次结果一致', () => {
  const m1 = layoutByCluster(pts).positions;
  const m2 = layoutByCluster(pts).positions;
  assert.deepEqual(m1.get('a').pos, m2.get('a').pos);
});

test('同簇点不重合', () => {
  const { positions } = layoutByCluster(pts);
  const [ax, ay] = positions.get('a').pos, [bx, by] = positions.get('b').pos;
  assert.ok(Math.hypot(ax - bx, ay - by) > 1);
});

test('返回簇区域多边形与标签位', () => {
  const { regions } = layoutByCluster(pts);
  assert.ok(regions.c1 && regions.c1.polygon.length >= 4);
  assert.ok(Array.isArray(regions.c1.labelPos) && regions.c1.labelPos.length === 2);
});
