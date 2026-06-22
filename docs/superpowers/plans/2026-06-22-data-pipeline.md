# 数据管线 Implementation Plan（子工程 ①）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 写一条可重跑的构建管线，把森林项目的 567 个知识点 + 我们现有 50 个手写点，转换/归并为 ~567 个课程化知识点，产出 `src/data/index.json` 与 `src/data/points/*.json`（含全量课程思政与树坐标）。

**Architecture:** 纯 Node ESM 脚本（`scripts/`）。先写一组**纯函数转换库**（可单测），再写 LLM 课程思政生成（带文件缓存）、力导向布局，最后由 `build_knowledge.mjs` 编排，读多源 → 转换 → 去重 → 生成思政 → 布局 → 写产物。前端零计算。

**Tech Stack:** Node v25（原生 `.ts` 类型剥离 + 内置 `node:test`，不新增测试框架）、ESM `.mjs`、`fetch`（调 LLM）。

## Global Constraints

- 纯前端静态项目，管线只产出 `src/data/` 下的 JSON，不引入后端/数据库。
- 不新增运行时依赖；测试用 Node 内置 `node:test`（`node --test`）。
- 森林项目绝对路径：`/Users/yzs/Desktop/ai-knowledge-forest`（下称 `$FOREST`）。
- LLM Key 走环境变量 `LLM_API_KEY`，端点/模型从 `scripts/llm.config.json` 读，默认 DeepSeek（`https://api.deepseek.com/v1`, `deepseek-chat`）。
- 产物 `KnowledgePoint` 字段对齐 spec §4.2；`ideologicalElement` 必须**全量非空**。
- 课程簇约 23 个；目标点数 ≈ 567。
- 输出 JSON 用 `JSON.stringify(obj, null, 2)`，`ensureAscii` 关闭（保留中文）。
- 每个任务结束 `npm run build` 不要求（管线不参与 tsc），但 `node --test` 对应测试必须通过。

---

### Task 1: 课程簇定义 + 类别映射配置

**Files:**
- Create: `src/data/clusters.json`
- Create: `scripts/cluster_map.json`
- Test: `scripts/lib/cluster_map.test.mjs`

**Interfaces:**
- Produces: `clusters.json` = `Array<{id,title,subtitle,description,accent,soft,dark}>`（~23 项）；`cluster_map.json` = `{ "<forest_category_id>": "<cluster_id>" }`，覆盖森林项目全部 51 个 `cat_*`。

- [ ] **Step 1: 写校验测试（先失败）**

`scripts/lib/cluster_map.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FOREST = '/Users/yzs/Desktop/ai-knowledge-forest';

const clusters = JSON.parse(readFileSync(join(ROOT, 'src/data/clusters.json'), 'utf8'));
const map = JSON.parse(readFileSync(join(ROOT, 'scripts/cluster_map.json'), 'utf8'));
const forestIdx = JSON.parse(readFileSync(join(FOREST, 'data/index.json'), 'utf8'));

test('clusters 约 23 个且 id 唯一', () => {
  assert.ok(clusters.length >= 20 && clusters.length <= 26, `got ${clusters.length}`);
  const ids = clusters.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('每个 cluster 字段完整', () => {
  for (const c of clusters) {
    for (const k of ['id','title','subtitle','description','accent','soft','dark']) {
      assert.ok(c[k], `cluster ${c.id} 缺 ${k}`);
    }
  }
});

test('森林全部 category 都有映射且指向存在的 cluster', () => {
  const clusterIds = new Set(clusters.map(c => c.id));
  for (const cat of forestIdx.categories) {
    const target = map[cat.id];
    assert.ok(target, `category ${cat.id} 未映射`);
    assert.ok(clusterIds.has(target), `category ${cat.id} 指向不存在的 cluster ${target}`);
  }
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test scripts/lib/cluster_map.test.mjs`
Expected: FAIL（文件不存在 / ENOENT）

- [ ] **Step 3: 写 `src/data/clusters.json`**

按 spec §4.1 的 ~23 簇填写。每簇取一组配色（可沿用现有 8 簇配色，新增簇用同风格 HEX）。示例（节选，需补全到 ~23 项）：
```json
[
  {"id":"intro-history","title":"导论与历史","subtitle":"AI 是什么，为什么发展到今天","description":"从定义、图灵测试到三大学派。","accent":"#2f9e7e","soft":"#dff7ed","dark":"#175c49"},
  {"id":"search-solving","title":"搜索与问题求解","subtitle":"把问题变成状态空间中的路径","description":"盲目搜索、启发式搜索与博弈搜索。","accent":"#d97706","soft":"#fff0cf","dark":"#7a3d02"},
  {"id":"knowledge-reasoning","title":"知识表示与推理","subtitle":"让机器表达事实、规则与关系","description":"逻辑、产生式系统、语义网络与知识图谱。","accent":"#7c5cff","soft":"#ece8ff","dark":"#4430a6"},
  {"id":"ml-basics","title":"机器学习基础","subtitle":"从数据中学习规律","description":"监督、无监督与经典学习范式。","accent":"#238be6","soft":"#dceeff","dark":"#115184"},
  {"id":"ensemble","title":"集成学习","subtitle":"组合多个弱学习器","description":"Bagging、Boosting 与随机森林。","accent":"#1f9e8a","soft":"#d6f5ee","dark":"#0d5a4e"},
  {"id":"bayesian","title":"贝叶斯与概率学习","subtitle":"用概率刻画不确定性","description":"贝叶斯分类、概率图模型。","accent":"#5b8def","soft":"#e0ebff","dark":"#2a4d99"},
  {"id":"kernel-svm","title":"核方法与SVM","subtitle":"在高维空间寻找间隔","description":"核技巧与支持向量机。","accent":"#3aa6a0","soft":"#d8f5f3","dark":"#1a5e5a"},
  {"id":"optimization","title":"优化理论","subtitle":"如何更快更稳地训练","description":"梯度下降族与优化器。","accent":"#c77d2e","soft":"#fbeccf","dark":"#7a4a0f"},
  {"id":"nn-basics","title":"神经网络基础","subtitle":"用可训练网络表示函数","description":"神经元、反向传播、正则化与归一化。","accent":"#e6537d","soft":"#ffe2ea","dark":"#912742"},
  {"id":"cnn","title":"卷积神经网络","subtitle":"看懂图像的网络","description":"卷积、池化与经典 CNN 架构。","accent":"#d6457a","soft":"#ffe0eb","dark":"#85234a"},
  {"id":"rnn-seq","title":"循环网络与序列建模","subtitle":"处理有时序的数据","description":"RNN、LSTM、GRU 与序列建模。","accent":"#b15bd0","soft":"#f3e2fb","dark":"#5e2a72"},
  {"id":"transformer","title":"Transformer与注意力","subtitle":"注意力驱动的现代主干","description":"自注意力、多头注意力与 Transformer。","accent":"#8a5cf0","soft":"#ebe2fd","dark":"#4a2a8a"},
  {"id":"generative","title":"生成模型","subtitle":"学习数据分布并采样","description":"VAE、GAN 与扩散模型。","accent":"#e07a3a","soft":"#fbe7d6","dark":"#8a4515"},
  {"id":"nlp","title":"自然语言处理","subtitle":"让机器理解语言","description":"预训练、信息抽取、翻译、对话与知识图谱。","accent":"#0ea5a4","soft":"#d8f8f5","dark":"#0c6665"},
  {"id":"cv","title":"计算机视觉","subtitle":"让机器理解图像","description":"分类、检测、分割、视频与 3D 视觉。","accent":"#9b59b6","soft":"#f0e3f7","dark":"#5b3070"},
  {"id":"speech","title":"语音技术","subtitle":"听懂与说出","description":"自动语音识别与语音合成。","accent":"#e67e22","soft":"#fbe9d4","dark":"#8a4a10"},
  {"id":"multimodal","title":"多模态","subtitle":"跨模态统一表示","description":"多模态基础模型与跨模态对齐。","accent":"#3498db","soft":"#dceefb","dark":"#185a8a"},
  {"id":"llm","title":"大语言模型","subtitle":"规模带来的能力涌现","description":"规模法则、训练、微调、提示与评估。","accent":"#f5a623","soft":"#fdeecd","dark":"#8a5a0a"},
  {"id":"rag-agents","title":"检索增强与智能体","subtitle":"让模型用工具与外部知识","description":"RAG、高级检索与智能体 AI。","accent":"#d99a1c","soft":"#fbeecb","dark":"#7a560a"},
  {"id":"rl-agents","title":"强化学习与智能体","subtitle":"在交互中学习策略","description":"MDP、Q-learning、策略梯度与世界模型。","accent":"#84a51d","soft":"#edf7c8","dark":"#4e640e"},
  {"id":"ai-systems","title":"AI系统与工程","subtitle":"把模型跑起来跑得快","description":"训练/推理基础设施与系统优化。","accent":"#95a5a6","soft":"#eceeef","dark":"#5a6566"},
  {"id":"ai4science","title":"AI for Science","subtitle":"AI 驱动科学发现","description":"AI 在科学计算与发现中的应用。","accent":"#27ae60","soft":"#dcf5e6","dark":"#155f33"},
  {"id":"ethics-safety","title":"AI伦理与安全","subtitle":"能力边界与价值对齐","description":"公平、可解释、鲁棒、对齐、治理与评测。","accent":"#2c3e50","soft":"#dde3e9","dark":"#1a2530"}
]
```

- [ ] **Step 4: 写 `scripts/cluster_map.json`**

把森林 51 个 `cat_*` 映射到上面 cluster id（依 spec §4.1 归并）：
```json
{
  "cat_supervised":"ml-basics","cat_unsupervised":"ml-basics","cat_semisupervised":"ml-basics",
  "cat_ensemble":"ensemble","cat_bayesian":"bayesian","cat_kernel":"kernel-svm","cat_optimization":"optimization",
  "cat_cnn":"cnn","cat_rnn":"rnn-seq","cat_seq_modeling":"rnn-seq","cat_transformer":"transformer",
  "cat_normalization":"nn-basics","cat_arch":"nn-basics","cat_generative_models_modern":"generative",
  "cat_pretraining":"nlp","cat_information_extraction":"nlp","cat_machine_translation":"nlp",
  "cat_text_generation":"nlp","cat_dialogue":"nlp","cat_knowledge_graph":"nlp",
  "cat_image_classification":"cv","cat_object_detection":"cv","cat_segmentation":"cv",
  "cat_video_understanding":"cv","cat_3d_vision":"cv",
  "cat_asr":"speech","cat_tts":"speech",
  "cat_multimodal_foundation":"multimodal",
  "cat_scaling":"llm","cat_training":"llm","cat_finetuning":"llm","cat_prompt":"llm",
  "cat_evaluation":"llm","cat_foundation_models":"llm","cat_reasoning_models":"llm","cat_efficient_llm":"llm",
  "cat_rag":"rag-agents","cat_advanced_rag":"rag-agents","cat_agents":"rag-agents","cat_agentic_ai":"rag-agents",
  "cat_reinforcement_learning":"rl-agents","cat_world_models_embodied":"rl-agents",
  "cat_ai_systems_infrastructure":"ai-systems",
  "cat_ai_for_science":"ai4science",
  "cat_fairness":"ethics-safety","cat_explainability":"ethics-safety","cat_robustness":"ethics-safety",
  "cat_alignment":"ethics-safety","cat_alignment_ethics":"ethics-safety","cat_governance":"ethics-safety",
  "cat_ai_safety_eval":"ethics-safety"
}
```

- [ ] **Step 5: 运行测试确认通过**

Run: `node --test scripts/lib/cluster_map.test.mjs`
Expected: PASS（3 个 test 全过）。若 FAIL 报某 category 未映射，补进 `cluster_map.json`。

- [ ] **Step 6: 提交**

```bash
git add src/data/clusters.json scripts/cluster_map.json scripts/lib/cluster_map.test.mjs
git commit -m "feat(pipeline): 课程簇定义与森林类别映射配置"
```

---

### Task 2: 字段转换纯函数

**Files:**
- Create: `scripts/lib/transform.mjs`
- Test: `scripts/lib/transform.test.mjs`

**Interfaces:**
- Produces:
  - `mapDifficulty(d:number): '基础'|'中等'|'进阶'`
  - `buildComparisons(comparisonValues:object): string[]`
  - `pickShortSummary(facets:object): string`
  - `mapKeyTerms(facets:object, tags:string[]): string[]`
  - `mapKpToPoint(forestKp:object, clusterId:string): object`（返回完整点对象，**不含** `pos/scale/ideologicalElement`，那两者后续阶段补）

- [ ] **Step 1: 写测试（先失败）**

`scripts/lib/transform.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapDifficulty, buildComparisons, pickShortSummary, mapKeyTerms, mapKpToPoint } from './transform.mjs';

test('mapDifficulty 分档', () => {
  assert.equal(mapDifficulty(0.2), '基础');
  assert.equal(mapDifficulty(0.5), '中等');
  assert.equal(mapDifficulty(0.9), '进阶');
  assert.equal(mapDifficulty(undefined), '中等');
});

test('buildComparisons 拼维度', () => {
  assert.deepEqual(buildComparisons({ a: '高', b: '低' }), ['a: 高', 'b: 低']);
  assert.deepEqual(buildComparisons(undefined), []);
});

test('pickShortSummary 优先 intuition 并截断', () => {
  const s = pickShortSummary({ intuition: '简短直觉', definition: '很长很长的定义'.repeat(20) });
  assert.equal(s, '简短直觉');
  const long = pickShortSummary({ definition: 'x'.repeat(200) });
  assert.ok(long.length <= 121);
});

test('mapKeyTerms 合并去重截断', () => {
  const r = mapKeyTerms({ keywords: ['a','b','a'] }, ['b','c']);
  assert.deepEqual(r, ['a','b','c']);
});

test('mapKpToPoint 映射核心字段', () => {
  const kp = {
    id: 'kp_bagging', name_zh: 'Bagging', importance: 0.059, tags: ['集成学习'],
    facets: { definition:'定义', core_content:'核心', applications:['应用1'],
      keywords:['自助采样'], difficulty:0.4, comparison_values:{dim_x:'高'}, formalization:'' }
  };
  const p = mapKpToPoint(kp, 'ensemble');
  assert.equal(p.id, 'kp_bagging');
  assert.equal(p.title, 'Bagging');
  assert.equal(p.clusterId, 'ensemble');
  assert.equal(p.coreIdea, '核心');
  assert.equal(p.difficulty, '中等');
  assert.deepEqual(p.applications, ['应用1']);
  assert.deepEqual(p.comparisons, ['dim_x: 高']);
  assert.equal(p.formula, undefined); // 空字符串不设
  assert.equal(p.importance, 0.059);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/lib/transform.test.mjs`
Expected: FAIL（`transform.mjs` 不存在）

- [ ] **Step 3: 实现 `scripts/lib/transform.mjs`**

```js
export function mapDifficulty(d) {
  if (typeof d !== 'number' || Number.isNaN(d)) return '中等';
  if (d < 0.34) return '基础';
  if (d < 0.67) return '中等';
  return '进阶';
}

export function buildComparisons(comparisonValues) {
  if (!comparisonValues || typeof comparisonValues !== 'object') return [];
  return Object.entries(comparisonValues).map(([k, v]) => `${k}: ${v}`);
}

export function pickShortSummary(facets = {}) {
  const raw = (facets.intuition || facets.definition || '').trim();
  if (raw.length <= 120) return raw;
  return raw.slice(0, 120) + '…';
}

export function mapKeyTerms(facets = {}, tags = []) {
  const all = [...(facets.keywords || []), ...(tags || [])];
  const seen = new Set();
  const out = [];
  for (const t of all) {
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out.slice(0, 8);
}

export function mapKpToPoint(kp, clusterId) {
  const f = kp.facets || {};
  const point = {
    id: kp.id,
    title: kp.name_zh,
    clusterId,
    shortSummary: pickShortSummary(f),
    coreIdea: f.core_content || f.definition || '',
    principles: splitPrinciples(f),
    keyTerms: mapKeyTerms(f, kp.tags),
    applications: Array.isArray(f.applications) ? f.applications : [],
    difficulty: mapDifficulty(f.difficulty),
    importance: typeof kp.importance === 'number' ? kp.importance : 0.5,
  };
  const comparisons = buildComparisons(f.comparison_values);
  if (comparisons.length) point.comparisons = comparisons;
  if (f.formalization && f.formalization.trim()) point.formula = f.formalization.trim();
  if (Array.isArray(kp.aliases) && kp.aliases.length) point.aliases = kp.aliases;
  // 可选增强字段（spec §4.2）
  if (f.intuition) point.intuition = f.intuition;
  if (Array.isArray(f.common_misconceptions) && f.common_misconceptions.length) point.misconceptions = f.common_misconceptions;
  if (f.history) point.history = f.history;
  if (kp.year_introduced || f.year_introduced) point.yearIntroduced = kp.year_introduced || f.year_introduced;
  if (f.pros_cons) point.prosCons = f.pros_cons;
  if (Array.isArray(f.qa) && f.qa.length) point.qa = f.qa;
  return point;
}

function splitPrinciples(f) {
  const out = [];
  const core = (f.core_content || '').split(/[。\n]/).map(s => s.trim()).filter(Boolean);
  out.push(...core.slice(0, 4));
  for (const t of (f.teaching_tips || [])) out.push(t);
  return out.slice(0, 6);
}
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test scripts/lib/transform.test.mjs`
Expected: PASS（5 个 test 全过）

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/transform.mjs scripts/lib/transform.test.mjs
git commit -m "feat(pipeline): 森林知识点字段转换纯函数"
```

---

### Task 3: ID 映射、前置依赖解析与跨源去重

**Files:**
- Create: `scripts/lib/merge.mjs`
- Test: `scripts/lib/merge.test.mjs`

**Interfaces:**
- Consumes: `mapKpToPoint`（Task 2）
- Produces:
  - `resolvePrereqs(point, idMap): void`（原地把 `prerequisites` 里的 `kp_*` 转成我们 id，丢弃无法解析的）
  - `dedupPoints(authored:object[], mined:object[]): object[]`（同名/同 id 冲突时**保留 authored**，返回合并后数组）
  - `normalizeId(s:string): string`（`kp_xxx`/中文 → kebab-case 稳定 id）

- [ ] **Step 1: 写测试（先失败）**

`scripts/lib/merge.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolvePrereqs, dedupPoints, normalizeId } from './merge.mjs';

test('normalizeId 规范化', () => {
  assert.equal(normalizeId('kp_random_forest'), 'random-forest');
  assert.equal(normalizeId('A Star Search'), 'a-star-search');
});

test('resolvePrereqs 转换并丢弃悬空', () => {
  const p = { prerequisites: ['kp_decision_tree', 'kp_missing'] };
  resolvePrereqs(p, { kp_decision_tree: 'decision-tree' });
  assert.deepEqual(p.prerequisites, ['decision-tree']);
});

test('dedupPoints 冲突保留 authored', () => {
  const authored = [{ id: 'decision-tree', title: '决策树', coreIdea: '手写版' }];
  const mined = [{ id: 'decision-tree', title: '决策树', coreIdea: '挖矿版' }, { id: 'bagging', title: 'Bagging' }];
  const out = dedupPoints(authored, mined);
  assert.equal(out.length, 2);
  assert.equal(out.find(p => p.id === 'decision-tree').coreIdea, '手写版');
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/lib/merge.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现 `scripts/lib/merge.mjs`**

```js
export function normalizeId(s) {
  return String(s)
    .replace(/^kp_/, '')
    .trim().toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-一-龥]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function resolvePrereqs(point, idMap) {
  if (!Array.isArray(point.prerequisites)) return;
  point.prerequisites = point.prerequisites
    .map(id => idMap[id] || (idMap[`kp_${id}`] ?? null))
    .filter(Boolean);
}

export function dedupPoints(authored, mined) {
  const byId = new Map();
  const byTitle = new Map();
  for (const p of authored) { byId.set(p.id, p); byTitle.set(p.title, p); }
  const out = [...authored];
  for (const p of mined) {
    if (byId.has(p.id) || byTitle.has(p.title)) continue; // 冲突保留 authored
    byId.set(p.id, p); byTitle.set(p.title, p); out.push(p);
  }
  return out;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test scripts/lib/merge.test.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/merge.mjs scripts/lib/merge.test.mjs
git commit -m "feat(pipeline): id 规范化/前置依赖解析/跨源去重"
```

---

### Task 4: 按簇力导向布局

**Files:**
- Create: `scripts/lib/layout.mjs`
- Test: `scripts/lib/layout.test.mjs`

**Interfaces:**
- Produces: `layoutByCluster(points:object[], opts?:{seed?:number}): Map<string,{pos:[number,number],scale:number}>`
  - 每簇分配一块矩形区域（网格铺排），区域内对该簇的点做斥力散布；`scale = 0.6 + importance*1.4`；坐标确定性（同输入同输出，内部用可注入 seed 的伪随机）。

- [ ] **Step 1: 写测试（先失败）**

`scripts/lib/layout.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutByCluster } from './layout.mjs';

const pts = [
  { id: 'a', clusterId: 'c1', importance: 1.0 },
  { id: 'b', clusterId: 'c1', importance: 0.0 },
  { id: 'c', clusterId: 'c2', importance: 0.5 },
];

test('每点都有坐标且无 NaN', () => {
  const m = layoutByCluster(pts);
  for (const p of pts) {
    const r = m.get(p.id);
    assert.ok(r, `${p.id} 缺布局`);
    assert.ok(Number.isFinite(r.pos[0]) && Number.isFinite(r.pos[1]));
  }
});

test('scale 随 importance 单调', () => {
  const m = layoutByCluster(pts);
  assert.ok(m.get('a').scale > m.get('b').scale);
  assert.equal(m.get('b').scale, 0.6);
});

test('确定性：两次结果一致', () => {
  const m1 = layoutByCluster(pts);
  const m2 = layoutByCluster(pts);
  assert.deepEqual(m1.get('a').pos, m2.get('a').pos);
});

test('同簇点不重合', () => {
  const m = layoutByCluster(pts);
  const [ax, ay] = m.get('a').pos, [bx, by] = m.get('b').pos;
  assert.ok(Math.hypot(ax - bx, ay - by) > 1);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/lib/layout.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现 `scripts/lib/layout.mjs`**

```js
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const CANVAS_W = 4000, CANVAS_H = 3000;

export function layoutByCluster(points, opts = {}) {
  const rand = seeded(opts.seed ?? 12345);
  const byCluster = new Map();
  for (const p of points) {
    if (!byCluster.has(p.clusterId)) byCluster.set(p.clusterId, []);
    byCluster.get(p.clusterId).push(p);
  }
  const clusterIds = [...byCluster.keys()];
  const cols = Math.ceil(Math.sqrt(clusterIds.length));
  const rows = Math.ceil(clusterIds.length / cols);
  const cellW = CANVAS_W / cols, cellH = CANVAS_H / rows;

  const result = new Map();
  clusterIds.forEach((cid, ci) => {
    const col = ci % cols, row = Math.floor(ci / cols);
    const ox = col * cellW, oy = row * cellH;
    const kps = byCluster.get(cid);
    const n = kps.length;
    // 初始网格散布 + 抖动
    const gc = Math.max(1, Math.ceil(Math.sqrt(n)));
    const pos = {};
    kps.forEach((kp, i) => {
      const gx = i % gc, gy = Math.floor(i / gc);
      const px = ox + cellW * 0.1 + (gx + 0.5) / gc * cellW * 0.8 + (rand() - 0.5) * 20;
      const py = oy + cellH * 0.1 + (gy + 0.5) / gc * cellH * 0.8 + (rand() - 0.5) * 20;
      pos[kp.id] = [px, py];
    });
    // 简易斥力迭代防重叠
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = pos[kps[i].id], b = pos[kps[j].id];
        let dx = a[0]-b[0], dy = a[1]-b[1];
        let d = Math.hypot(dx, dy) || 0.01;
        if (d < 40) {
          const f = (40 - d) / 2;
          dx /= d; dy /= d;
          a[0]+=dx*f; a[1]+=dy*f; b[0]-=dx*f; b[1]-=dy*f;
        }
      }
    }
    kps.forEach(kp => {
      const imp = typeof kp.importance === 'number' ? kp.importance : 0.5;
      result.set(kp.id, {
        pos: [Math.round(pos[kp.id][0]*10)/10, Math.round(pos[kp.id][1]*10)/10],
        scale: Math.round((0.6 + imp * 1.4) * 100) / 100,
      });
    });
  });
  return result;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test scripts/lib/layout.test.mjs`
Expected: PASS（4 个 test 全过）

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/layout.mjs scripts/lib/layout.test.mjs
git commit -m "feat(pipeline): 按簇分区力导向布局"
```

---

### Task 5: 课程思政 LLM 生成（带缓存）

**Files:**
- Create: `scripts/lib/ideology.mjs`
- Create: `scripts/llm.config.json`
- Test: `scripts/lib/ideology.test.mjs`
- Modify: `.gitignore`（加 `scripts/.cache/`）

**Interfaces:**
- Produces:
  - `buildIdeologyPrompt(point): string`
  - `async generateIdeology(point, {llmCall, cacheDir}): Promise<string>`（先查 `cacheDir/<id>.txt`，命中直接返回；否则调 `llmCall(prompt)`，结果落盘后返回。`llmCall` 注入便于测试。）

- [ ] **Step 1: 写测试（先失败）**

`scripts/lib/ideology.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildIdeologyPrompt, generateIdeology } from './ideology.mjs';

test('prompt 含标题与簇', () => {
  const p = buildIdeologyPrompt({ title: '决策树', coreIdea: '递归划分', clusterId: 'ml-basics' });
  assert.match(p, /决策树/);
  assert.match(p, /ml-basics/);
});

test('缓存命中不调用 llm', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ideo-'));
  writeFileSync(join(dir, 'x.txt'), '缓存内容');
  let called = false;
  const r = await generateIdeology({ id: 'x', title: 't', clusterId: 'c' },
    { llmCall: async () => { called = true; return 'new'; }, cacheDir: dir });
  assert.equal(r, '缓存内容');
  assert.equal(called, false);
  rmSync(dir, { recursive: true, force: true });
});

test('未命中调用 llm 并落盘', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ideo-'));
  const r = await generateIdeology({ id: 'y', title: 't', clusterId: 'c' },
    { llmCall: async () => '生成结果', cacheDir: dir });
  assert.equal(r, '生成结果');
  const again = await generateIdeology({ id: 'y', title: 't', clusterId: 'c' },
    { llmCall: async () => { throw new Error('不该调用'); }, cacheDir: dir });
  assert.equal(again, '生成结果');
  rmSync(dir, { recursive: true, force: true });
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/lib/ideology.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现 `scripts/lib/ideology.mjs`**

```js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function buildIdeologyPrompt(point) {
  return [
    '你是《人工智能原理》课程的思政设计助手。',
    '请为下面这个知识点撰写一条课程思政元素（80-150 字，1 段），',
    '要与该知识点强相关，可从科学精神、自主创新、工程伦理、社会责任、家国情怀等角度切入，避免空泛套话。',
    '',
    `知识点标题：${point.title}`,
    `所属知识簇：${point.clusterId}`,
    `核心思想：${point.coreIdea || ''}`,
    '',
    '只输出思政正文，不要加标题或前缀。',
  ].join('\n');
}

export async function generateIdeology(point, { llmCall, cacheDir }) {
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, `${point.id}.txt`);
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf8');
  const text = (await llmCall(buildIdeologyPrompt(point))).trim();
  writeFileSync(cacheFile, text);
  return text;
}
```

- [ ] **Step 4: 写 `scripts/llm.config.json`**

```json
{ "base_url": "https://api.deepseek.com/v1", "model": "deepseek-chat", "temperature": 0.7 }
```

- [ ] **Step 5: 忽略缓存目录**

把 `scripts/.cache/` 追加进 `.gitignore`。

- [ ] **Step 6: 运行确认通过**

Run: `node --test scripts/lib/ideology.test.mjs`
Expected: PASS（3 个 test 全过）

- [ ] **Step 7: 提交**

```bash
git add scripts/lib/ideology.mjs scripts/lib/ideology.test.mjs scripts/llm.config.json .gitignore
git commit -m "feat(pipeline): 课程思政 LLM 生成与文件缓存"
```

---

### Task 6: 真实 LLM 客户端

**Files:**
- Create: `scripts/lib/llm_client.mjs`
- Test: `scripts/lib/llm_client.test.mjs`

**Interfaces:**
- Consumes: `scripts/llm.config.json`、env `LLM_API_KEY`
- Produces: `makeLlmCall(config, {fetchImpl?, apiKey?}): (prompt:string)=>Promise<string>`（OpenAI 兼容 `/chat/completions`）

- [ ] **Step 1: 写测试（先失败）**

`scripts/lib/llm_client.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeLlmCall } from './llm_client.mjs';

test('构造请求并解析 content', async () => {
  let captured;
  const fakeFetch = async (url, opts) => {
    captured = { url, body: JSON.parse(opts.body), headers: opts.headers };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '答复' } }] }) };
  };
  const call = makeLlmCall({ base_url: 'https://x/v1', model: 'm', temperature: 0.5 },
    { fetchImpl: fakeFetch, apiKey: 'KEY' });
  const r = await call('你好');
  assert.equal(r, '答复');
  assert.equal(captured.url, 'https://x/v1/chat/completions');
  assert.equal(captured.body.model, 'm');
  assert.match(captured.headers.Authorization, /KEY/);
});

test('非 ok 抛错', async () => {
  const call = makeLlmCall({ base_url: 'https://x/v1', model: 'm' },
    { fetchImpl: async () => ({ ok: false, status: 500, text: async () => 'err' }), apiKey: 'K' });
  await assert.rejects(() => call('hi'), /500/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/lib/llm_client.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现 `scripts/lib/llm_client.mjs`**

```js
export function makeLlmCall(config, { fetchImpl = fetch, apiKey = process.env.LLM_API_KEY } = {}) {
  return async function call(prompt) {
    const res = await fetchImpl(`${config.base_url}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`LLM ${res.status}: ${t}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
  };
}
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test scripts/lib/llm_client.test.mjs`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add scripts/lib/llm_client.mjs scripts/lib/llm_client.test.mjs
git commit -m "feat(pipeline): OpenAI 兼容 LLM 客户端"
```

---

### Task 7: 编排器 + 产物校验 + npm 脚本

**Files:**
- Create: `scripts/build_knowledge.mjs`
- Create: `scripts/lib/validate.mjs`
- Test: `scripts/lib/validate.test.mjs`
- Modify: `package.json`（加 `build:knowledge`、`test:pipeline` 脚本）

**Interfaces:**
- Consumes: Task 1–6 全部
- Produces:
  - `validateOutput(index, points): string[]`（返回错误列表，空数组=通过：点数、簇引用、prereq 悬空、`ideologicalElement` 全量非空）
  - 运行 `build_knowledge.mjs` 产出 `src/data/index.json` + `src/data/points/*.json`

- [ ] **Step 1: 写校验测试（先失败）**

`scripts/lib/validate.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOutput } from './validate.mjs';

const clusters = [{ id: 'c1' }];
test('合法输出无错误', () => {
  const index = { clusters, points: [{ id:'a', clusterId:'c1', pos:[1,2], scale:1 }] };
  const points = { a: { id:'a', clusterId:'c1', ideologicalElement:'思政', prerequisites:[] } };
  assert.deepEqual(validateOutput(index, points), []);
});

test('缺思政/悬空簇/悬空 prereq 报错', () => {
  const index = { clusters, points: [{ id:'a', clusterId:'cX', pos:[1,2], scale:1 }] };
  const points = { a: { id:'a', clusterId:'cX', ideologicalElement:'', prerequisites:['z'] } };
  const errs = validateOutput(index, points);
  assert.ok(errs.some(e => /思政/.test(e)));
  assert.ok(errs.some(e => /簇/.test(e)));
  assert.ok(errs.some(e => /prereq|前置/.test(e)));
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test scripts/lib/validate.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现 `scripts/lib/validate.mjs`**

```js
export function validateOutput(index, points) {
  const errs = [];
  const clusterIds = new Set(index.clusters.map(c => c.id));
  const pointIds = new Set(index.points.map(p => p.id));
  for (const p of index.points) {
    if (!clusterIds.has(p.clusterId)) errs.push(`点 ${p.id} 指向不存在的簇 ${p.clusterId}`);
    if (!p.pos || p.pos.length !== 2) errs.push(`点 ${p.id} 缺坐标`);
  }
  for (const [id, full] of Object.entries(points)) {
    if (!full.ideologicalElement || !full.ideologicalElement.trim()) errs.push(`点 ${id} 缺课程思政`);
    for (const pre of (full.prerequisites || [])) {
      if (!pointIds.has(pre)) errs.push(`点 ${id} 前置依赖悬空: ${pre}`);
    }
  }
  return errs;
}
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test scripts/lib/validate.test.mjs`
Expected: PASS

- [ ] **Step 5: 实现编排器 `scripts/build_knowledge.mjs`**

```js
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mapKpToPoint } from './lib/transform.mjs';
import { normalizeId, resolvePrereqs, dedupPoints } from './lib/merge.mjs';
import { layoutByCluster } from './lib/layout.mjs';
import { generateIdeology } from './lib/ideology.mjs';
import { makeLlmCall } from './lib/llm_client.mjs';
import { validateOutput } from './lib/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FOREST = '/Users/yzs/Desktop/ai-knowledge-forest';
const CACHE = join(ROOT, 'scripts/.cache/ideology');
const OUT_INDEX = join(ROOT, 'src/data/index.json');
const OUT_POINTS = join(ROOT, 'src/data/points');

const NO_LLM = process.argv.includes('--no-llm'); // 离线占位模式

async function main() {
  const clusters = JSON.parse(readFileSync(join(ROOT, 'src/data/clusters.json'), 'utf8'));
  const clusterMap = JSON.parse(readFileSync(join(ROOT, 'scripts/cluster_map.json'), 'utf8'));
  const forestIdx = JSON.parse(readFileSync(join(FOREST, 'data/index.json'), 'utf8'));

  // 1) 现有手写点（簇①②③等）：从 courseKnowledge.ts 导入（Node 原生剥离 TS 类型）
  const authoredMod = await import(join(ROOT, 'src/data/courseKnowledge.ts'));
  const authored = (authoredMod.knowledgePoints || []).map(p => ({
    ...p, id: normalizeId(p.id), importance: p.importance ?? 0.6,
  }));

  // 2) 挖矿森林点
  const idMap = {};
  for (const kp of forestIdx.knowledge_points) idMap[kp.id] = normalizeId(kp.id);
  const mined = [];
  for (const kpMeta of forestIdx.knowledge_points) {
    const clusterId = clusterMap[kpMeta.category_id];
    if (!clusterId) continue;
    const full = JSON.parse(readFileSync(join(FOREST, 'data/knowledge_points', `${kpMeta.id}.json`), 'utf8'));
    const point = mapKpToPoint(full, clusterId);
    point.id = normalizeId(point.id);
    if (Array.isArray(full.facets?.prerequisites)) point.prerequisites = full.facets.prerequisites;
    mined.push(point);
  }

  // 3) 合并去重（保留手写）+ 解析 prereq
  const merged = dedupPoints(authored, mined);
  for (const p of merged) resolvePrereqs(p, idMap);

  // 4) 布局
  const layout = layoutByCluster(merged);
  for (const p of merged) {
    const l = layout.get(p.id);
    p.pos = l.pos; p.scale = l.scale;
  }

  // 5) 课程思政（全量）
  const llmCall = NO_LLM ? async () => '【待生成课程思政占位】' : makeLlmCall(JSON.parse(readFileSync(join(ROOT, 'scripts/llm.config.json'), 'utf8')));
  let done = 0;
  for (const p of merged) {
    p.ideologicalElement = await generateIdeology(p, { llmCall, cacheDir: CACHE });
    if (++done % 25 === 0) console.log(`课程思政 ${done}/${merged.length}`);
  }

  // 6) 写产物
  rmSync(OUT_POINTS, { recursive: true, force: true });
  mkdirSync(OUT_POINTS, { recursive: true });
  const pointsObj = {};
  const index = { schema_version: '1.0', clusters, points: [] };
  for (const p of merged) {
    pointsObj[p.id] = p;
    writeFileSync(join(OUT_POINTS, `${p.id}.json`), JSON.stringify(p, null, 2));
    index.points.push({
      id: p.id, title: p.title, clusterId: p.clusterId, shortSummary: p.shortSummary,
      difficulty: p.difficulty, importance: p.importance, keyTerms: p.keyTerms,
      pos: p.pos, scale: p.scale,
    });
  }
  writeFileSync(OUT_INDEX, JSON.stringify(index, null, 2));

  // 7) 校验
  const errs = validateOutput(index, pointsObj);
  console.log(`产出 ${index.points.length} 个知识点，${clusters.length} 个簇`);
  if (errs.length) { console.error('校验失败:\n' + errs.slice(0, 20).join('\n')); process.exit(1); }
  console.log('校验通过 ✅');
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 6: 加 npm 脚本**

`package.json` 的 `scripts` 增加：
```json
"test:pipeline": "node --test scripts/lib/",
"build:knowledge": "node scripts/build_knowledge.mjs"
```

- [ ] **Step 7: 离线跑通编排器（不调 LLM）**

Run: `npm run build:knowledge -- --no-llm`
Expected: 打印「产出 ~5xx 个知识点，23 个簇」「校验通过 ✅」；生成 `src/data/index.json` 与 `src/data/points/*.json`。
（注：`--no-llm` 用占位思政先跑通结构；真实生成见 Step 9。）

- [ ] **Step 8: 全量管线单测通过**

Run: `npm run test:pipeline`
Expected: 所有 `scripts/lib/*.test.mjs` PASS。

- [ ] **Step 9: 真实生成课程思政（需 LLM Key）**

```bash
export LLM_API_KEY="<your-key>"
npm run build:knowledge
```
Expected: 进度打印到 ~5xx/5xx；`校验通过 ✅`；抽查 `src/data/points/<某id>.json` 的 `ideologicalElement` 为真实内容且与知识点相关。
（结果缓存在 `scripts/.cache/ideology/`，重跑不重复扣费。）

- [ ] **Step 10: 提交**

```bash
git add scripts/build_knowledge.mjs scripts/lib/validate.mjs scripts/lib/validate.test.mjs package.json src/data/index.json src/data/points
git commit -m "feat(pipeline): 编排器+产物校验+生成 index.json/points（含全量课程思政与布局）"
```

---

## 后续计划（不在本计划内）

- **计划二（3D 森林可视化）**：新增 `three`，把 `ChapterMapPage` 重做为读 `index.json` 的 3D 树森林。
- **计划三（接线整合）**：`courseKnowledge.ts` 改 loader、`courseNav`/`ReadingPage`/`KnowledgeDetailPanel` 适配异步数据。
- **流程合规**：实现开始前，在 `docs/requirements/rounds` 注册对应 `Ready` 轮次（引用 spec），完成后回写执行反馈。

## Self-Review

- **Spec 覆盖**：§4.1 簇体系→T1；§4.2 字段映射→T2；ID/去重→T3；§4.4 布局→T4；§4.3 课程思政→T5/T6；§4.5 产物结构+校验→T7。✅
- **占位扫描**：编排器里 `--no-llm` 的占位思政仅用于结构联调，Step 9 用真实 LLM 覆盖，最终产物无占位。✅
- **类型一致**：`mapKpToPoint`(T2)→`dedupPoints/resolvePrereqs`(T3)→`layoutByCluster`(T4)→`generateIdeology`(T5)→`makeLlmCall`(T6)→`validateOutput`(T7) 函数名与签名在编排器中一致引用。✅
- **已知风险**：`import courseKnowledge.ts` 依赖 Node v25 原生 TS 剥离；若失败，回退方案是先手动导出 `src/data/authored.json` 供编排器读取。
