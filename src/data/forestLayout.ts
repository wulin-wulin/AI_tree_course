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
