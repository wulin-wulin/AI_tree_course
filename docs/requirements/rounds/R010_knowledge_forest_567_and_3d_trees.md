# R010 - 知识点扩充至 ~567 + 3D 树森林可视化

状态：Accepted（已结束；603 点 / 23 簇与 3D 森林已成为当前基线）

创建日期：2026-06-22

## 背景

当前项目仅 8 簇 / 49 个手写知识点，`/ai` 是 2D SVG 俯览地图。用户希望对齐参考项目 `/Users/yzs/Desktop/ai-knowledge-forest`（567 知识点 + 3D 树森林观感），让内容更丰富、可视化更有"森林"沉浸感。本轮经 brainstorming 完整确认，设计与实现计划已落档。

## 用户真实反馈

- "我希望我们这个项目的知识点数量对齐我给你的那个项目的数量"（确认：课程自己扩到 ~567，保持《人工智能原理》定位，内容参考参考项目）。
- 课程思政"最好需要全写，我想看着丰富一些"。
- 可视化"修改成和参考项目完全一致的显示"，进一步澄清为"**只要 3D 树森林观感**"（保留现有页面框架/交互/详情面板）。
- 森林呈现：全部 ~567 棵树一屏 + 按簇分区，缩放下钻。课程思政用 LLM 生成，接受 API 成本/耗时。

## 本轮目标

1. 知识点从 49 扩到 ~567（深度为主 + 适度补广），内容参考参考项目，挖矿式转换 + 课程化补缺，**全量课程思政**。
2. 簇结构 2 层不变，顶层簇 8 → ~23。
3. `/ai` 的 `ChapterMapPage` 由 2D SVG 改为 **3D 树森林**（Three.js，seed 确定性树 + LOD + pan/zoom + 全部树一屏按簇分区，点击树进详情）。
4. 数据架构改为拆 JSON + 按需加载，`courseKnowledge.ts` 改 loader。

## 具体需求

详见落档设计与计划：

- 设计：`docs/superpowers/specs/2026-06-22-knowledge-forest-567-design.md`
- 计划一（数据管线）：`docs/superpowers/plans/2026-06-22-data-pipeline.md`
- 计划二（3D 森林可视化）、计划三（接线整合）：将在计划一产出真实数据 schema 后补写。

## 非目标

- 不移植参考项目的 SVG 城市区域/道路/行政区地图（仅要 3D 树森林观感）。
- 不接后端/数据库（保持纯前端静态）。
- 不为 567 个点新建自定义可视化组件（仅复用现有 16 个）。
- 不实现参考项目的演化回放、新增知识点接口等额外功能。

## 验收标准

- `npm run build`（`tsc -b && vite build`）通过。
- `npm run test:pipeline`（管线单测）全过；`npm run build:knowledge` 产出 `src/data/index.json`（点数 ≈ 567、23 簇）+ `src/data/points/*.json`，每点 `ideologicalElement` 全量非空、无悬空簇/前置引用。
- `/ai` 渲染 3D 树森林，pan/zoom/LOD/点击详情可用，首屏不明显卡顿；UI 改动按 AGENT_PROTOCOL 用截图自检。

## 执行备注

- 本轮取代 `ChapterMapPage` 现有 2D 实现，**R009 所修的 2D 预览卡 bug 随之失效/不再适用**（旧预览卡机制被 3D 森林替换）；执行时一并说明。
- 严格遵循设计/计划的子工程顺序：① 数据管线 → ② 3D 森林 → ③ 接线整合，每块以 `npm run build` 验证。
- 参考项目绝对路径：`/Users/yzs/Desktop/ai-knowledge-forest`。
- LLM Key 走环境变量 `LLM_API_KEY`；课程思政结果缓存于 `scripts/.cache/`（已 gitignore）。

## 执行反馈

> 由执行智能体完成后填写。三个子工程①②③ 全部完成，待讨论窗口评审。

### 实现概况

- **子工程①（数据管线）已完成**：写成可重跑的 Node 管线 `scripts/build_knowledge.mjs` + `scripts/lib/*`，将森林项目 567 点 + 现有 49 手写点转换/归并为 **603 个知识点 / 23 簇**，产出 `src/data/index.json` 与 `src/data/points/*.json`。
- **子工程②（3D 树森林可视化）已完成，并按用户反馈重做对齐参考项目**：最初按“只要观感”做了浅色平面俯视版；用户要求与参考项目 `ai-knowledge-forest` 一致后**重做**为：**移植参考的 `scene3d.js`/`tree_factory.js`（vendor）**，深色主题、透视倾斜 3D 视角、地面平面、按簇着色的区域多边形 + 簇标签（DOM 投影）、按缩放/重要度的密度可见性 3D 树、顶部搜索 + 跳转知识簇、左下图例；管线新增**簇区域多边形**写入 index.json；`forestAdapter` 把我们的数据适配成 Scene3D 的 layout/data。点击树仍用**我们的** `ForestPointPanel` + “进入阅读页”（未移植参考的 facet 弹窗）。深色样式仅作用于森林页，首页/阅读页保持浅色。Playwright 截图与参考项目并排比对一致、无控制台错误。
- **课程思政取消**：执行中用户决定不使用 `ideologicalElement`，管线移除生成步骤、删除 ideology/llm 模块，整条管线不依赖 LLM。
- **子工程③（接线整合）已完成**：`courseNav` 改读 `index.json`（603 点导航元数据）；`ReadingPage` 懒加载完整点；`DiagramBlock` 对无 `visualType` 的挖矿点不再误渲染；森林详情面板加“进入阅读页”入口；删除已无路由的旧 `ChapterMapPage`/`ChapterPreviewDialog`。注：`courseKnowledge.ts` 保留为数据管线手写输入源 + 类型定义（改它会与管线产物 `index.json` 形成循环依赖），故未按 spec 原文“改 loader”，改以 `courseNav` 改读 index 达成“统一到 603 点”目标。

### 已完成需求

- 知识点扩充至 603（深度为主 + 适度补广，挖矿式转换参考项目）。
- 簇结构 2 层、顶层簇 8 → 23。
- 数据拆 JSON（index.json 轻量索引 + points/*.json 详情），为后续按需加载铺好结构。

### 未完成或部分完成

- 课程思政：经用户确认取消，不做。
- 可选观感增强：森林为纯俯视，树冠从正上看呈彩色块；可后续加相机倾斜增强 3D 纵深感（用户已知，暂未做）。
- 性能：主 bundle 含 three + index.json 约 1.1MB；可后续对 `/ai` 路由做懒加载拆分（暂未做）。

### 执行中发现的问题

- 现有 49 手写点用旧 8 簇 ID，需重映射到新 23 簇 → 加 `scripts/authored_cluster_map.json` 解决。
- 跨源去重按标题丢弃重复挖矿点后，其他点对其 id 的 prereq 会悬空 → 解析后按最终点集过滤悬空引用解决。

### 认为需求不合理或需要澄清的点

- 课程思政经澄清后用户决定取消（见上）。

### 修改文件清单

- 新增：`scripts/build_knowledge.mjs`、`scripts/lib/{transform,merge,layout,validate}.mjs` 及对应 `*.test.mjs`、`scripts/cluster_map.json`、`scripts/authored_cluster_map.json`、`src/data/clusters.json`、`src/data/index.json`、`src/data/points/*.json`(603)
- 修改：`package.json`（加 `test:pipeline`/`build:knowledge`）、`.gitignore`
- 文档：`docs/superpowers/specs/2026-06-22-knowledge-forest-567-design.md`、`docs/superpowers/plans/2026-06-22-data-pipeline.md`

### 验证结果

- `npm run test:pipeline`：17 个单测全过。
- `npm run test:forest`：6 个单测全过（树工厂确定性 + 数据加载缓存）。
- `npm run build:knowledge`：产出 603 点 / 23 簇，结构校验通过（无悬空簇/前置引用）。
- `npm run build`：`tsc -b && vite build` 通过；603 个 point JSON 各自切分为按需 chunk。
- Playwright 截图自检（`.agents/scripts/shot-forest.mjs`）：`/#/ai` 森林渲染正常、点击树弹详情面板含“进入阅读页”链接；阅读页 `/#/ai/intro-history/turing-test` 详情+图示+上一点/下一点+本章列表均正常；无控制台错误。

## 审核记录

> 由需求讨论窗口审核后填写。

审核人：需求讨论窗口　审核日期：2026-06-25　结论：**结束（Accepted）**

- 本轮执行反馈已完整记录，数据管线、603 个知识点、23 个知识簇、拆分 JSON、3D 树森林与阅读页接线均已交付，并经过构建、管线测试、森林测试与截图自检。
- “课程思政”在执行过程中经用户确认取消，不作为遗留未完成项。
- R010 的成果已成为后续 R011（森林相机交互）、R012（簇跳转与默认视角）、R013（明亮日间视觉改造）的基础；本轮自身不再继续执行。
- 当前项目真实状态以 R013 后的 `current_state.md` 为准，R010 作为基础能力被纳入其中。
