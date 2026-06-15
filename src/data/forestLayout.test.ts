import { describe, it, expect } from 'vitest';
import { partitionRect, type Rect, type LayoutItem } from './forestLayout';

const items: LayoutItem[] = [
  { id: 'a', weight: 4 },
  { id: 'b', weight: 2 },
  { id: 'c', weight: 2 },
  { id: 'd', weight: 1 },
];
const root: Rect = { x: 0, z: 0, w: 1, d: 1 };

describe('partitionRect', () => {
  it('叶子数 == 项目数', () => {
    const { cells } = partitionRect(items, root);
    expect(cells.length).toBe(items.length);
  });

  it('每项都有对应矩形', () => {
    const { cells } = partitionRect(items, root);
    for (const item of items) {
      expect(cells.find((c) => c.id === item.id)).toBeTruthy();
    }
  });

  it('面积之和 == 根矩形面积（精确镶嵌）', () => {
    const { cells } = partitionRect(items, root);
    const total = cells.reduce((s, c) => s + c.rect.w * c.rect.d, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it('各矩形面积 ∝ 权重', () => {
    const { cells } = partitionRect(items, root);
    const totalW = items.reduce((s, i) => s + i.weight, 0);
    for (const c of cells) {
      const item = items.find((i) => i.id === c.id)!;
      expect(c.rect.w * c.rect.d).toBeCloseTo(item.weight / totalW, 5);
    }
  });

  it('N 个叶子产生 N-1 条内部分界线', () => {
    const { dividers } = partitionRect(items, root);
    expect(dividers.length).toBe(items.length - 1);
  });

  it('确定性：同输入同输出', () => {
    const a = JSON.stringify(partitionRect(items, root));
    const b = JSON.stringify(partitionRect(items, root));
    expect(a).toBe(b);
  });
});

import { scatterTrees, INSET } from './forestLayout';

describe('scatterTrees', () => {
  const rect = { x: 0.2, z: 0.2, w: 0.4, d: 0.4 };

  it('点数 == 请求数', () => {
    const pts = scatterTrees(rect, 7, 123);
    expect(pts.length).toBe(7);
  });

  it('全部落在内缩矩形内', () => {
    const pts = scatterTrees(rect, 10, 123);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(rect.x + INSET * rect.w - 1e-9);
      expect(p.x).toBeLessThanOrEqual(rect.x + rect.w - INSET * rect.w + 1e-9);
      expect(p.z).toBeGreaterThanOrEqual(rect.z + INSET * rect.d - 1e-9);
      expect(p.z).toBeLessThanOrEqual(rect.z + rect.d - INSET * rect.d + 1e-9);
    }
  });

  it('确定性：同 seed 同结果', () => {
    expect(scatterTrees(rect, 6, 9)).toEqual(scatterTrees(rect, 6, 9));
  });

  it('n=0 返回空数组', () => {
    expect(scatterTrees(rect, 0, 1)).toEqual([]);
  });
});

import { buildForestLayout, pointInRect } from './forestLayout';

const chapters = [
  { id: 'c1', accent: '#111', soft: '#eee', dark: '#000', title: 'A' },
  { id: 'c2', accent: '#222', soft: '#ddd', dark: '#001', title: 'B' },
  { id: 'c3', accent: '#333', soft: '#ccc', dark: '#002', title: 'C' },
];
const pointsByChapter: Record<string, { id: string }[]> = {
  c1: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
  c2: [{ id: 'p4' }, { id: 'p5' }],
  c3: [{ id: 'p6' }],
};

describe('buildForestLayout', () => {
  it('区域数 == 章节数，树数 == 小节总数', () => {
    const { regions, trees } = buildForestLayout(chapters, pointsByChapter);
    expect(regions.length).toBe(3);
    expect(trees.length).toBe(6);
  });

  it('每棵树落在其所属章节的区域矩形内', () => {
    const { regions, trees } = buildForestLayout(chapters, pointsByChapter);
    for (const t of trees) {
      const region = regions.find((r) => r.chapterId === t.chapterId)!;
      expect(pointInRect(t, region.rect)).toBe(true);
    }
  });

  it('区域携带配色与树种', () => {
    const { regions } = buildForestLayout(chapters, pointsByChapter);
    const r = regions.find((x) => x.chapterId === 'c1')!;
    expect(r.accent).toBe('#111');
    expect(typeof r.species).toBe('number');
  });

  it('确定性：同输入同输出', () => {
    const a = JSON.stringify(buildForestLayout(chapters, pointsByChapter));
    const b = JSON.stringify(buildForestLayout(chapters, pointsByChapter));
    expect(a).toBe(b);
  });
});
