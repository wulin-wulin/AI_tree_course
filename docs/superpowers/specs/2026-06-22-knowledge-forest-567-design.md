# 设计：知识点扩充至 ~567 + 3D 树森林可视化

- 日期：2026-06-22
- 分支：`folk_lj`
- 状态：设计已与用户确认，待写实现计划（writing-plans）
- 参考项目：`/Users/yzs/Desktop/ai-knowledge-forest`（下称"森林项目"）

## 1. 背景与目标

当前项目 `AI_tree_course` 是《人工智能原理》课程知识可视化 demo：
- 8 个知识簇、**50 个手工精写知识点**，全部在 `src/data/courseKnowledge.ts`。
- `/ai` 路由 `ChapterMapPage` 是一张 2D SVG"俯览地图"（8 章节蛇形节点 + 装饰性背景树）。

森林项目是一套 LLM 批量生成的 AI 全领域知识库（12 领域 / 51 类别 / **567 知识点**），并自带"城市地图 + 3D 树森林"可视化。

**本轮目标（两件事）：**

1. **数据对齐**：保持《人工智能原理》课程定位，把知识点从 50 扩充到 **~567**，内容**参考森林项目**（挖矿式转换 + 课程化补缺）。
2. **可视化升级**：把 `ChapterMapPage` 的知识可视化改为森林项目那种 **3D 树森林观感**（保留我们现有页面框架、交互与详情面板）。

## 2. 已确认的关键决策

| 维度 | 决定 |
|---|---|
| 对齐意图 | 课程自己扩到 ~567（内容生产），保持课程定位 |
| 扩充方式 | 深度为主 + 适度补广，内容参考森林项目 |
| 簇结构 | 2 层不变，顶层簇 8 → ~23 |
| 执行路线 | 路线 1：挖矿式转换管线（半自动 + 人工补缺） |
| 数据架构 | 拆 JSON + 按需加载 |
| 课程思政 | **全部 ~567 点都写**（森林项目无此字段，需 LLM 逐点生成） |
| 可视化范围 | **只要 3D 树森林观感**，保留现有页面框架/交互/详情面板 |
| 森林呈现 | **全部 ~567 棵树一屏 + 按簇分区聚集**，缩放下钻 |
| 课程思政生成 | 用 LLM 生成，接受 API 成本/耗时 |

## 3. 总体架构

分为三块子工程，建议按顺序实现，每块独立可验证：

```
① 数据管线 ──> ② 3D 森林可视化 ──> ③ 接线整合
```

数据流：

```
森林项目数据 (knowledge_points/*.json, index.json)
  + 簇映射配置 (cat_* -> 课程簇)
  + 手写基础点 (簇①②③：导论历史 / 搜索 / 知识推理)
        │
        ▼  scripts/build_knowledge.mjs
        │   - 字段映射     - 归簇 / 去重
        │   - 难度&可视化转换
        │   - [阶段] LLM 生成 ideologicalElement（课程思政，全量，可缓存）
        │   - [阶段] 力导向布局生成 pos/scale（按簇分区）
        ▼
src/data/index.json  +  src/data/points/*.json
        ▼
courseKnowledge.ts (loader: loadIndex / loadPoint + 内存缓存)
        ▼
React 组件（ChapterMapPage 3D 森林 / ReadingPage / KnowledgeDetailPanel）
```

## 4. 数据层设计

### 4.1 知识簇体系（8 → ~23 簇，2 层）

保留课程主线，把森林项目 12 领域 / 51 类别归并重映射为课程化簇：

- **基础主线（森林项目缺，我们自写）**：①导论与历史 ②搜索与问题求解 ③知识表示与推理
- **机器学习**：④机器学习基础(监督/无监督) ⑤集成学习 ⑥贝叶斯与概率学习 ⑦核方法与SVM ⑧优化理论
- **深度学习**：⑨神经网络基础(反向传播/正则化/归一化) ⑩卷积神经网络 ⑪循环网络与序列建模 ⑫Transformer与注意力 ⑬生成模型(扩散/GAN/VAE)
- **应用层**：⑭自然语言处理 ⑮计算机视觉 ⑯语音技术 ⑰多模态
- **大模型**：⑱大语言模型(规模法则/训练/微调/提示/评估) ⑲检索增强与智能体
- **前沿/系统**：⑳强化学习与智能体 ㉑AI系统与工程 ㉒AI for Science ㉓AI伦理与安全

簇映射关系（`cat_* -> 课程簇`）维护为一份**显式配置文件** `scripts/cluster_map.json`，作为管线的版本可控输入，不在代码里硬编码散落。567 / 23 ≈ 每簇约 25 点。

### 4.2 字段映射（森林项目 → 我们 `KnowledgePoint`）

| 我们的字段 | 森林项目来源 | 转换规则 |
|---|---|---|
| `title` | `name_zh` | 直接 |
| `shortSummary` | `facets.definition` / `facets.intuition` | 取较短者，截断到合理长度 |
| `coreIdea` | `facets.core_content` | 直接 |
| `principles[]` | `facets.core_content` 拆句 + `common_misconceptions` + `teaching_tips` | 拆为要点数组 |
| `keyTerms[]` | `facets.keywords` + `tags` | 合并去重 |
| `comparisons[]` | `facets.comparison_values` | `维度: 取值` 拼为字符串数组 |
| `formula` | `facets.formalization` | 非空才设 |
| `applications[]` | `facets.applications` | 直接 |
| `difficulty` | `facets.difficulty`(0–1 float) | `<0.34→基础`, `<0.67→中等`, 否则`进阶` |
| `prerequisites[]` | `facets.prerequisites` | 映射到我们 id 命名空间 |
| `importance` | `importance` | 保留（树大小用） |

**保留但选填**：`visualType`/`animationType`（仅当现有 16 个可视化组件能套用时设；否则不设，纯文本）。

**新增可选字段**（避免丢弃森林项目好料，类型上加 optional，UI 增强逐步渲染）：`intuition` 直觉类比、`misconceptions[]` 常见误区、`history` / `yearIntroduced`、`prosCons`、`qa[]`。

**ID 命名空间**：森林项目用 `kp_*`，我们沿用现有 kebab-case 风格；管线建立 `kp_* -> our-id` 映射表，保证 `prerequisites`/`related` 引用正确转换。

### 4.3 课程思政生成阶段（`ideologicalElement`，全量）

- 森林项目无此字段，管线中独立一步：对全部 ~567 点用 **LLM 逐点生成** `ideologicalElement`。
- 复用森林项目 `config.yaml` 的 LLM 端点（DeepSeek/OpenAI/Ollama，Key 走环境变量 `LLM_API_KEY`）。
- **可缓存、可重跑、幂等**：结果按知识点 id 落盘缓存（如 `scripts/.cache/ideology/<id>.txt`），已生成的不重复调用，控制成本。
- 生成 prompt 给定：知识点标题 + coreIdea + 所属簇，要求输出贴合该知识点的课程思政元素（科学精神 / 自主创新 / 伦理责任 / 家国情怀等，与知识点强相关，避免空泛套话）。

### 4.4 布局生成阶段（树坐标）

- 移植/简化森林项目 `layout/force_layout.py` 的力导向：**按簇分区**，每簇一个区域，区域内力导向散布知识点（斥力防重叠 + 同簇内边吸引）。
- 产出每点 `pos:[x,y]` 与 `scale`（由 importance 映射），写入 `index.json`。
- 前端零计算，直接读坐标渲染。

### 4.5 数据架构（拆 JSON + 懒加载）

- `src/data/index.json`：`clusters[]` + 轻量点列表（`id, title, clusterId, shortSummary, difficulty, importance, keyTerms, pos, scale`）→ 首屏一次加载。
- `src/data/points/<id>.json`：单点完整 `KnowledgePoint` 详情 → 点击懒加载。
- `src/data/courseKnowledge.ts` 改为 **loader 模块**：导出 `loadIndex()`、`loadPoint(id)`（内存 `Map` 缓存），保留现有类型导出（`KnowledgePoint`/`KnowledgeCluster`/枚举）。
- **迁移成本**：现有同步 `import { clusters, knowledgePoints }` 的组件（`ChapterMapPage`、`courseNav.ts`、`ReadingPage`、`KnowledgeDetailPanel` 等）改为异步加载 + loading 态。这是本轮主要重构点。

## 5. 可视化层设计（3D 树森林）

### 5.1 依赖

新增 `three`（与森林项目同栈）。

### 5.2 `ChapterMapPage` 重做

- 路由 `/ai` 不变，组件内部由 2D SVG 改为 **Three.js 3D 树森林**。
- 每个知识点 = 一棵 **seed 确定性 3D 树**：
  - 移植森林项目 `tree_factory.js`（五棱台树干 + 二十/十二面体树冠），seed 由知识点 id 派生 → 树形稳定可复现。
  - 颜色按所属簇 accent，大小按 `importance/scale`。
- **LOD 三档**：`zoom≥0.8` high(双层冠) / `≥0.3` medium(单层) / `<0.3` low(billboard 圆点)，正交俯视相机，pan/zoom。
- **全部 ~567 棵树一屏森林**，按簇分区聚集；缩放下钻看清单棵树与簇标签。
- 交互：点击树 → 复用现有 `KnowledgeDetailPanel`（或跳 `ReadingPage`）；hover 高亮 + 树名标签。
- 性能：LOD + 懒加载点详情；树几何体按 LOD 复用，避免一次性建 567 棵高模。

### 5.3 保留不动

顶栏 / 导航 / `HomePage` / `ReadingPage` / `KnowledgeDetailPanel` / 现有 16 个手工可视化组件（在点详情中仍可用）/ `courseNav` 导航逻辑（适配异步数据）。

## 6. 流程合规

- 本设计文档存于 `docs/superpowers/specs/`（superpowers 流程）。
- 因项目 `CLAUDE.md` 规定实现前须走 `docs/requirements/` 轮次流程：**实现开始前，在 `docs/requirements/rounds` 注册一个对应的 `Ready` 轮次文档**（引用本 spec），完成后回写执行反馈，满足项目协议。
- 实现阶段用 writing-plans 产出分步计划。

## 7. 验证

- `npm run build`（TypeScript + Vite 生产构建）是优先验证命令，每个子工程完成后必须通过。
- 数据管线：产出 `index.json` 点数 ≈ 567、每点字段完整（含 `ideologicalElement` 全量）、簇引用与 `prerequisites` 引用无悬空。
- 可视化：`/ai` 正常渲染 3D 森林、pan/zoom/LOD/点击详情可用、首屏不卡。

## 8. 非目标（YAGNI）

- 不移植森林项目的 SVG 城市区域/道路/行政区地图（用户只要 3D 树森林观感）。
- 不接后端/数据库（保持纯前端静态）。
- 不为 567 个点新建自定义可视化组件（仅复用现有 16 个）。
- 不实现森林项目的演化回放、新增知识点接口等额外功能。
