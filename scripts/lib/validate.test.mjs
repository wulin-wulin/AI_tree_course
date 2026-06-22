import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOutput } from './validate.mjs';

const clusters = [{ id: 'c1' }];
test('合法输出无错误', () => {
  const index = { clusters, points: [{ id: 'a', clusterId: 'c1', pos: [1, 2], scale: 1 }] };
  const points = { a: { id: 'a', clusterId: 'c1', ideologicalElement: '思政', prerequisites: [] } };
  assert.deepEqual(validateOutput(index, points), []);
});

test('缺思政/悬空簇/悬空 prereq 报错', () => {
  const index = { clusters, points: [{ id: 'a', clusterId: 'cX', pos: [1, 2], scale: 1 }] };
  const points = { a: { id: 'a', clusterId: 'cX', ideologicalElement: '', prerequisites: ['z'] } };
  const errs = validateOutput(index, points);
  assert.ok(errs.some(e => /思政/.test(e)));
  assert.ok(errs.some(e => /簇/.test(e)));
  assert.ok(errs.some(e => /prereq|前置/.test(e)));
});
