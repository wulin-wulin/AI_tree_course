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
