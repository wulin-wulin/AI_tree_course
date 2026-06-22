# 森林视图对齐参考项目 Implementation Plan（子工程②-重做）

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans。Steps 用 checkbox 跟踪。

**Goal:** 把 `/ai` 森林页重做成与参考项目 `ai-knowledge-forest` 一致的观感：深色主题、透视倾斜 3D 视角、地面平面、按簇着色的区域多边形 + 簇标签、密度可见性的 3D 树、顶部搜索 + 区域选择、左下图例；不要道路。点击树仍用我们的详情面板/阅读页。

**Architecture:** 直接复用参考项目的 `scene3d.js` + `tree_factory.js`（拷入 `src/forest/vendor/`）。管线新增**簇区域多边形**；前端用 `forestAdapter` 把我们的 `index.json` 适配成 Scene3D 需要的 `layout`/`data` 结构；`ForestMapPage` 渲染深色 chrome（顶栏/搜索/区域选择/图例）并启动 Scene3D，点击 → 我们的 `ForestPointPanel`。

**Tech Stack:** Three.js（已装）、React、Vite、TS + 复用参考的原生 JS 模块。验证以 `npm run build` + Playwright 截图与参考项目并排比对。

## Global Constraints

- 深色主题**仅作用于森林页**（`.forest-parity-page` 作用域），首页/阅读页保持现有浅色。
- 数据来自 `src/data/index.json`（簇含 polygon）+ `points/*.json`；不接后端。
- 点击详情用我们的 `ForestPointPanel` + “进入阅读页”，不移植参考的 facet 弹窗。
- `npm run build` 必须通过。

---

### Task 1: 管线新增簇区域多边形 + 标签位

**Files:**
- Modify: `scripts/lib/layout.mjs`
- Modify: `scripts/lib/layout.test.mjs`
- Modify: `scripts/build_knowledge.mjs`

- [ ] **Step 1: 扩展 layout 测试**

在 `layout.test.mjs` 增加：
```js
test('返回簇区域多边形与标签位', () => {
  const { regions } = layoutByCluster(pts, { withRegions: true });
  assert.ok(regions.c1 && regions.c1.polygon.length >= 4);
  assert.ok(Array.isArray(regions.c1.labelPos) && regions.c1.labelPos.length === 2);
});
```
（注：把现有调用 `layoutByCluster(pts)` 仍返回 Map 的行为保留；新增可选返回需调整签名见下。）

- [ ] **Step 2: 改 `layoutByCluster` 返回结构**

把返回值从 `Map` 改为 `{ positions: Map, regions: Record<clusterId,{polygon,labelPos}> }`，并更新原有测试取 `.positions`。每个簇的 region polygon = 其网格 cell 矩形（带内边距），labelPos = cell 顶部中心。
在 `layout.mjs` 的 `clusterIds.forEach` 内，记录每簇 cell：
```js
const pad = Math.min(cellW, cellH) * 0.04;
regions[cid] = {
  polygon: [
    [ox + pad, oy + pad], [ox + cellW - pad, oy + pad],
    [ox + cellW - pad, oy + cellH - pad], [ox + pad, oy + cellH - pad],
  ],
  labelPos: [ox + cellW / 2, oy + cellH * 0.16],
};
```
函数末尾 `return { positions: result, regions };`。
更新 `layout.test.mjs` 中原有用例：`const { positions } = layoutByCluster(pts);` 再 `positions.get(...)`。

- [ ] **Step 3: build_knowledge 写入 polygon**

`build_knowledge.mjs` 第 4 步改为：
```js
const { positions, regions } = layoutByCluster(merged);
for (const p of merged) {
  const l = positions.get(p.id);
  p.pos = l.pos; p.scale = l.scale;
}
```
写 index 时给每个 cluster 注入 polygon/labelPos：
```js
const index = {
  schema_version: '1.0',
  clusters: clusters.map((c) => ({ ...c, polygon: regions[c.id]?.polygon ?? [], labelPos: regions[c.id]?.labelPos ?? [2000, 1500] })),
  points: [],
};
```

- [ ] **Step 4: 测试 + 重建数据**

Run: `npm run test:pipeline`（全过）
Run: `npm run build:knowledge`（产出 603 点/23 簇，校验通过；`src/data/index.json` 的 clusters 现含 polygon）

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/layout.mjs scripts/lib/layout.test.mjs scripts/build_knowledge.mjs src/data/index.json src/data/points
git commit -m "feat(pipeline): 簇区域多边形+标签位写入index.json"
```

---

### Task 2: 拷入参考的 scene3d + tree_factory（vendor）

**Files:**
- Create: `src/forest/vendor/tree_factory.js`（拷自参考）
- Create: `src/forest/vendor/scene3d.js`（拷自参考）

- [ ] **Step 1: 拷贝文件**

```bash
mkdir -p src/forest/vendor
cp /Users/yzs/Desktop/ai-knowledge-forest/web/js/tree_factory.js src/forest/vendor/tree_factory.js
cp /Users/yzs/Desktop/ai-knowledge-forest/web/js/scene3d.js src/forest/vendor/scene3d.js
```

- [ ] **Step 2: 确认 import 兼容**

`scene3d.js` 顶部 `import * as THREE from "three";` 与 `import { createTree } from "./tree_factory.js";` 在我们的 Vite + 已装 three 下可解析，无需改。
（vendor 为 .js，TS 不强校验；若 `tsc -b` 因 allowJs:false 跳过 .js，正常。）

- [ ] **Step 3: 提交**

```bash
git add src/forest/vendor/
git commit -m "chore(forest): vendor 参考项目 scene3d + tree_factory"
```

---

### Task 3: 数据适配器（我们的 index.json → Scene3D 的 layout/data）

**Files:**
- Create: `src/forest/forestAdapter.ts`
- Test: `src/forest/forestAdapter.test.mjs`

**Interfaces:**
- Produces: `buildSceneInputs(index): { layout, data }`
  - `layout = { canvas:{width:4000,height:3000}, points:[{id,pos,scale}], domains:[{id,polygon,color,label_pos}], categories:[], levels:[] }`
  - `data = { index:{domains:[{id,name_zh}], categories:[{id,domain_id}]}, layout, kpById, catById, domById, kpsByCat, kpsByDom }`
  - 每个簇同时充当 reference 的 domain 与 category（catId == domId == clusterId）。

- [ ] **Step 1: 写测试（先失败）**

`src/forest/forestAdapter.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSceneInputs } from './forestAdapter.ts';

const idx = {
  clusters: [{ id: 'cnn', title: '卷积神经网络', accent: '#d6457a', polygon: [[0,0],[10,0],[10,10],[0,10]], labelPos: [5,2] }],
  points: [{ id: 'lenet', clusterId: 'cnn', pos: [3,3], scale: 1.2, importance: 0.5 }],
};

test('layout.domains 来自簇并带 polygon/color', () => {
  const { layout } = buildSceneInputs(idx);
  assert.equal(layout.domains[0].id, 'cnn');
  assert.equal(layout.domains[0].color, '#d6457a');
  assert.equal(layout.domains[0].polygon.length, 4);
});

test('data 索引齐全', () => {
  const { data } = buildSceneInputs(idx);
  assert.equal(data.kpById.lenet.category_id, 'cnn');
  assert.equal(data.catById.cnn.domain_id, 'cnn');
  assert.equal(data.domById.cnn.name_zh, '卷积神经网络');
  assert.equal(data.kpsByCat.cnn.length, 1);
  assert.equal(data.kpsByDom.cnn.length, 1);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test src/forest/forestAdapter.test.mjs` → FAIL

- [ ] **Step 3: 实现 `src/forest/forestAdapter.ts`**

```ts
import type { ForestIndex } from './forestData';

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
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test src/forest/forestAdapter.test.mjs` → 2 PASS

- [ ] **Step 5: 提交**

```bash
git add src/forest/forestAdapter.ts src/forest/forestAdapter.test.mjs
git commit -m "feat(forest): index.json → Scene3D layout/data 适配器"
```

---

### Task 4: ForestMapPage 重做（深色 chrome + Scene3D + 我们的详情）

**Files:**
- Rewrite: `src/components/ForestMapPage.tsx`
- Delete: `src/forest/ForestScene.ts`、`src/forest/treeFactory.ts`、`src/forest/treeFactory.test.mjs`（被 vendor 取代）
- Modify: `src/styles.css`（追加 `.forest-parity-*` 深色作用域样式）

**Interfaces:**
- Consumes: `vendor/scene3d.js` 的 `Scene3D`、`forestAdapter.buildSceneInputs`、`forestData.loadPoint`、`ForestPointPanel`、`index.json`

- [ ] **Step 1: 删除被取代的旧实现**

```bash
git rm src/forest/ForestScene.ts src/forest/treeFactory.ts src/forest/treeFactory.test.mjs
```

- [ ] **Step 2: 重写 `src/components/ForestMapPage.tsx`**

```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-expect-error vendor JS（参考项目原样）
import { Scene3D } from '../forest/vendor/scene3d.js';
import { buildSceneInputs } from '../forest/forestAdapter';
import { loadPoint, type ForestIndex, type FullPoint, type ClusterMeta } from '../forest/forestData';
import indexJson from '../data/index.json';
import ForestPointPanel from './ForestPointPanel';

const FOREST_INDEX = indexJson as unknown as ForestIndex & { clusters: any[]; points: any[] };

function ForestMapPage() {
  const index = FOREST_INDEX;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [point, setPoint] = useState<FullPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const clusterById = useMemo(() => {
    const m: Record<string, ClusterMeta> = {};
    for (const c of index.clusters) m[c.id] = c as ClusterMeta;
    return m;
  }, [index]);

  const countByCluster = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of index.points) m[p.clusterId] = (m[p.clusterId] || 0) + 1;
    return m;
  }, [index]);

  // 启动 Scene3D
  useEffect(() => {
    if (!containerRef.current) return;
    const { layout, data } = buildSceneInputs(index);
    const scene = new Scene3D(containerRef.current, layout, data);
    sceneRef.current = scene;

    let raf = 0;
    const loop = () => { raf = requestAnimationFrame(loop); scene.render(); };
    loop();
    const onResize = () => scene.resize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
    window.addEventListener('resize', onResize);
    requestAnimationFrame(onResize);

    // 点击拾取
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.forest-detail-panel, #forest-topbar, #forest-legend')) return;
      const id = scene.raycast(e.clientX, e.clientY);
      if (id) setSelectedId(id);
    };
    containerRef.current.addEventListener('click', onClick);
    const el = containerRef.current;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('click', onClick);
    };
  }, [index]);

  // 选中 → 高亮 + 懒加载详情
  useEffect(() => {
    sceneRef.current?.highlightTree?.(selectedId);
    if (!selectedId) { setPoint(null); sceneRef.current?.unhighlightAll?.(); return; }
    sceneRef.current?.flyTo?.(selectedId);
    let alive = true;
    setLoading(true);
    loadPoint(selectedId)
      .then((p) => { if (alive) { setPoint(p); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedId]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.points
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, index]);

  const selectedClusterId = point?.clusterId ?? index.points.find((p) => p.id === selectedId)?.clusterId;

  return (
    <main id="main-content" className="forest-parity-page" aria-label="人工智能知识森林">
      <header id="forest-topbar">
        <Link className="forest-home-link" to="/">← 书架</Link>
        <h1>AI 知识森林</h1>
        <div className="forest-search">
          <input
            type="text"
            placeholder="搜索知识点…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length ? (
            <div className="forest-search-results">
              {results.map((r) => (
                <button key={r.id} type="button" onClick={() => { setSelectedId(r.id); setQuery(''); }}>
                  <strong>{r.title}</strong>
                  <small>{clusterById[r.clusterId]?.title}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <select
          className="forest-region-select"
          value=""
          onChange={(e) => { const c = e.target.value; if (c) sceneRef.current?.flyTo?.(c); }}
        >
          <option value="">— 跳到知识簇 —</option>
          {index.clusters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button type="button" className="forest-reset" title="重置视图" onClick={() => sceneRef.current?.resetView?.()}>⟳</button>
      </header>

      <div id="forest-canvas-container" ref={containerRef} />

      <div id="forest-legend">
        <h4>知识簇</h4>
        <div className="forest-legend-list">
          {index.clusters.map((c) => (
            <button key={c.id} type="button" className="forest-legend-item" onClick={() => sceneRef.current?.flyTo?.(c.id)}>
              <span className="forest-legend-color" style={{ background: c.accent }} />
              {c.title} <small>({countByCluster[c.id] || 0})</small>
            </button>
          ))}
        </div>
      </div>

      {selectedId ? (
        <ForestPointPanel
          point={point}
          cluster={selectedClusterId ? clusterById[selectedClusterId] : undefined}
          loading={loading}
          readingHref={selectedId && selectedClusterId ? `#/ai/${selectedClusterId}/${selectedId}` : undefined}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </main>
  );
}

export default ForestMapPage;
```

- [ ] **Step 3: 追加深色作用域样式到 `src/styles.css`**

```css
/* —— 森林对齐参考项目（深色，仅本页作用域） —— */
.forest-parity-page { position: fixed; inset: 0; background: #0f0f23; color: #f0f0f0; overflow: hidden; }
#forest-topbar {
  position: absolute; top: 0; left: 0; right: 0; z-index: 100; height: 48px;
  display: flex; align-items: center; gap: 16px; padding: 8px 16px;
  background: rgba(15,15,35,0.92); backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
#forest-topbar h1 { font-size: 18px; font-weight: 700; color: #7EC8A4; white-space: nowrap; }
.forest-home-link { color: #ccc; text-decoration: none; font-size: 13px; }
.forest-home-link:hover { color: #fff; }
.forest-search { flex: 1; max-width: 400px; position: relative; }
.forest-search input {
  width: 100%; padding: 6px 14px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06);
  color: #fff; font-size: 14px; outline: none;
}
.forest-search input:focus { border-color: #7EC8A4; }
.forest-search-results {
  position: absolute; top: 38px; left: 0; right: 0; max-height: 360px; overflow-y: auto;
  background: rgba(20,20,40,0.97); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; z-index: 200;
}
.forest-search-results button {
  display: flex; gap: 10px; align-items: center; width: 100%; text-align: left;
  padding: 8px 14px; background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.05);
  color: #eee; cursor: pointer;
}
.forest-search-results button:hover { background: rgba(126,200,164,0.15); }
.forest-search-results strong { font-size: 13px; flex: 1; }
.forest-search-results small { font-size: 11px; color: #999; }
.forest-region-select {
  padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
  background: #1a1a2e; color: #ddd; font-size: 13px; outline: none; max-width: 200px;
}
.forest-reset {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06); color: #ccc; font-size: 16px; cursor: pointer;
}
.forest-reset:hover { background: rgba(255,255,255,0.12); }
#forest-canvas-container { position: absolute; top: 48px; left: 0; right: 0; bottom: 0; overflow: hidden; cursor: grab; }
#forest-legend {
  position: absolute; bottom: 12px; left: 12px; z-index: 50;
  background: rgba(15,15,35,0.85); backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px;
  font-size: 12px; max-height: 46vh; overflow-y: auto;
}
#forest-legend h4 { margin-bottom: 6px; font-size: 12px; color: #999; }
.forest-legend-item {
  display: flex; align-items: center; gap: 8px; padding: 2px 0; width: 100%;
  background: none; border: none; color: #ddd; font-size: 12px; cursor: pointer; text-align: left;
}
.forest-legend-item:hover { color: #fff; }
.forest-legend-color { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.forest-legend-item small { color: #666; }
/* 森林页详情面板转深色 */
.forest-parity-page .forest-detail-panel {
  background: rgba(18,18,40,0.97); color: #e8e8e8; border-top-color: var(--detail-accent);
}
.forest-parity-page .forest-detail-section p,
.forest-parity-page .forest-detail-section ul { color: #d0d0d0; }
.forest-parity-page .forest-detail-summary { color: #aaa; }
.forest-parity-page .forest-detail-close { color: #aaa; }
```

- [ ] **Step 4: 构建**

Run: `npm run build`
Expected: `tsc -b && vite build` 通过（vendor .js 不被 tsc 严格检查；`@ts-expect-error` 抑制 Scene3D 导入类型）。

- [ ] **Step 5: 截图比对**

Run: `node .agents/scripts/shot-forest.mjs`
查看 `.agents/artifacts/screenshots/forest-overview.png`，与 `REFERENCE-overview.png` 并排比对：应同为深色、倾斜 3D、地面 + 区域 + 簇标签 + 立体树；点击树出我们的详情面板。按差异微调相机初值/颜色/标签。

- [ ] **Step 6: 提交**

```bash
git add src/components/ForestMapPage.tsx src/styles.css src/forest/
git commit -m "feat(forest): /ai 重做为参考项目同款深色倾斜3D森林(Scene3D+chrome)"
```

---

## 完成后
- 回写 R010 子工程②（重做）执行反馈。
- `npm run test:forest` 现仅含 forestData + forestAdapter 测试。

## Self-Review
- 覆盖：深色/倾斜3D/地面/区域/标签/图例/搜索 → 复用 Scene3D + chrome（T2/T4）；区域多边形 → T1；数据适配 → T3；点击用我们的详情 → T4 wire。✅
- 占位：无。✅
- 风险：Scene3D 为参考原生 JS，`raycast/flyTo/highlightTree/resetView` 公共方法直接调用；`layout.categories=[]`/`levels=[]` 时其内部 `_currentLevel=-1` 分支安全（已读源码确认 guard）。截图比对兜底视觉差异。
