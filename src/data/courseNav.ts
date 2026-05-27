import { clusters, knowledgePoints } from './courseKnowledge';
import type { KnowledgeCluster, KnowledgePoint } from './courseKnowledge';

// 学习者可见术语：课程 → 章节 → 知识点。
// 现有 clusters 即「章节」，knowledgePoints 即「知识点」，此处只做派生导航，不改动原始数据结构。
export const chapters: KnowledgeCluster[] = clusters;

// 把全部知识点按「章节顺序 + 章节内顺序」拉直成一条连续学习序列。
export const orderedPoints: KnowledgePoint[] = clusters.flatMap((chapter) =>
  knowledgePoints.filter((point) => point.clusterId === chapter.id),
);

export function findChapter(chapterId: string | undefined): KnowledgeCluster | undefined {
  return chapters.find((chapter) => chapter.id === chapterId);
}

export function findPoint(pointId: string | undefined): KnowledgePoint | undefined {
  return orderedPoints.find((point) => point.id === pointId);
}

export function chapterPoints(chapterId: string): KnowledgePoint[] {
  return orderedPoints.filter((point) => point.clusterId === chapterId);
}

export function firstPointOf(chapterId: string): KnowledgePoint | undefined {
  return orderedPoints.find((point) => point.clusterId === chapterId);
}

export type AdjacentPoint = { id: string; title: string } | null;

// 上一点 / 下一点按全课程连续序列推进：到本章末尾时，下一点自动进入下一章首个知识点。
export function adjacent(pointId: string): { prev: AdjacentPoint; next: AdjacentPoint } {
  const index = orderedPoints.findIndex((point) => point.id === pointId);
  if (index === -1) {
    return { prev: null, next: null };
  }
  const prev = index > 0 ? orderedPoints[index - 1] : null;
  const next = index < orderedPoints.length - 1 ? orderedPoints[index + 1] : null;
  return {
    prev: prev ? { id: prev.id, title: prev.title } : null,
    next: next ? { id: next.id, title: next.title } : null,
  };
}

// 知识点在其所属章节内的位置（1 基）与本章总数。
export function positionInChapter(point: KnowledgePoint): { index: number; total: number } {
  const points = chapterPoints(point.clusterId);
  return {
    index: points.findIndex((item) => item.id === point.id) + 1,
    total: points.length,
  };
}

// 路由地址：知识点阅读页 /ai/:chapterId/:pointId
export function pointPath(point: Pick<KnowledgePoint, 'id' | 'clusterId'>): string {
  return `/ai/${point.clusterId}/${point.id}`;
}

const LAST_POINT_KEY = 'forest:ai:lastPoint';

export function rememberLastPoint(pointId: string): void {
  try {
    window.localStorage.setItem(LAST_POINT_KEY, pointId);
  } catch {
    // 隐私模式或禁用存储时静默忽略，位置感属轻量增强、缺失不影响主流程。
  }
}

export function readLastPoint(): string | null {
  try {
    return window.localStorage.getItem(LAST_POINT_KEY);
  } catch {
    return null;
  }
}
