import type { ForestIndex } from './forestData';

/* eslint-disable @typescript-eslint/no-explicit-any */
// 把我们的 index.json（clusters + points）适配成参考项目 Scene3D 需要的 layout / data 结构。
// 每个簇同时充当 reference 的 domain（区域+标签+颜色）与 category（catId == domId == clusterId）。
export function buildSceneInputs(index: ForestIndex & { clusters: any[]; points: any[] }) {
  const domains = index.clusters.map((c: any) => ({
    id: c.id,
    polygon: c.polygon ?? [],
    color: c.accent,
    label_pos: c.labelPos ?? [2000, 1500],
  }));

  const layout = {
    canvas: { width: 4000, height: 3000 },
    points: index.points.map((p: any) => ({ id: p.id, pos: p.pos, scale: p.scale })),
    domains,
    categories: [] as any[],
    levels: [] as any[],
  };

  const kpById: Record<string, any> = {};
  const kpsByCat: Record<string, any[]> = {};
  const kpsByDom: Record<string, any[]> = {};
  for (const p of index.points as any[]) {
    const kp = { id: p.id, name_zh: p.title, category_id: p.clusterId, importance: p.importance ?? 0.5 };
    kpById[p.id] = kp;
    (kpsByCat[p.clusterId] ||= []).push(kp);
    (kpsByDom[p.clusterId] ||= []).push(kp);
  }

  const catById: Record<string, any> = {};
  const domById: Record<string, any> = {};
  const idxDomains: any[] = [];
  const idxCategories: any[] = [];
  for (const c of index.clusters as any[]) {
    catById[c.id] = { id: c.id, domain_id: c.id, name_zh: c.title };
    domById[c.id] = { id: c.id, name_zh: c.title };
    idxDomains.push({ id: c.id, name_zh: c.title });
    idxCategories.push({ id: c.id, domain_id: c.id, name_zh: c.title });
  }

  const data = {
    index: { domains: idxDomains, categories: idxCategories },
    layout,
    kpById,
    catById,
    domById,
    kpsByCat,
    kpsByDom,
  };

  return { layout, data };
}
