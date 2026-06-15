import { mulberry32, hashSeed } from './prng';

// 归一化布局空间：x∈[0,1]（右），z∈[0,1]（纵深）。
export type Rect = { x: number; z: number; w: number; d: number };
export type LayoutItem = { id: string; weight: number };
export type Cell = { id: string; rect: Rect };
export type Divider = { a: [number, number]; b: [number, number] };

// 二叉比例切分：按累计权重把项目分成两组，沿矩形较长边按权重比例切开，递归。
// 精确镶嵌、面积 ∝ 权重、保留输入顺序、确定性。
export function partitionRect(
  items: LayoutItem[],
  rect: Rect,
): { cells: Cell[]; dividers: Divider[] } {
  const cells: Cell[] = [];
  const dividers: Divider[] = [];

  function recurse(group: LayoutItem[], r: Rect): void {
    if (group.length === 1) {
      cells.push({ id: group[0].id, rect: r });
      return;
    }
    const total = group.reduce((s, i) => s + i.weight, 0);
    // 找到使左组权重最接近一半的切分点（保序）。
    let acc = 0;
    let splitIdx = 1;
    let best = Infinity;
    for (let i = 1; i < group.length; i++) {
      acc += group[i - 1].weight;
      const diff = Math.abs(acc - total / 2);
      if (diff < best) {
        best = diff;
        splitIdx = i;
      }
    }
    const left = group.slice(0, splitIdx);
    const right = group.slice(splitIdx);
    const leftW = left.reduce((s, i) => s + i.weight, 0);
    const frac = leftW / total;

    if (r.w >= r.d) {
      // 沿 x 切：竖直分界线
      const cut = r.x + r.w * frac;
      dividers.push({ a: [cut, r.z], b: [cut, r.z + r.d] });
      recurse(left, { x: r.x, z: r.z, w: r.w * frac, d: r.d });
      recurse(right, { x: cut, z: r.z, w: r.w * (1 - frac), d: r.d });
    } else {
      // 沿 z 切：水平分界线
      const cut = r.z + r.d * frac;
      dividers.push({ a: [r.x, cut], b: [r.x + r.w, cut] });
      recurse(left, { x: r.x, z: r.z, w: r.w, d: r.d * frac });
      recurse(right, { x: r.x, z: cut, w: r.w, d: r.d * (1 - frac) });
    }
  }

  recurse(items, rect);
  return { cells, dividers };
}

// 树相对区域矩形的内缩比例（> 曲线分界抖动幅度，确保树在可见曲线内侧）。
export const INSET = 0.16;

export type Pt = { x: number; z: number };

// 抖动网格散点：cols×rows 网格，每个被占用格放一个抖动点。确定性、不重叠、数量精确。
export function scatterTrees(rect: Rect, n: number, seed: number): Pt[] {
  if (n <= 0) return [];
  const rnd = mulberry32(seed >>> 0);
  const ix = rect.x + INSET * rect.w;
  const iz = rect.z + INSET * rect.d;
  const iw = rect.w * (1 - 2 * INSET);
  const insetD = rect.d * (1 - 2 * INSET);
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = iw / cols;
  const cellD = insetD / rows;
  const pad = 0.18; // 格内边距，避免贴格边导致相邻过近
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const jx = pad + rnd() * (1 - 2 * pad);
    const jz = pad + rnd() * (1 - 2 * pad);
    pts.push({ x: ix + (c + jx) * cellW, z: iz + (r + jz) * cellD });
  }
  return pts;
}

export type ChapterLike = {
  id: string;
  accent: string;
  soft: string;
  dark: string;
  title: string;
};
export type PointLike = { id: string };

export type Region = {
  chapterId: string;
  title: string;
  accent: string;
  soft: string;
  dark: string;
  species: number;
  rect: Rect;
  centroid: Pt;
};
export type Tree = {
  pointId: string;
  chapterId: string;
  x: number;
  z: number;
  scale: number; // 0.7~1，按确定性微扰
  accent: string;
  dark: string;
};
export type ForestLayout = { regions: Region[]; trees: Tree[]; dividers: Divider[] };

export function pointInRect(p: Pt, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.z >= r.z && p.z <= r.z + r.d;
}

export function buildForestLayout(
  chapters: ChapterLike[],
  pointsByChapter: Record<string, PointLike[]>,
): ForestLayout {
  const items: LayoutItem[] = chapters.map((c) => ({
    id: c.id,
    weight: Math.max(1, (pointsByChapter[c.id] ?? []).length),
  }));
  const { cells, dividers } = partitionRect(items, { x: 0, z: 0, w: 1, d: 1 });

  const regions: Region[] = chapters.map((c, idx) => {
    const cell = cells.find((ce) => ce.id === c.id)!;
    return {
      chapterId: c.id,
      title: c.title,
      accent: c.accent,
      soft: c.soft,
      dark: c.dark,
      species: idx % 8,
      rect: cell.rect,
      centroid: { x: cell.rect.x + cell.rect.w / 2, z: cell.rect.z + cell.rect.d / 2 },
    };
  });

  const trees: Tree[] = [];
  for (const c of chapters) {
    const region = regions.find((r) => r.chapterId === c.id)!;
    const pts = (pointsByChapter[c.id] ?? []);
    const positions = scatterTrees(region.rect, pts.length, hashSeed(c.id));
    const rnd = mulberry32(hashSeed(c.id) ^ 0x9e3779b9);
    pts.forEach((p, i) => {
      trees.push({
        pointId: p.id,
        chapterId: c.id,
        x: positions[i].x,
        z: positions[i].z,
        scale: 0.7 + rnd() * 0.3,
        accent: c.accent,
        dark: c.dark,
      });
    });
  }

  return { regions, trees, dividers };
}
