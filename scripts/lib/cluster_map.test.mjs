import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FOREST = '/Users/yzs/Desktop/ai-knowledge-forest';

const clusters = JSON.parse(readFileSync(join(ROOT, 'src/data/clusters.json'), 'utf8'));
const map = JSON.parse(readFileSync(join(ROOT, 'scripts/cluster_map.json'), 'utf8'));
const forestIdx = JSON.parse(readFileSync(join(FOREST, 'data/index.json'), 'utf8'));

test('clusters 约 23 个且 id 唯一', () => {
  assert.ok(clusters.length >= 20 && clusters.length <= 26, `got ${clusters.length}`);
  const ids = clusters.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('每个 cluster 字段完整', () => {
  for (const c of clusters) {
    for (const k of ['id', 'title', 'subtitle', 'description', 'accent', 'soft', 'dark']) {
      assert.ok(c[k], `cluster ${c.id} 缺 ${k}`);
    }
  }
});

test('森林全部 category 都有映射且指向存在的 cluster', () => {
  const clusterIds = new Set(clusters.map(c => c.id));
  for (const cat of forestIdx.categories) {
    const target = map[cat.id];
    assert.ok(target, `category ${cat.id} 未映射`);
    assert.ok(clusterIds.has(target), `category ${cat.id} 指向不存在的 cluster ${target}`);
  }
});
