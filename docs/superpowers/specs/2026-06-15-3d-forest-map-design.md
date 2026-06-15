# 3D 知识森林地图 — 设计方案

- 日期：2026-06-15
- 分支：3DMap
- 状态：设计已确认，待写实现计划
- 替换对象：`/ai` 现有 2D 徒步长卷（`ChapterMapPage` + `ChapterTrailIndex`）

## 1. 目标

把 `/ai` 章节导览从 2D SVG 徒步长卷，重构为一张 **3D 斜俯瞰的矩形知识森林地图**：

- 一张矩形地图，用**曲线**有机划分成 **8 块区域**（= 8 章），区域铺满矩形、无空隙无外边距。
- 每块区域是一片种着该章专属树种/配色的森林；**一棵树 = 一个小节**（共 49 棵）。
- **斜俯瞰**视角，**滚轮缩放**、**拖拽平移**浏览。
- 悬停树 → 浮出**单张轻预览卡**；点击树 → 进入该小节阅读页。
- 保留现有学习进度叙事（已读小节点亮、顶栏「已点亮 N/49」）。

不改动：首页（`HomePage`）、阅读页（`ReadingPage`）、数据层 `courseKnowledge.ts`、导航派生 `courseNav.ts`、路由契约。

## 2. 关键决策（已确认）

| # | 决策 | 选择 |
|---|------|------|
| 1 | 现有 2D 长卷 | **整体替换**：`/ai` 默认渲染 3D 地图 |
| 2 | 进度叙事 | **保留**「已点亮 N/49、上次读到这里」 |
| 3 | WebGL 降级 | **退回现有长卷**：保留 `ChapterMapPage` 作为后备组件 |
| — | 技术栈 | **react-three-fiber**（three.js + drei） |
| — | 美术风格 | **柔和圆润 / 绘本感**：圆树冠 + 渐变 + 软投影 + 暖色调 |
| — | 区域排布 | 矩形完整镶嵌，曲线分界，**种子确定性**（布局稳定可记忆） |

**决策 1 与 3 的衔接**：`/ai` 默认走 3D；现有 `ChapterMapPage` 长卷组件**保留在代码库中，仅作为 WebGL 不可用时的降级后备**，不再做成用户可见的切换入口。

## 3. 架构

`/ai` 路由元素改为新的 `ForestMapPage`，结构分三层，各层职责单一、可独立测试：

```
ForestMapPage (/ai)
├─ <ForestErrorBoundary>            // 捕获 WebGL/渲染错误
│   └─ <ForestMapScene>            // react-three-fiber <Canvas>：3D 世界
│        ├─ 相机 + 控制（斜俯瞰 / zoom / pan）
│        ├─ 光照 + 地面
│        ├─ <ChapterRegion> ×8     // 曲线区域地块（按章配色）
│        └─ <SubsectionTree> ×49   // instanced 树（按小节状态着色）
│   └─ (降级) <ChapterMapPage />    // WebGL 不可用时渲染现有长卷
└─ <ForestMapOverlay>              // 普通 DOM，浮在 Canvas 上
     ├─ 顶栏：返回书架 + 「已点亮 N/49」进度
     ├─ 悬停预览卡（单张）
     └─ 操作提示 / reduced-motion 友好
```

- **3D 里只放“世界”，HTML 负责“界面”**：预览卡、顶栏、提示都是 DOM 覆盖层，便于无障碍与测试。
- 新增依赖：`three`、`@react-three/fiber`、`@react-three/drei`，打包进 `dist`，仍是纯前端、不引入外部图片/CDN 资源。

## 4. 布局器 `forestLayout.ts`（纯函数 · 确定性 · 可单测）

输入：`chapters`（8 章）+ 各章 `chapterPoints`（小节）。输出：`{ regions, trees }`，**不依赖 three.js**。

- **区域划分**：矩形（归一化坐标系，如 `[0,1]×[0,1]`）用**带固定种子**的有机划分镶嵌为 8 块，相邻区域共享**平滑曲线**边界，铺满无空隙。区域面积可按各章小节数自适应（小节多 → 占地更大）。
- **树散点**：每块区域内用确定性抖动散点（poisson-disk 思路）放置 N 棵树，N = 该章小节数；避免重叠、留出边距、尽量靠近区域中心分布。
- **确定性**：同一输入恒定输出同一布局（种子固定，不用 `Math.random()` 运行期随机）；刷新/重排布局不跳，支撑空间记忆。
- 输出数据：
  - `regions[]`: `{ chapterId, accent, soft, dark, species, polygon(曲线边界采样点), centroid, labelPos }`
  - `trees[]`: `{ pointId, chapterId, position(x,z), scale, speciesVariant }`

**单测点**：① 确定性（同输入同输出）；② 树数 == 小节数；③ 每棵树落在所属区域多边形内；④ 区域并集覆盖整张矩形、两两不重叠（采样近似校验）。

## 5. 相机与交互

- **斜俯瞰**：透视相机固定俯角（约 45–55°），初始 framing 看全 8 区域；地图中心朝向相机。
- **滚轮缩放**：dolly/zoom，限制 min/max（防穿模、防飞远）。
- **拖拽平移**：沿地图平面 pan，限制在地图范围内（软边界）。
- **悬停树**：raycaster 拾取 → 该树轻微抬升/高亮 + 浮出单张预览卡（小节标题 + 一句 `shortSummary` + “进入阅读 →”）。同一时刻只一张卡（沿用现有“单预览卡”原则）。
- **点击树** → `navigate(pointPath(point))` 进入 `/ai/:chapterId/:pointId`。
- **区域标签**：每块区域中心浮章节序号 + 短标题（HTML 标签或 drei `<Html>`）。
- 键盘可达：提供“按 Tab 在树间移动 + Enter 进入”的可达路径或等价 DOM 后备（无障碍）。

## 6. 美术风格（B：柔和圆润 / 绘本感）

- 树：圆鼓树冠（球/堆叠球程序几何）+ 圆柱树干 + 地面软投影；按章 `accent/soft/dark` 着色，8 章树形/比例略有差异（复用现有 8 树种语义）。
- 光照：柔和环境光 + 一盏主方向光给体积与软阴影；暖色调天空/地面。
- 进度态：已读小节树**饱满点亮**，未读偏幼苗/低饱和；可选高亮“上次读到这里”的树。
- 动画：极轻风吹摇摆（可选）；`prefers-reduced-motion` 时关闭所有动画、转场瞬时。

## 7. 进度叙事（复用现有逻辑）

复用 `courseNav.ts` 的 `readLastPoint()` / `orderedPoints`：

- “已读”= `orderedPoints` 中 last-read 序号及之前的小节（与现有长卷一致的线性进度）。
- 顶栏「已点亮 N/49」与进度条；进入小节后 `rememberLastPoint` 已在阅读页处理，无需新增存储。

## 8. 降级与兼容

- **WebGL 不可用 / 渲染错误**：`ForestErrorBoundary` + 启动前 WebGL 能力探测 → 渲染现有 `ChapterMapPage`（零额外成本，保证永远能进知识点，不白屏）。
- **移动端**：单指拖平移、双指捏合缩放；小屏初始 zoom 适配。
- **性能**：树用 instancing（一次画 49 棵 + 区域）；`frameloop="demand"`（无悬停/动画时不空转）；按需 raycast。
- **`prefers-reduced-motion`**：关闭风吹/飞入动画。

## 9. 文件改动清单

新增：
- `src/components/ForestMapPage.tsx`（`/ai` 新入口，含 WebGL 探测 + error boundary + 降级）
- `src/components/forest3d/ForestMapScene.tsx`（`<Canvas>` 与 3D 世界）
- `src/components/forest3d/ChapterRegion.tsx`、`SubsectionTree.tsx`
- `src/components/forest3d/ForestMapOverlay.tsx`（顶栏 / 预览卡 / 提示）
- `src/data/forestLayout.ts`（纯函数布局器）
- `src/data/forestLayout.test.ts`（布局器单测）
- 3D 森林相关样式（`styles.css` 增量或独立模块）

修改：
- `src/App.tsx`：`/ai` 的 `element` 从 `ChapterMapPage` 改为 `ForestMapPage`
- `package.json`：新增 `three` / `@react-three/fiber` / `@react-three/drei`

保留（作降级后备）：
- `src/components/ChapterMapPage.tsx`、`src/components/ChapterTrailIndex.tsx`

## 10. 测试与验证

- `forestLayout` 单测（见 §4）。
- Playwright 冒烟：`/ai` 能挂载 Canvas；点击树跳到正确 `/ai/:chapterId/:pointId`；降级路径可达（模拟无 WebGL）。
- 交互手测：缩放/平移/悬停预览/点击进入。
- `npm run build`（`tsc -b && vite build`）必须通过（项目首选验证命令）。

## 11. 范围边界（YAGNI）

不做：飞入区域的镜头动画编排、昼夜/天气系统、多课程 3D、树木 LOD 分级、寻路连线。这些留到地图主体稳定后再单独评估。
