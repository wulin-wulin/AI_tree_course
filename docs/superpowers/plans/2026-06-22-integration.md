# 接线整合 Implementation Plan（子工程 ③）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把阅读链路统一到 603 点数据集：`courseNav` 改读 `index.json`（全 603 点的导航元数据），`ReadingPage` 懒加载单点完整内容，森林详情面板加“进入阅读页”入口；修复 `DiagramBlock` 对无图示挖矿点的误渲染；清理已无路由的旧 2D 地图组件。

**Architecture:** 不动 `courseKnowledge.ts`（它仍是数据管线的手写输入源 + 类型定义，改它会与管线产物 `index.json` 形成循环依赖）。导航层 `courseNav` 改为基于 `index.json` 的 603 点元数据（同步，bundle 内）；详情走 `forestData.loadPoint`（懒加载 `points/<id>.json`）。`ReadingPage` 用元数据做导航 + 异步加载完整点渲染 `KnowledgeDetailPanel`。

**Tech Stack:** React 19、react-router(HashRouter)、Vite、TypeScript。本计划改动以 `npm run build` + Playwright 截图自检为验证（涉及路由/异步/WebGL，不做 node 单测）。

## Global Constraints

- 纯前端静态项目，数据来自 `src/data/index.json` + `src/data/points/*.json`（603 点/23 簇）。
- **不修改** `src/data/courseKnowledge.ts`（管线输入源 + 类型导出）。
- 复用现有 `KnowledgeDetailPanel`/`DiagramBlock`/`AnimationBlock`；挖矿点缺 `visualType` 时图示区不渲染。
- `npm run build`（`tsc -b && vite build`）必须通过；UI 改动按 `docs/requirements/AGENT_PROTOCOL.md` 截图 `/#/ai` 与某阅读页自检。
- 保留既有学习者术语与交互（章节/知识点、本章列表、上一点/下一点、localStorage 上次位置）。

---

### Task 1: 修复 DiagramBlock 对无图示点的误渲染

**Files:**
- Modify: `src/components/DiagramBlock.tsx`

**Interfaces:**
- 行为变更：`point.visualType` 为 undefined → 整个图示 section 不渲染（返回 null）；其余 `visualType`（含 `'foundation'`）行为不变。

- [ ] **Step 1: 改 `DiagramBlock`**

把组件体改为先判空：
```tsx
function DiagramBlock({ point }: DiagramBlockProps) {
  if (!point.visualType) {
    return null; // 挖矿点无指定图示类型 → 不渲染图示区（避免落到 default 的无关示意图）
  }
  return (
    <section className="detail-section">
      <h3>自绘图示</h3>
      <p className="detail-note">{point.visualSuggestion ?? '用结构化图形把该知识点的核心关系可视化。'}</p>
      <div className="diagram-canvas">{renderDiagram(point.visualType)}</div>
    </section>
  );
}
```
（`renderDiagram` 与各 `*Diagram` 子组件、`default: FoundationDiagram` 保持不变——`'foundation'` 仍渲染 FoundationDiagram。）

- [ ] **Step 2: 类型检查通过**

Run: `npx tsc -b`
Expected: exit 0。

- [ ] **Step 3: 提交**

```bash
git add src/components/DiagramBlock.tsx
git commit -m "fix(reading): 无visualType的知识点不再误渲染默认图示"
```

---

### Task 2: courseNav 改读 index.json（603 点导航元数据）

**Files:**
- Modify: `src/data/courseNav.ts`

**Interfaces:**
- Produces（签名尽量保持，元素类型由 `KnowledgePoint` 改为 `PointMeta`）：
  - `chapters: ClusterMeta[]`、`orderedPoints: PointMeta[]`
  - `findChapter(id?) : ClusterMeta | undefined`、`findPoint(id?) : PointMeta | undefined`
  - `chapterPoints(id): PointMeta[]`、`firstPointOf(id): PointMeta | undefined`
  - `adjacent(id): { prev, next }`（`{id,title}|null`）、`positionInChapter(p): {index,total}`
  - `pointPath({id,clusterId}): string`、`rememberLastPoint`/`readLastPoint`（不变）

- [ ] **Step 1: 重写 `src/data/courseNav.ts`**

```ts
import indexJson from './index.json';
import type { ForestIndex, ClusterMeta, PointMeta } from '../forest/forestData';

const index = indexJson as unknown as ForestIndex;

// 学习者可见术语：课程 → 章节（知识簇）→ 知识点。导航只依赖 index.json 的轻量元数据。
export const chapters: ClusterMeta[] = index.clusters;

// 按「章节顺序 + 章节内顺序」拉直成连续学习序列。
export const orderedPoints: PointMeta[] = chapters.flatMap((chapter) =>
  index.points.filter((point) => point.clusterId === chapter.id),
);

const pointById = new Map(orderedPoints.map((p) => [p.id, p]));

export function findChapter(chapterId: string | undefined): ClusterMeta | undefined {
  return chapters.find((chapter) => chapter.id === chapterId);
}

export function findPoint(pointId: string | undefined): PointMeta | undefined {
  return pointId ? pointById.get(pointId) : undefined;
}

export function chapterPoints(chapterId: string): PointMeta[] {
  return orderedPoints.filter((point) => point.clusterId === chapterId);
}

export function firstPointOf(chapterId: string): PointMeta | undefined {
  return orderedPoints.find((point) => point.clusterId === chapterId);
}

export type AdjacentPoint = { id: string; title: string } | null;

export function adjacent(pointId: string): { prev: AdjacentPoint; next: AdjacentPoint } {
  const i = orderedPoints.findIndex((point) => point.id === pointId);
  if (i === -1) return { prev: null, next: null };
  const prev = i > 0 ? orderedPoints[i - 1] : null;
  const next = i < orderedPoints.length - 1 ? orderedPoints[i + 1] : null;
  return {
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
  };
}

export function positionInChapter(point: PointMeta): { index: number; total: number } {
  const points = chapterPoints(point.clusterId);
  return { index: points.findIndex((item) => item.id === point.id) + 1, total: points.length };
}

export function pointPath(point: Pick<PointMeta, 'id' | 'clusterId'>): string {
  return `/ai/${point.clusterId}/${point.id}`;
}

const LAST_POINT_KEY = 'forest:ai:lastPoint';

export function rememberLastPoint(pointId: string): void {
  try {
    window.localStorage.setItem(LAST_POINT_KEY, pointId);
  } catch {
    /* 隐私模式忽略 */
  }
}

export function readLastPoint(): string | null {
  try {
    return window.localStorage.getItem(LAST_POINT_KEY);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc -b`
Expected: 可能在 `ReadingPage.tsx`（消费 `findPoint` 返回值传给 `KnowledgeDetailPanel`）报类型不符——下一个 Task 修复。若**仅** `ReadingPage.tsx` 报错则符合预期；`courseNav.ts`/`App.tsx` 本身不应报错。

- [ ] **Step 3: 提交**

```bash
git add src/data/courseNav.ts
git commit -m "feat(reading): courseNav 改读 index.json，覆盖全部603点导航"
```

---

### Task 3: ReadingPage 异步加载完整知识点

**Files:**
- Modify: `src/components/ReadingPage.tsx`

**Interfaces:**
- Consumes: `courseNav`（meta 导航）、`forestData.loadPoint`（完整点）、`KnowledgeDetailPanel`
- 行为：用 meta 校验路由/做导航与本章列表；异步 `loadPoint(pointId)` 得完整点后渲染 `KnowledgeDetailPanel`，加载中显示占位。

- [ ] **Step 1: 重写 `src/components/ReadingPage.tsx`**

（所有 hooks 在条件 return 之前调用，避免 hooks 顺序问题。）
```tsx
import { useEffect, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Home, List, PanelRightClose } from 'lucide-react';
import KnowledgeDetailPanel from './KnowledgeDetailPanel';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';
import { loadPoint } from '../forest/forestData';
import {
  adjacent,
  chapterPoints,
  findChapter,
  findPoint,
  pointPath,
  positionInChapter,
  rememberLastPoint,
} from '../data/courseNav';

function ReadingPage() {
  const { chapterId, pointId } = useParams();
  const navigate = useNavigate();
  const [isDockOpen, setDockOpen] = useState(true);
  const [full, setFull] = useState<KnowledgePoint | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  const meta = findPoint(pointId);
  const chapter = findChapter(chapterId);

  useEffect(() => {
    if (meta) rememberLastPoint(meta.id);
  }, [meta?.id]);

  useEffect(() => {
    if (!pointId) return;
    let alive = true;
    setFull(null);
    setLoadErr(false);
    loadPoint(pointId)
      .then((p) => { if (alive) setFull(p as unknown as KnowledgePoint); })
      .catch(() => { if (alive) setLoadErr(true); });
    return () => { alive = false; };
  }, [pointId]);

  if (!meta) return <Navigate to="/ai" replace />;
  if (!chapter || chapter.id !== meta.clusterId) return <Navigate to={pointPath(meta)} replace />;

  const points = chapterPoints(chapter.id);
  const { prev, next } = adjacent(meta.id);
  const { index, total } = positionInChapter(meta);

  const goToPoint = (id: string) => {
    const target = findPoint(id);
    if (target) navigate(pointPath(target));
  };

  return (
    <main
      id="main-content"
      className={`page reading-layout ${isDockOpen ? '' : 'dock-collapsed'}`}
      aria-label={`${chapter.title}知识点阅读`}
      style={{ '--chapter-accent': chapter.accent, '--chapter-soft': chapter.soft } as CSSProperties}
    >
      <div className="reading-main">
        {full ? (
          <KnowledgeDetailPanel
            key={full.id}
            point={full}
            cluster={chapter as KnowledgeCluster}
            prev={prev}
            next={next}
            positionInCluster={index}
            clusterTotal={total}
            onSelect={goToPoint}
          />
        ) : loadErr ? (
          <p className="reading-loading">该知识点内容加载失败。</p>
        ) : (
          <p className="reading-loading">加载中…</p>
        )}
      </div>

      <aside className={`chapter-dock ${isDockOpen ? 'is-open' : 'is-collapsed'}`} aria-label="本章节知识点列表">
        {isDockOpen ? (
          <>
            <div className="dock-head">
              <div>
                <span className="dock-eyebrow">本章节</span>
                <strong className="dock-title">{chapter.title}</strong>
              </div>
              <button
                type="button"
                className="dock-collapse"
                onClick={() => setDockOpen(false)}
                aria-label="收起章节列表"
                title="收起章节列表"
              >
                <PanelRightClose size={16} aria-hidden="true" />
              </button>
            </div>

            <ol className="dock-list">
              {points.map((item, itemIndex) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`dock-item ${item.id === meta.id ? 'is-current' : ''}`}
                    aria-current={item.id === meta.id ? 'true' : undefined}
                    onClick={() => goToPoint(item.id)}
                  >
                    <span className="dock-item-index">{String(itemIndex + 1).padStart(2, '0')}</span>
                    <span className="dock-item-title">{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="dock-foot">
              <button type="button" className="dock-link" onClick={() => navigate('/ai')}>
                <ChevronLeft size={15} aria-hidden="true" />
                切换章节
              </button>
              <button type="button" className="dock-link" onClick={() => navigate('/')}>
                <Home size={15} aria-hidden="true" />
                返回书架
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="dock-open-handle"
            onClick={() => setDockOpen(true)}
            aria-label="展开章节列表"
            title="展开章节列表"
          >
            <List size={16} aria-hidden="true" />
            <span>章节目录</span>
          </button>
        )}
      </aside>
    </main>
  );
}

export default ReadingPage;
```

- [ ] **Step 2: 加载占位样式**

在 `src/styles.css` 末尾追加：
```css
.reading-loading { padding: 48px 24px; color: #777; text-align: center; }
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc -b`
Expected: exit 0。

- [ ] **Step 4: 提交**

```bash
git add src/components/ReadingPage.tsx src/styles.css
git commit -m "feat(reading): ReadingPage 懒加载完整知识点，覆盖603点"
```

---

### Task 4: 森林详情面板 → 进入阅读页入口

**Files:**
- Modify: `src/components/ForestPointPanel.tsx`
- Modify: `src/components/ForestMapPage.tsx`

**Interfaces:**
- `ForestPointPanel` 新增可选 prop `readingHref?: string`；非空时在面板底部渲染“进入阅读页”链接。
- `ForestMapPage` 计算 `readingHref = #/ai/<clusterId>/<id>` 传入（HashRouter 用 `<a href>` 或 `Link`）。

- [ ] **Step 1: `ForestPointPanel` 加链接**

在 props 加 `readingHref?: string`；在内容区末尾（`comparisons` section 之后、`</>` 之前）加：
```tsx
{readingHref ? (
  <a className="forest-detail-readmore" href={readingHref}>进入阅读页 →</a>
) : null}
```
并在解构处加入 `readingHref`。

- [ ] **Step 2: `ForestMapPage` 传入 readingHref**

在 `ForestPointPanel` 使用处补 prop（`selectedClusterId` 已在组件内计算）：
```tsx
<ForestPointPanel
  point={point}
  cluster={selectedClusterId ? clusterById[selectedClusterId] : undefined}
  loading={loading}
  readingHref={selectedId && selectedClusterId ? `#/ai/${selectedClusterId}/${selectedId}` : undefined}
  onClose={() => setSelectedId(null)}
/>
```

- [ ] **Step 3: 链接样式**

`src/styles.css` 末尾追加：
```css
.forest-detail-readmore {
  display: inline-block;
  margin-top: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--detail-accent);
  text-decoration: none;
}
.forest-detail-readmore:hover { text-decoration: underline; }
```

- [ ] **Step 4: 类型检查**

Run: `npx tsc -b`
Expected: exit 0。

- [ ] **Step 5: 提交**

```bash
git add src/components/ForestPointPanel.tsx src/components/ForestMapPage.tsx src/styles.css
git commit -m "feat(forest): 详情面板增加进入阅读页入口"
```

---

### Task 5: 清理旧 2D 地图组件 + 全量构建与截图自检

**Files:**
- Delete: `src/components/ChapterMapPage.tsx`
- Delete: `src/components/ChapterPreviewDialog.tsx`

**Interfaces:**
- 删除已无路由引用的旧组件（`/ai` 已由 `ForestMapPage` 接管）。

- [ ] **Step 1: 确认无残留引用**

Run: `grep -rn "ChapterMapPage\|ChapterPreviewDialog" src/`
Expected: 无输出（App.tsx 已在子工程②改为 ForestMapPage）。若仍有引用，先处理引用方再删除。

- [ ] **Step 2: 删除文件**

```bash
git rm src/components/ChapterMapPage.tsx src/components/ChapterPreviewDialog.tsx
```

- [ ] **Step 3: 全量构建**

Run: `npm run build`
Expected: `tsc -b` 与 `vite build` 均通过，无未用导入报错。

- [ ] **Step 4: 截图自检**

Run: `node .agents/scripts/shot-forest.mjs`
Expected：输出 `hasCanvas:1, panelVisible:1, errors:[]`；查看 `.agents/artifacts/screenshots/forest-clicked.png` 确认详情面板含“进入阅读页”。
再补一个阅读页截图验证（可临时把 `shot-forest.mjs` 的 goto 改为某 `#/ai/<clusterId>/<id>` 或新建一次性脚本），确认完整阅读页渲染（核心思想/原理/术语/上一点下一点/本章列表），手写点（如 `#/ai/intro-history/turing-test`）应显示图示。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore(forest): 删除旧2D地图组件(ChapterMapPage/ChapterPreviewDialog)"
```

---

## 完成后

- 在 `docs/requirements/rounds/R010_*.md` 回写子工程③执行反馈，并把 R010 标注为可提交评审（状态由讨论窗口推进）。
- 用 `superpowers:finishing-a-development-branch` 收尾整个 R010（验证 + 合并/PR 选择）。

## Self-Review

- **Spec 覆盖**：spec §4.5 `courseKnowledge.ts` 改 loader → 调整为「courseNav 改读 index.json + ReadingPage 懒加载」（因 courseKnowledge 是管线输入，不能改，避免循环依赖；目标“统一到 603 点数据”达成）→ T2/T3；保留详情面板/阅读体验 → T3；森林联通阅读 → T4；清理旧组件 → T5；无图示点不误渲染 → T1。✅
- **占位扫描**：无 TBD；代码均给全。✅
- **类型一致**：`findPoint`/`adjacent`/`chapterPoints` 返回 `PointMeta`(T2) 与 ReadingPage 用法一致；`loadPoint`→`FullPoint` 转 `KnowledgePoint`(T3)；`ForestPointPanel` 新 prop `readingHref` 在 T4 两端一致。✅
- **隔离**：未改 `courseKnowledge.ts`；管线可继续 `npm run build:knowledge` 重跑。✅
- **已知风险**：`courseNav.ts` 顶层 import index.json 仅供 Vite（不参与 node 测试）；ReadingPage 异步加载靠截图验证；HashRouter 下用 `#/...` href 跳转。
