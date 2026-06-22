import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mapKpToPoint } from './lib/transform.mjs';
import { normalizeId, resolvePrereqs, dedupPoints } from './lib/merge.mjs';
import { layoutByCluster } from './lib/layout.mjs';
import { validateOutput } from './lib/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FOREST = '/Users/yzs/Desktop/ai-knowledge-forest';
const OUT_INDEX = join(ROOT, 'src/data/index.json');
const OUT_POINTS = join(ROOT, 'src/data/points');

async function main() {
  const clusters = JSON.parse(readFileSync(join(ROOT, 'src/data/clusters.json'), 'utf8'));
  const clusterMap = JSON.parse(readFileSync(join(ROOT, 'scripts/cluster_map.json'), 'utf8'));
  const authoredClusterMap = JSON.parse(readFileSync(join(ROOT, 'scripts/authored_cluster_map.json'), 'utf8'));
  const forestIdx = JSON.parse(readFileSync(join(FOREST, 'data/index.json'), 'utf8'));

  // 1) 现有手写点：从 courseKnowledge.ts 导入（Node 原生剥离 TS 类型）
  // 旧 8 簇 ID 需重映射到新 23 簇（authored_cluster_map.json）；未列出的保持原 ID（已是合法新簇）
  const authoredMod = await import(join(ROOT, 'src/data/courseKnowledge.ts'));
  const authored = (authoredMod.knowledgePoints || []).map(p => {
    const id = normalizeId(p.id);
    return { ...p, id, clusterId: authoredClusterMap[id] || p.clusterId, importance: p.importance ?? 0.6 };
  });

  // 2) 挖矿森林点
  const idMap = {};
  for (const kp of forestIdx.knowledge_points) idMap[kp.id] = normalizeId(kp.id);
  const mined = [];
  for (const kpMeta of forestIdx.knowledge_points) {
    const clusterId = clusterMap[kpMeta.category_id];
    if (!clusterId) continue;
    const full = JSON.parse(readFileSync(join(FOREST, 'data/knowledge_points', `${kpMeta.id}.json`), 'utf8'));
    const point = mapKpToPoint(full, clusterId);
    point.id = normalizeId(point.id);
    if (Array.isArray(full.facets?.prerequisites)) {
      point.prerequisites = full.facets.prerequisites;
      resolvePrereqs(point, idMap); // 森林 kp_* 前置 → 我们的 id（仅 mined）
    }
    mined.push(point);
  }

  // 3) 合并去重（冲突保留手写）；再按最终点集过滤悬空前置（被去重丢弃/未纳入的引用）
  const merged = dedupPoints(authored, mined);
  const includedIds = new Set(merged.map(p => p.id));
  for (const p of merged) {
    if (Array.isArray(p.prerequisites)) {
      p.prerequisites = p.prerequisites.filter(id => includedIds.has(id) && id !== p.id);
    }
  }

  // 4) 布局
  const layout = layoutByCluster(merged);
  for (const p of merged) {
    const l = layout.get(p.id);
    p.pos = l.pos; p.scale = l.scale;
  }

  // 5) 写产物（不使用课程思政，剥除该字段）
  rmSync(OUT_POINTS, { recursive: true, force: true });
  mkdirSync(OUT_POINTS, { recursive: true });
  const pointsObj = {};
  const index = { schema_version: '1.0', clusters, points: [] };
  for (const p of merged) {
    delete p.ideologicalElement;
    pointsObj[p.id] = p;
    writeFileSync(join(OUT_POINTS, `${p.id}.json`), JSON.stringify(p, null, 2));
    index.points.push({
      id: p.id, title: p.title, clusterId: p.clusterId, shortSummary: p.shortSummary,
      difficulty: p.difficulty, importance: p.importance, keyTerms: p.keyTerms,
      pos: p.pos, scale: p.scale,
    });
  }
  writeFileSync(OUT_INDEX, JSON.stringify(index, null, 2));

  // 6) 校验
  const errs = validateOutput(index, pointsObj);
  console.log(`产出 ${index.points.length} 个知识点，${clusters.length} 个簇`);
  if (errs.length) { console.error('校验失败:\n' + errs.slice(0, 20).join('\n')); process.exit(1); }
  console.log('校验通过 ✅');
}
main().catch(e => { console.error(e); process.exit(1); });
