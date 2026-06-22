export type PointMeta = {
  id: string; title: string; clusterId: string; shortSummary: string;
  difficulty: string; importance: number; keyTerms: string[];
  pos: [number, number]; scale: number;
};
export type ClusterMeta = {
  id: string; title: string; subtitle: string; description: string;
  accent: string; soft: string; dark: string;
};
export type ForestIndex = { clusters: ClusterMeta[]; points: PointMeta[] };

export type FullPoint = PointMeta & {
  coreIdea: string; principles: string[]; applications: string[];
  comparisons?: string[]; formula?: string; aliases?: string[];
  intuition?: string; misconceptions?: string[]; history?: string;
  prerequisites?: string[];
};

export function clusterColorMap(index: ForestIndex): Record<string, string> {
  const m: Record<string, string> = {};
  for (const c of index.clusters) m[c.id] = c.accent;
  return m;
}

const _cache = new Map<string, FullPoint>();
// Vite 动态 import：每个 point JSON 切分为按需 chunk，点击时才加载。
const _defaultImporter = (id: string): Promise<{ default: unknown }> =>
  import(`../data/points/${id}.json`);

export async function loadPoint(
  id: string,
  importer: (id: string) => Promise<{ default: unknown }> = _defaultImporter,
): Promise<FullPoint> {
  const hit = _cache.get(id);
  if (hit) return hit;
  const mod = await importer(id);
  const point = mod.default as FullPoint;
  _cache.set(id, point);
  return point;
}
