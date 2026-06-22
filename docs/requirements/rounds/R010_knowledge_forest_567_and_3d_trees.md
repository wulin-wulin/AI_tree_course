# R010 - 知识点扩充至 ~567 + 3D 树森林可视化

状态：Ready

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

> 由执行智能体完成后填写。分三个子工程，当前进度：① 数据管线已完成；②③ 待做。

### 实现概况

- **子工程①（数据管线）已完成**：写成可重跑的 Node 管线 `scripts/build_knowledge.mjs` + `scripts/lib/*`，将森林项目 567 点 + 现有 49 手写点转换/归并为 **603 个知识点 / 23 簇**，产出 `src/data/index.json` 与 `src/data/points/*.json`。
- **课程思政取消**：执行中用户决定不使用 `ideologicalElement`，管线移除生成步骤、删除 ideology/llm 模块，整条管线不依赖 LLM。
- 子工程② 3D 树森林可视化、③ 接线整合（loader 改造 + 组件适配）**尚未开始**。

### 已完成需求

- 知识点扩充至 603（深度为主 + 适度补广，挖矿式转换参考项目）。
- 簇结构 2 层、顶层簇 8 → 23。
- 数据拆 JSON（index.json 轻量索引 + points/*.json 详情），为后续按需加载铺好结构。

### 未完成或部分完成

- `/ai` 3D 树森林可视化（子工程②）。
- `courseKnowledge.ts` 改 loader、`courseNav`/`ReadingPage`/`KnowledgeDetailPanel` 适配异步数据（子工程③）。

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
- `npm run build:knowledge`：产出 603 点 / 23 簇，结构校验通过（无悬空簇/前置引用）。
- `npm run build`：（见提交后验证）。

## 审核记录

> 由需求讨论窗口审核后填写。
