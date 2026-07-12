import { chapters, findPoint, orderedPoints, pointPath } from './courseNav';
import { loadPoint, type FullPoint, type PointMeta } from '../forest/forestData';

const STORAGE_KEY = 'forest:ai:learningPath';
const PATH_VERSION = 1;
const MAX_PATH_POINTS = 32;

export type LearningPathState = {
  version: number;
  query: string;
  ids: string[];
  createdAt: number;
};

export type LearningPathItem = PointMeta & {
  clusterTitle: string;
  score: number;
  reason: string;
};

type ScoredPoint = {
  point: FullPoint;
  meta: PointMeta;
  score: number;
  hits: string[];
  order: number;
  stage: number;
};

const clusterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const orderById = new Map(orderedPoints.map((point, index) => [point.id, index]));

const DOMAIN_PRESETS = [
  {
    triggers: ['大语言模型', 'llm', 'gpt', '基础模型', '生成式语言模型'],
    terms: ['大语言模型', 'llm', 'gpt', 'transformer', '自注意力', '预训练', '提示', 'prompt', 'token', '指令', 'rag', 'llm智能体', 'agenticrag', '对齐', '推理模型'],
  },
  {
    triggers: ['计算机视觉', 'cv', '图像', '视觉', '视频理解'],
    terms: ['计算机视觉', 'cv', '图像', '视觉', '卷积', 'cnn', '检测', '分割', '分类', '视频', 'vit', 'clip', '目标检测', '语义分割', '3d卷积'],
  },
  {
    triggers: ['强化学习', 'rl', '智能体决策', '策略学习'],
    terms: ['强化学习', 'rl', '智能体', 'mdp', '马尔可夫', '奖励', '策略', '价值函数', 'q-learning', 'dqn', 'bellman', '贝尔曼', '探索', '经验回放'],
  },
  {
    triggers: ['语音识别', '语音技术', 'asr', 'tts', '语音'],
    terms: ['语音', 'asr', 'tts', '识别', '合成', 'ctc', 'whisper', 'tacotron', 'wavenet', '声码器', '自监督学习'],
  },
  {
    triggers: ['图神经网络', 'gnn', '图学习', '知识图谱', '图谱'],
    terms: ['图', 'graph', '知识图谱', '图神经网络', 'gnn', 'graphrag', '实体', '关系', '三元组', '图嵌入', '语义网络'],
  },
  {
    triggers: ['生成模型', '生成式ai', '扩散模型', '文生图'],
    terms: ['生成模型', '生成式', '扩散', 'vae', 'gan', 'elbo', '重参数化', 'kl散度', '采样', '潜在空间', '图像生成', '可控生成'],
  },
];

let fullPointCache: Promise<FullPoint[]> | null = null;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

function splitQuery(query: string): string[] {
  const raw = query
    .split(/[\s,，、;；/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return raw.length ? raw : [query.trim()];
}

function buildQueryTerms(query: string): string[] {
  const terms = new Set<string>();
  for (const part of splitQuery(query)) terms.add(part);
  const q = normalize(query);
  for (const preset of DOMAIN_PRESETS) {
    const matched = preset.triggers.some((trigger) => {
      const t = normalize(trigger);
      return q.includes(t) || t.includes(q);
    });
    if (matched) {
      for (const term of preset.terms) terms.add(term);
    }
  }
  return [...terms].map(normalize).filter((term) => term.length >= 2);
}

function textOf(value: unknown): string {
  if (!value) return '';
  if (Array.isArray(value)) return value.map(textOf).join(' ');
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(textOf).join(' ');
  return String(value);
}

async function loadAllPoints(): Promise<FullPoint[]> {
  if (!fullPointCache) {
    fullPointCache = Promise.all(
      orderedPoints.map(async (meta) => {
        try {
          return await loadPoint(meta.id);
        } catch {
          return {
            ...meta,
            coreIdea: meta.shortSummary,
            principles: [],
            applications: [],
          };
        }
      }),
    );
  }
  return fullPointCache;
}

function fieldScore(haystack: string, terms: string[], weight: number, label: string): { score: number; hits: string[] } {
  const hay = normalize(haystack);
  let score = 0;
  const hits: string[] = [];
  for (const term of terms) {
    if (!hay.includes(term)) continue;
    const termBoost = Math.min(1.6, Math.max(0.72, term.length / 4));
    score += weight * termBoost;
    hits.push(label);
  }
  return { score, hits };
}

function scorePoint(point: FullPoint, terms: string[]): { score: number; hits: string[] } {
  const cluster = clusterById.get(point.clusterId);
  const fields: Array<[string, number, string]> = [
    [point.title, 22, '标题'],
    [textOf(point.aliases), 18, '别名'],
    [textOf(point.keyTerms), 14, '关键词'],
    [cluster ? `${cluster.title} ${cluster.subtitle} ${cluster.description}` : '', 12, '知识簇'],
    [point.shortSummary, 8, '摘要'],
    [point.coreIdea, 6, '核心思想'],
    [textOf(point.principles), 4, '原理'],
    [textOf(point.applications), 4, '应用'],
    [textOf(point.comparisons), 3, '对比'],
    [textOf(point.prerequisites), 3, '前置'],
    [textOf(point.intuition), 3, '直觉'],
    [textOf(point.history), 1.5, '历史'],
  ];

  let score = 0;
  const hits: string[] = [];
  for (const [text, weight, label] of fields) {
    const result = fieldScore(text, terms, weight, label);
    score += result.score;
    hits.push(...result.hits);
  }
  return { score, hits: [...new Set(hits)].slice(0, 3) };
}

function stageRank(point: FullPoint): number {
  const text = normalize(`${point.title} ${point.shortSummary} ${point.coreIdea} ${textOf(point.keyTerms)}`);
  let stage = 2;
  if (point.difficulty === '基础') stage -= 0.75;
  if (point.difficulty === '进阶') stage += 0.65;
  if (!point.prerequisites?.length) stage -= 0.35;
  if (/定义|基础|概念|范式|原理|入门|神经元|注意力机制|transformer|智能体|马尔可夫|生成模型/.test(text)) stage -= 0.65;
  if (/优化|方法|算法|模型|网络|方程|推理|学习/.test(text)) stage += 0.1;
  if (/应用|系统|部署|工程|安全|治理|评测|攻击|视频生成/.test(text)) stage += 0.8;
  if (/攻击|注入|对抗|越狱|红队|安全|治理|伦理/.test(text)) stage += 1.1;
  return Math.max(0, Math.min(5, stage));
}

function prerequisiteIds(candidates: ScoredPoint[]): Map<string, Set<string>> {
  const byId = new Map(candidates.map((item) => [item.point.id, item]));
  const byTitle = new Map<string, string>();
  for (const item of candidates) {
    byTitle.set(normalize(item.point.title), item.point.id);
    for (const alias of item.point.aliases ?? []) byTitle.set(normalize(alias), item.point.id);
  }

  const deps = new Map<string, Set<string>>();
  for (const item of candidates) {
    const own = new Set<string>();
    for (const prereq of item.point.prerequisites ?? []) {
      const key = normalize(prereq);
      const id = byId.has(prereq) ? prereq : byTitle.get(key);
      if (id && id !== item.point.id) own.add(id);
    }
    deps.set(item.point.id, own);
  }
  return deps;
}

function baseCompare(a: ScoredPoint, b: ScoredPoint): number {
  const rankA = a.stage * 520 + a.order * 0.32 - a.score * 34;
  const rankB = b.stage * 520 + b.order * 0.32 - b.score * 34;
  return rankA - rankB || b.score - a.score || a.order - b.order;
}

function orderForLearning(candidates: ScoredPoint[]): ScoredPoint[] {
  const sorted = [...candidates].sort(baseCompare);
  const deps = prerequisiteIds(sorted);
  const pending = new Map(sorted.map((item) => [item.point.id, item]));
  const result: ScoredPoint[] = [];

  while (pending.size) {
    const next = [...pending.values()].find((item) => {
      const ownDeps = deps.get(item.point.id) ?? new Set<string>();
      return [...ownDeps].every((id) => !pending.has(id));
    }) ?? [...pending.values()][0];
    if (!next) break;
    result.push(next);
    pending.delete(next.point.id);
  }

  return result;
}

function toLearningItem(item: ScoredPoint): LearningPathItem {
  const meta = item.meta;
  return {
    ...meta,
    clusterTitle: clusterById.get(meta.clusterId)?.title ?? meta.clusterId,
    score: Math.round(item.score),
    reason: item.hits.length ? item.hits.join(' / ') : '相关内容',
  };
}

export async function generateLearningPath(query: string): Promise<{ state: LearningPathState; items: LearningPathItem[]; totalCandidates: number }> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      state: { version: PATH_VERSION, query: '', ids: [], createdAt: Date.now() },
      items: [],
      totalCandidates: 0,
    };
  }

  const terms = buildQueryTerms(cleanQuery);
  const points = await loadAllPoints();
  const scored = points
    .map((point) => {
      const meta = findPoint(point.id) ?? point;
      const { score, hits } = scorePoint(point, terms);
      return {
        point,
        meta,
        score,
        hits,
        order: orderById.get(point.id) ?? Number.MAX_SAFE_INTEGER,
        stage: stageRank(point),
      };
    })
    .filter((item) => item.score > 0);

  const topScore = scored.reduce((max, item) => Math.max(max, item.score), 0);
  const threshold = Math.max(6, topScore * 0.16);
  let candidates = scored.filter((item) => item.score >= threshold);
  if (candidates.length < 6) {
    candidates = scored.sort((a, b) => b.score - a.score || a.order - b.order).slice(0, 12);
  }

  const ordered = orderForLearning(candidates).slice(0, MAX_PATH_POINTS);
  const ids = ordered.map((item) => item.point.id);
  const state = { version: PATH_VERSION, query: cleanQuery, ids, createdAt: Date.now() };
  return { state, items: ordered.map(toLearningItem), totalCandidates: candidates.length };
}

export function resolveLearningPathItems(state: LearningPathState | null): LearningPathItem[] {
  if (!state?.ids?.length) return [];
  return state.ids
    .map((id) => findPoint(id))
    .filter((point): point is PointMeta => Boolean(point))
    .map((point) => ({
      ...point,
      clusterTitle: clusterById.get(point.clusterId)?.title ?? point.clusterId,
      score: 0,
      reason: '已保存路径',
    }));
}

export function readLearningPath(): LearningPathState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LearningPathState;
    if (!Array.isArray(parsed.ids) || !parsed.query) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLearningPath(state: LearningPathState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('learning-path-change'));
  } catch {
    /* localStorage may be disabled */
  }
}

export function clearLearningPath(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('learning-path-change'));
  } catch {
    /* localStorage may be disabled */
  }
}

export function pathReadingUrl(point: Pick<PointMeta, 'id' | 'clusterId'>): string {
  return `${pointPath(point)}?path=1`;
}

export function isLearningPathUrl(search: string): boolean {
  return new URLSearchParams(search).get('path') === '1';
}
