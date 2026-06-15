# 3D 知识森林地图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `/ai` 章节导览从 2D SVG 徒步长卷重构为一张 react-three-fiber 的 3D 斜俯瞰矩形知识森林地图：矩形铺满 8 块曲线分界区域（一章一片），每棵树是一个小节，滚轮缩放、拖拽平移、悬停预览、点击进入阅读页。

**Architecture:** 三层职责分离 —— 纯函数布局器 `forestLayout.ts`（确定性，把章节/小节映射成矩形镶嵌区域 + 树坐标，可单测）；3D 世界层 `ForestMapScene`（`<Canvas>` 内的相机/光照/区域/树）；DOM 覆盖层 `ForestMapOverlay`（顶栏/预览卡/提示）。`/ai` 入口 `ForestMapPage` 做 WebGL 探测与 error boundary，不可用时降级回保留的 `ChapterMapPage` 长卷。

**Tech Stack:** Vite + React 19 + TypeScript；新增 `three` / `@react-three/fiber` / `@react-three/drei`；新增 `vitest` 跑纯逻辑单测；现有 `@playwright/test` 做冒烟。

**关键设计取舍（实现者必读）：**
- 布局**数学层用矩形**（二叉比例切分 treemap，面积 ∝ 小节数，精确镶嵌、易测）；**曲线分界是渲染层的装饰**：区域填充用精确矩形（butting，无缝隙），内部分界线单独画成"抖动曲线"叠在上面。这样既满足"曲线分割"观感，又保证镶嵌精确、可单测。
- 树放在区域矩形的**内缩范围**内（inset > 曲线抖动幅度），所以树永远在可见曲线内侧，不会跨界。
- 坐标系：归一化布局空间 `x∈[0,1]`（右）、`z∈[0,1]`（纵深）。世界映射 `worldX=(x-0.5)*MAP_W`、`worldZ=(z-0.5)*MAP_D`，地面在 `y=0`。`MAP_W=20`、`MAP_D=14`。
- 相机：drei `<MapControls>`（拖拽平移 + 滚轮缩放，锁定俯角），初始斜俯瞰。
- `frameloop="demand"`：默认关风吹动画（同时满足 reduced-motion 与按需渲染）；控制器/指针事件自动触发重绘。

**8 章 id 顺序（来自 `courseKnowledge.ts`，实现时以实际数据为准）：** `intro-history` / `search-solving` / `knowledge-reasoning` / `machine-learning` / `deep-learning` / `nlp-vision` / `rl-agents` / `generative-safety`。

---

## File Structure

新增：
- `src/data/prng.ts` — 确定性随机（mulberry32 + 派生工具）
- `src/data/prng.test.ts`
- `src/data/forestLayout.ts` — 纯函数布局器（区域镶嵌 + 树散点 + 分界线）
- `src/data/forestLayout.test.ts`
- `src/utils/webgl.ts` — WebGL 能力探测（可注入，便于测试）
- `src/utils/webgl.test.ts`
- `src/components/forest3d/SubsectionTree.tsx` — 单棵树（树干+树冠+投影盘+交互）
- `src/components/forest3d/ChapterRegion.tsx` — 区域地块 + 曲线分界线
- `src/components/forest3d/ForestMapScene.tsx` — `<Canvas>` 3D 世界
- `src/components/forest3d/ForestMapOverlay.tsx` — 顶栏/预览卡/提示（DOM）
- `src/components/forest3d/ForestErrorBoundary.tsx` — 渲染错误捕获 → 降级
- `src/components/ForestMapPage.tsx` — `/ai` 新入口（WebGL 探测 + 组合 + 降级）
- `vitest.config.ts`
- `tests/forest-map.spec.ts` — Playwright 冒烟

修改：
- `package.json` — 新增依赖与 `test` 脚本
- `src/App.tsx` — `/ai` 的 element 换成 `ForestMapPage`
- `src/styles.css` — 3D 覆盖层样式

保留（降级后备）：`src/components/ChapterMapPage.tsx`、`src/components/ChapterTrailIndex.tsx`

---

## Task 1: 安装依赖与 Vitest 测试基建

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: 安装运行期与开发依赖**

Run（PATH 需含 node；本机 node 在 nvm，必要时 `export PATH="$HOME/.nvm/versions/node/v22.17.0/bin:$PATH"`）：

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D vitest @types/three
```

- [ ] **Step 2: 加 test 脚本**

修改 `package.json` 的 `scripts`，新增一行：

```json
"test": "vitest run"
```

- [ ] **Step 3: 创建 vitest 配置**

Create `vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: 验证测试运行器可用**

Run: `npm test`
Expected: 退出码 0，输出 "No test files found" 或已发现 0 个测试（此时尚无测试文件，属正常）。

- [ ] **Step 5: 验证安装未破坏构建**

Run: `npm run build`
Expected: `tsc -b && vite build` 通过，无类型错误。

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore(3dmap): 引入 three/r3f/drei 与 vitest 测试基建"
```

---

## Task 2: 确定性随机 `prng.ts`

布局必须确定性（同输入恒定输出，不用运行期 `Math.random`）。提供 mulberry32。

**Files:**
- Create: `src/data/prng.ts`
- Test: `src/data/prng.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/data/prng.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed } from './prng';

describe('mulberry32', () => {
  it('同种子产生相同序列（确定性）', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('不同种子产生不同序列', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });

  it('输出落在 [0,1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('hashSeed', () => {
  it('字符串转稳定数值种子', () => {
    expect(hashSeed('intro-history')).toEqual(hashSeed('intro-history'));
    expect(hashSeed('a')).not.toEqual(hashSeed('b'));
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL —— 无法解析 `./prng`。

- [ ] **Step 3: 实现 `prng.ts`**

Create `src/data/prng.ts`：

```ts
// 确定性伪随机：同种子恒定序列。用于布局，使刷新/重排后地图稳定可记忆。
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 把字符串（如 chapterId）转成稳定的 32 位数值种子。
export function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（4 个测试全绿）。

- [ ] **Step 5: Commit**

```bash
git add src/data/prng.ts src/data/prng.test.ts
git commit -m "feat(3dmap): 确定性随机 mulberry32 + hashSeed"
```

---

## Task 3: 布局器类型与区域镶嵌 `forestLayout.ts`（第 1 部分：partition）

二叉比例切分把矩形精确镶嵌成 N 块，面积 ∝ 权重（小节数），保留章节顺序，记录内部分界线。

**Files:**
- Create: `src/data/forestLayout.ts`
- Test: `src/data/forestLayout.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/data/forestLayout.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL —— 无法解析 `./forestLayout`。

- [ ] **Step 3: 实现 partition 部分**

Create `src/data/forestLayout.ts`：

```ts
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（partition 全部测试 + Task 2 的测试，全绿）。

- [ ] **Step 5: Commit**

```bash
git add src/data/forestLayout.ts src/data/forestLayout.test.ts
git commit -m "feat(3dmap): 矩形二叉比例镶嵌 partitionRect"
```

---

## Task 4: 树散点 `scatterTrees`（forestLayout 第 2 部分）

在区域矩形内缩范围里确定性散点，数量 = 小节数，互不重叠。

**Files:**
- Modify: `src/data/forestLayout.ts`
- Modify: `src/data/forestLayout.test.ts`

- [ ] **Step 1: 追加失败测试**

在 `src/data/forestLayout.test.ts` 末尾追加：

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL —— `scatterTrees` / `INSET` 未导出。

- [ ] **Step 3: 实现 scatterTrees**

在 `src/data/forestLayout.ts` 顶部 import，并追加实现：

```ts
import { mulberry32 } from './prng';

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
  const id = rect.d * (1 - 2 * INSET);
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = iw / cols;
  const cellD = id / rows;
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（新增 4 个测试全绿）。

- [ ] **Step 5: Commit**

```bash
git add src/data/forestLayout.ts src/data/forestLayout.test.ts
git commit -m "feat(3dmap): 区域内确定性抖动散点 scatterTrees"
```

---

## Task 5: 装配 `buildForestLayout`（forestLayout 第 3 部分）

把章节 + 小节组装成最终 `{ regions, trees, dividers }`。

**Files:**
- Modify: `src/data/forestLayout.ts`
- Modify: `src/data/forestLayout.test.ts`

- [ ] **Step 1: 追加失败测试**

在 `src/data/forestLayout.test.ts` 末尾追加：

```ts
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
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL —— `buildForestLayout` / `pointInRect` 未导出。

- [ ] **Step 3: 实现装配**

在 `src/data/forestLayout.ts` 追加 import 与实现：

```ts
import { hashSeed } from './prng';

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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（全部 forestLayout + prng 测试绿）。

- [ ] **Step 5: 验证类型构建**

Run: `npm run build`
Expected: 通过（纯逻辑模块无类型错误）。

- [ ] **Step 6: Commit**

```bash
git add src/data/forestLayout.ts src/data/forestLayout.test.ts
git commit -m "feat(3dmap): 装配 buildForestLayout（区域+树+分界线）"
```

---

## Task 6: WebGL 探测 `webgl.ts`

**Files:**
- Create: `src/utils/webgl.ts`
- Test: `src/utils/webgl.test.ts`

- [ ] **Step 1: 写失败测试（用注入避免依赖真实 DOM）**

Create `src/utils/webgl.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { hasWebGL } from './webgl';

describe('hasWebGL', () => {
  it('能拿到 webgl context 时返回 true', () => {
    const fakeCanvas = { getContext: (k: string) => (k.includes('webgl') ? {} : null) };
    expect(hasWebGL(() => fakeCanvas as unknown as HTMLCanvasElement)).toBe(true);
  });

  it('拿不到 context 时返回 false', () => {
    const fakeCanvas = { getContext: () => null };
    expect(hasWebGL(() => fakeCanvas as unknown as HTMLCanvasElement)).toBe(false);
  });

  it('创建 canvas 抛错时返回 false（不崩溃）', () => {
    expect(
      hasWebGL(() => {
        throw new Error('no document');
      }),
    ).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL —— 无法解析 `./webgl`。

- [ ] **Step 3: 实现**

Create `src/utils/webgl.ts`：

```ts
// WebGL 能力探测。makeCanvas 可注入，便于单测。
export function hasWebGL(
  makeCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): boolean {
  try {
    const canvas = makeCanvas();
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test`
Expected: PASS（3 个测试绿）。

- [ ] **Step 5: Commit**

```bash
git add src/utils/webgl.ts src/utils/webgl.test.ts
git commit -m "feat(3dmap): WebGL 能力探测 hasWebGL"
```

---

## Task 7: 单棵树组件 `SubsectionTree.tsx`

绘本风圆树：树干（圆柱）+ 树冠（堆叠球）+ 投影盘 + 悬停/点击交互。视觉组件，用构建 + 手测验证（非单测）。

**Files:**
- Create: `src/components/forest3d/SubsectionTree.tsx`

- [ ] **Step 1: 实现组件**

Create `src/components/forest3d/SubsectionTree.tsx`：

```tsx
import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

export type SubsectionTreeProps = {
  position: [number, number, number];
  scale: number;
  accent: string;
  dark: string;
  lit: boolean; // 已读 → 饱满；未读 → 偏小、低饱和
  onClick: () => void;
  onHover: (hovering: boolean) => void;
};

export default function SubsectionTree({
  position,
  scale,
  accent,
  dark,
  lit,
  onClick,
  onHover,
}: SubsectionTreeProps) {
  const [hovered, setHovered] = useState(false);
  const grown = lit ? 1 : 0.72; // 未读偏幼苗
  const s = scale * grown * (hovered ? 1.12 : 1);
  const crownColor = lit ? accent : dark;
  const crownOpacity = lit ? 1 : 0.78;

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(true);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    onHover(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position}>
      {/* 投影盘 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5 * s, 24]} />
        <meshBasicMaterial color="#1f3d27" transparent opacity={0.18} />
      </mesh>
      {/* 交互组：树干 + 树冠 */}
      <group
        scale={[s, s, s]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#8a6239" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
        <mesh position={[-0.32, 0.95, 0.1]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
        <mesh position={[0.32, 0.98, -0.05]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
      </group>
    </group>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 通过（组件类型正确；尚未被引用，tree-shaking 警告可忽略）。

- [ ] **Step 3: Commit**

```bash
git add src/components/forest3d/SubsectionTree.tsx
git commit -m "feat(3dmap): 绘本风单棵树组件 SubsectionTree"
```

---

## Task 8: 区域地块与曲线分界 `ChapterRegion.tsx`

区域 = 平铺彩色地块（精确矩形）。分界曲线单独画。

**Files:**
- Create: `src/components/forest3d/ChapterRegion.tsx`

- [ ] **Step 1: 实现组件**

Create `src/components/forest3d/ChapterRegion.tsx`。注意：归一化坐标 → 世界坐标的映射函数 `toWorld` 由父级传入，保证全场景一致。

```tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Region, Divider } from '../../data/forestLayout';

export type ToWorld = (x: number, z: number) => [number, number];

// 区域地块：用矩形四角在 XZ 平面建面，y 微抬避免 z-fighting。
export function ChapterRegionPatch({ region, toWorld }: { region: Region; toWorld: ToWorld }) {
  const geometry = useMemo(() => {
    const r = region.rect;
    const [x0, z0] = toWorld(r.x, r.z);
    const [x1, z1] = toWorld(r.x + r.w, r.z + r.d);
    const shape = new THREE.Shape();
    shape.moveTo(x0, z0);
    shape.lineTo(x1, z0);
    shape.lineTo(x1, z1);
    shape.lineTo(x0, z1);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2); // XY shape → XZ 平面
    return geo;
  }, [region, toWorld]);

  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
      <meshStandardMaterial color={region.soft} roughness={1} />
    </mesh>
  );
}

// 单条分界线：把直线切分点沿法向加正弦抖动 → 曲线，再建一条略抬起的细带。
export function RegionDividerCurve({
  divider,
  toWorld,
  seed,
}: {
  divider: Divider;
  toWorld: ToWorld;
  seed: number;
}) {
  const points = useMemo(() => {
    const [ax, az] = divider.a;
    const [bx, bz] = divider.b;
    const segs = 24;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len; // 法向
    const nz = dx / len;
    const amp = 0.018; // 归一化抖动幅度（< INSET，树不会越界）
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const wob = Math.sin(t * Math.PI * 3 + seed) * amp * Math.sin(t * Math.PI); // 端点收敛
      const lx = ax + dx * t + nx * wob;
      const lz = az + dz * t + nz * wob;
      const [wx, wz] = toWorld(lx, lz);
      pts.push(new THREE.Vector3(wx, 0.03, wz));
    }
    return pts;
  }, [divider, toWorld, seed]);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 40, 0.06, 6, false);
  }, [points]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ffffff" roughness={0.6} transparent opacity={0.85} />
    </mesh>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add src/components/forest3d/ChapterRegion.tsx
git commit -m "feat(3dmap): 区域地块 ChapterRegionPatch + 曲线分界 RegionDividerCurve"
```

---

## Task 9: 3D 世界 `ForestMapScene.tsx`

`<Canvas>` + 相机 + MapControls + 光照 + 地面 + 区域 + 分界 + 树 + 区域标签 + 悬停预览（drei `<Html>`）。

**Files:**
- Create: `src/components/forest3d/ForestMapScene.tsx`

- [ ] **Step 1: 实现组件**

Create `src/components/forest3d/ForestMapScene.tsx`：

```tsx
import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ForestLayout } from '../../data/forestLayout';
import { hashSeed } from '../../data/prng';
import SubsectionTree from './SubsectionTree';
import { ChapterRegionPatch, RegionDividerCurve, type ToWorld } from './ChapterRegion';

const MAP_W = 20;
const MAP_D = 14;

export type SceneProps = {
  layout: ForestLayout;
  litPointIds: Set<string>;
  onPickPoint: (pointId: string) => void;
  pointMeta: Record<string, { title: string; summary: string; chapterTitle: string }>;
};

export default function ForestMapScene({ layout, litPointIds, onPickPoint, pointMeta }: SceneProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const toWorld: ToWorld = useMemo(
    () => (x: number, z: number) => [(x - 0.5) * MAP_W, (z - 0.5) * MAP_D],
    [],
  );

  const hoverTree = hoverId ? layout.trees.find((t) => t.pointId === hoverId) : null;

  return (
    <Canvas
      frameloop="demand"
      shadows
      camera={{ position: [0, 16, 15], fov: 42 }}
      style={{ position: 'absolute', inset: 0 }}
      onPointerMissed={() => setHoverId(null)}
    >
      <color attach="background" args={['#cfe7ef']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 14, 6]} intensity={0.9} castShadow />

      {/* 地面（比地图略大） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP_W + 6, MAP_D + 6]} />
        <meshStandardMaterial color="#bfe0a0" roughness={1} />
      </mesh>

      {layout.regions.map((r) => (
        <ChapterRegionPatch key={r.chapterId} region={r} toWorld={toWorld} />
      ))}
      {layout.dividers.map((d, i) => (
        <RegionDividerCurve key={i} divider={d} toWorld={toWorld} seed={i * 1.7} />
      ))}

      {/* 区域标签 */}
      {layout.regions.map((r, i) => {
        const [wx, wz] = toWorld(r.centroid.x, r.centroid.z);
        return (
          <Html key={r.chapterId} position={[wx, 0.5, wz]} center distanceFactor={22} occlude={false}>
            <div className="forest3d-region-label" style={{ color: r.dark }}>
              {i + 1}. {r.title}
            </div>
          </Html>
        );
      })}

      {/* 树 */}
      {layout.trees.map((t) => {
        const [wx, wz] = toWorld(t.x, t.z);
        return (
          <SubsectionTree
            key={t.pointId}
            position={[wx, 0, wz]}
            scale={t.scale}
            accent={t.accent}
            dark={t.dark}
            lit={litPointIds.has(t.pointId)}
            onClick={() => onPickPoint(t.pointId)}
            onHover={(h) => setHoverId(h ? t.pointId : (cur) => (cur === t.pointId ? null : cur) as never)}
          />
        );
      })}

      {/* 悬停预览卡（单张） */}
      {hoverTree && pointMeta[hoverTree.pointId] && (
        <Html
          position={[toWorld(hoverTree.x, hoverTree.z)[0], 2.2, toWorld(hoverTree.x, hoverTree.z)[1]]}
          center
          distanceFactor={18}
          style={{ pointerEvents: 'none' }}
        >
          <div className="forest3d-preview-card">
            <div className="forest3d-preview-title">{pointMeta[hoverTree.pointId].chapterTitle} · {pointMeta[hoverTree.pointId].title}</div>
            <div className="forest3d-preview-summary">{pointMeta[hoverTree.pointId].summary}</div>
            <div className="forest3d-preview-cta">点击进入阅读 →</div>
          </div>
        </Html>
      )}

      <MapControls
        enableRotate={false}
        screenSpacePanning={false}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.4}
        minPolarAngle={Math.PI / 5}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
```

> 注：`onHover` 的回调签名需简单稳定。修正实现见下一步——把 hover 清除逻辑收敛到组件内。

- [ ] **Step 2: 修正 onHover 逻辑（避免函数式 setState 的类型 hack）**

把上面 `onHover` 那行替换为清晰版本：

```tsx
            onHover={(h) => {
              if (h) setHoverId(t.pointId);
              else setHoverId((cur) => (cur === t.pointId ? null : cur));
            }}
```

- [ ] **Step 3: 验证构建**

Run: `npm run build`
Expected: 通过。若 drei 的 `MapControls`/`Html` 类型报错，确认 `@react-three/drei` 已安装且版本与 R3F v9 兼容。

- [ ] **Step 4: Commit**

```bash
git add src/components/forest3d/ForestMapScene.tsx
git commit -m "feat(3dmap): 3D 世界 ForestMapScene（相机/光照/区域/树/预览）"
```

---

## Task 10: DOM 覆盖层 `ForestMapOverlay.tsx`

顶栏（返回书架 + 进度）与操作提示。预览卡已在场景内用 `<Html>` 实现，此处只做固定 UI。

**Files:**
- Create: `src/components/forest3d/ForestMapOverlay.tsx`

- [ ] **Step 1: 实现组件**

Create `src/components/forest3d/ForestMapOverlay.tsx`：

```tsx
import { Link } from 'react-router-dom';

export type OverlayProps = { litCount: number; total: number };

export default function ForestMapOverlay({ litCount, total }: OverlayProps) {
  return (
    <>
      <header className="forest3d-topbar">
        <Link to="/" className="forest3d-back">← 返回书架</Link>
        <span className="forest3d-title">知识森林地图</span>
        <span className="forest3d-progress" aria-label={`已点亮 ${litCount} / ${total} 个知识点`}>
          已点亮 {litCount}/{total}
        </span>
      </header>
      <div className="forest3d-hint" aria-hidden="true">
        🖱 滚轮缩放 · 拖拽平移 · 点树进入小节
      </div>
    </>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add src/components/forest3d/ForestMapOverlay.tsx
git commit -m "feat(3dmap): DOM 覆盖层 ForestMapOverlay（顶栏+提示）"
```

---

## Task 11: 错误边界 `ForestErrorBoundary.tsx`

**Files:**
- Create: `src/components/forest3d/ForestErrorBoundary.tsx`

- [ ] **Step 1: 实现**

Create `src/components/forest3d/ForestErrorBoundary.tsx`：

```tsx
import { Component, type ReactNode } from 'react';

type Props = { fallback: ReactNode; children: ReactNode };
type State = { hasError: boolean };

export default class ForestErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // 3D 渲染失败时降级，不打断学习主链路。
    console.warn('Forest 3D map failed, falling back to 2D trail.', error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add src/components/forest3d/ForestErrorBoundary.tsx
git commit -m "feat(3dmap): 渲染错误边界 ForestErrorBoundary"
```

---

## Task 12: `/ai` 入口 `ForestMapPage.tsx`

组合：WebGL 探测 → 不支持直接降级；支持则 error boundary 包 3D 场景，fallback 仍为 `ChapterMapPage`。算 lit 集合与预览元数据。

**Files:**
- Create: `src/components/ForestMapPage.tsx`

- [ ] **Step 1: 实现**

Create `src/components/ForestMapPage.tsx`：

```tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { chapters, orderedPoints, chapterPoints, findChapter, readLastPoint, pointPath } from '../data/courseNav';
import { buildForestLayout } from '../data/forestLayout';
import { hasWebGL } from '../utils/webgl';
import ChapterMapPage from './ChapterMapPage';
import ForestErrorBoundary from './forest3d/ForestErrorBoundary';
import ForestMapScene from './forest3d/ForestMapScene';
import ForestMapOverlay from './forest3d/ForestMapOverlay';

export default function ForestMapPage() {
  const supported = useMemo(() => hasWebGL(), []);

  const layout = useMemo(() => {
    const pointsByChapter: Record<string, { id: string }[]> = {};
    for (const c of chapters) pointsByChapter[c.id] = chapterPoints(c.id);
    return buildForestLayout(chapters, pointsByChapter);
  }, []);

  const { litPointIds, litCount, pointMeta } = useMemo(() => {
    const lastId = readLastPoint();
    const lastIdx = lastId ? orderedPoints.findIndex((p) => p.id === lastId) : -1;
    const lit = new Set<string>();
    for (let i = 0; i <= lastIdx; i++) lit.add(orderedPoints[i].id);
    const meta: Record<string, { title: string; summary: string; chapterTitle: string }> = {};
    for (const p of orderedPoints) {
      meta[p.id] = {
        title: p.title,
        summary: p.shortSummary,
        chapterTitle: findChapter(p.clusterId)?.title ?? '',
      };
    }
    return { litPointIds: lit, litCount: lastIdx + 1, pointMeta: meta };
  }, []);

  const navigate = useNavigate();
  const onPickPoint = (pointId: string) => {
    const point = orderedPoints.find((p) => p.id === pointId);
    if (point) navigate(pointPath(point));
  };

  if (!supported) {
    return <ChapterMapPage />;
  }

  return (
    <main id="main-content" className="forest3d-page">
      <ForestErrorBoundary fallback={<ChapterMapPage />}>
        <ForestMapScene
          layout={layout}
          litPointIds={litPointIds}
          onPickPoint={onPickPoint}
          pointMeta={pointMeta}
        />
        <ForestMapOverlay litCount={litCount} total={orderedPoints.length} />
      </ForestErrorBoundary>
    </main>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `npm run build`
Expected: 通过。

- [ ] **Step 3: Commit**

```bash
git add src/components/ForestMapPage.tsx
git commit -m "feat(3dmap): /ai 入口 ForestMapPage（WebGL 探测+降级+进度）"
```

---

## Task 13: 接线路由 + 样式

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: 改路由**

在 `src/App.tsx`：把 `import ChapterMapPage from './components/ChapterMapPage';` 下方新增 `import ForestMapPage from './components/ForestMapPage';`，并把
`<Route path="/ai" element={<ChapterMapPage />} />`
改为
`<Route path="/ai" element={<ForestMapPage />} />`。
（保留 `ChapterMapPage` 的 import —— 它仍被 `ForestMapPage` 作为降级引用。若 lint 报未使用可直接删除该顶层 import，因为 `App.tsx` 不再直接用它。）

- [ ] **Step 2: 加样式**

在 `src/styles.css` 末尾追加：

```css
/* ── 3D 知识森林地图 ── */
.forest3d-page {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #cfe7ef;
}
.forest3d-topbar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 48px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(6px);
  z-index: 10;
}
.forest3d-back { font-weight: 700; color: #2e5d3a; text-decoration: none; }
.forest3d-title { font-weight: 600; color: #5a7a5f; }
.forest3d-progress { margin-left: auto; font-weight: 700; color: #2e5d3a; }
.forest3d-hint {
  position: absolute;
  left: 18px; bottom: 16px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  color: #5a7a5f;
  z-index: 10;
}
.forest3d-region-label {
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
  pointer-events: none;
}
.forest3d-preview-card {
  width: 200px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #cde0c4;
  box-shadow: 0 6px 18px rgba(31, 61, 39, 0.18);
}
.forest3d-preview-title { font-weight: 700; font-size: 13px; color: #1f3d27; }
.forest3d-preview-summary { margin-top: 4px; font-size: 11.5px; color: #5a7a5f; line-height: 1.4; }
.forest3d-preview-cta { margin-top: 6px; font-size: 11.5px; font-weight: 700; color: #3f8a55; }

@media (prefers-reduced-motion: reduce) {
  .forest3d-page * { transition: none !important; }
}
```

- [ ] **Step 3: 验证构建**

Run: `npm run build`
Expected: 通过。

- [ ] **Step 4: 手动验证（关键）**

Run: `npm run dev`，浏览器开 `/#/ai`。确认：① 看到斜俯瞰矩形森林、8 块不同色区域、曲线分界；② 滚轮缩放、拖拽平移可用；③ 悬停树出预览卡、光标变手型；④ 点树跳到对应 `/ai/:chapterId/:pointId` 阅读页；⑤ 顶栏进度显示正确。

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/styles.css
git commit -m "feat(3dmap): /ai 切换到 3D 森林地图入口 + 样式"
```

---

## Task 14: Playwright 冒烟测试

**Files:**
- Create: `tests/forest-map.spec.ts`

- [ ] **Step 1: 写测试**

Create `tests/forest-map.spec.ts`：

```ts
import { test, expect } from '@playwright/test';

// 需先 `npm run dev`（或在 playwright.config 中配置 webServer）。默认 baseURL http://localhost:5173。
test('森林地图加载并能进入阅读页', async ({ page }) => {
  await page.goto('/#/ai');
  // Canvas 挂载
  await expect(page.locator('canvas')).toBeVisible();
  // 顶栏进度可见
  await expect(page.getByText(/已点亮 \d+\/\d+/)).toBeVisible();
  // 返回书架链接存在
  await expect(page.getByText('← 返回书架')).toBeVisible();
});
```

> 若仓库无 `playwright.config.ts`，本步同时创建一份最小配置：`baseURL: 'http://localhost:5173'`，并用 `webServer` 启动 `npm run dev`。点击 canvas 内 3D 物体的坐标命中较脆，冒烟先验证挂载与降级链路；树点击的导航在 Task 13 Step 4 手测覆盖。

- [ ] **Step 2: 运行冒烟（需要 dev server）**

Run: `npx playwright test tests/forest-map.spec.ts`
Expected: PASS（canvas 与顶栏可见）。

- [ ] **Step 3: Commit**

```bash
git add tests/forest-map.spec.ts playwright.config.ts
git commit -m "test(3dmap): 森林地图加载冒烟"
```

---

## Task 15: 收尾验证

- [ ] **Step 1: 全量单测**

Run: `npm test`
Expected: prng / forestLayout / webgl 全绿。

- [ ] **Step 2: 生产构建**

Run: `npm run build`
Expected: `tsc -b && vite build` 通过，产物进 `dist/`。

- [ ] **Step 3: 手测降级**（可选但推荐）

临时在 `ForestMapPage` 把 `const supported = useMemo(() => hasWebGL(), [])` 改成 `false`，确认 `/ai` 渲染回现有 2D 长卷且可点进知识点；验证后改回。

- [ ] **Step 4: 更新当前状态文档**

按 `docs/requirements/` 流程，在合适的轮次文档「执行反馈」记录本次 3D 地图重构（替换 `/ai`、保留长卷为降级、新增依赖与布局器、进度叙事延续）。不直接改写 `current_state.md`，除非用户要求。

---

## Self-Review

**Spec coverage：**
- §1 目标（矩形/曲线分界/铺满/树=小节/斜俯瞰/缩放平移/悬停/点击/进度）→ Task 3–5（布局）、7–9（视觉+交互）、10/12（进度）✓
- §2 决策（替换/进度保留/降级/r3f/绘本风/确定性）→ Task 12（替换+降级）、13（路由）、7（绘本树）、2/5（确定性）✓
- §3 三层架构 → Task 9（场景）/10（覆盖层）/12（入口）✓
- §4 forestLayout 纯函数 + 4 类单测 → Task 3–5 测试覆盖确定性/树数/落区/镶嵌 ✓
- §5 相机交互 → Task 9 MapControls + 悬停 + 点击 ✓
- §6 美术风格 → Task 7 + 13 样式 ✓
- §7 进度叙事 → Task 12 lit 集合 + Task 10 顶栏 ✓
- §8 降级/移动/性能/reduced-motion → Task 6/11/12（降级）、9 `frameloop=demand`、13 媒体查询 ✓
- §9 文件清单 → 与本计划文件一一对应 ✓
- §10 测试 → Task 14/15 ✓

**Placeholder scan：** 无 TBD/TODO；每个改代码的步骤含完整代码。Task 14 的 playwright.config 给了明确最小配置要求。

**Type consistency：** `Rect{x,z,w,d}`、`Pt{x,z}`、`Region`、`Tree`、`Divider`、`ForestLayout` 跨 Task 3/4/5/8/9 一致；`buildForestLayout(chapters, pointsByChapter)`、`scatterTrees(rect,n,seed)`、`partitionRect(items,rect)`、`hasWebGL(makeCanvas?)`、`toWorld(x,z)` 签名跨任务一致；`ChapterRegionPatch`/`RegionDividerCurve` 命名在 Task 8 定义、Task 9 引用一致。

**修正记录：** Task 9 Step 1 初版 `onHover` 用了 `as never` 类型 hack，已在 Step 2 明确替换为清晰的条件式 setState。
