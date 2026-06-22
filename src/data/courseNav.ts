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
