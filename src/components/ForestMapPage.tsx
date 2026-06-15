import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chapters, orderedPoints, chapterPoints, findChapter, readLastPoint, pointPath } from '../data/courseNav';
import { buildForestLayout } from '../data/forestLayout';
import { hasWebGL } from '../utils/webgl';
import ChapterMapPage from './ChapterMapPage';
import ForestErrorBoundary from './forest3d/ForestErrorBoundary';
import ForestMapScene from './forest3d/ForestMapScene';
import ForestMapOverlay from './forest3d/ForestMapOverlay';

export default function ForestMapPage() {
  const supported = useMemo(() => hasWebGL(), []);

  const layout = useMemo(() => {
    const pointsByChapter: Record<string, { id: string }[]> = {};
    for (const c of chapters) pointsByChapter[c.id] = chapterPoints(c.id);
    return buildForestLayout(chapters, pointsByChapter);
  }, []);

  const { litPointIds, litCount, pointMeta } = useMemo(() => {
    const lastId = readLastPoint();
    const lastIdx = lastId ? orderedPoints.findIndex((p) => p.id === lastId) : -1;
    const lit = new Set<string>();
    for (let i = 0; i <= lastIdx; i++) lit.add(orderedPoints[i].id);
    const meta: Record<string, { title: string; summary: string; chapterTitle: string }> = {};
    for (const p of orderedPoints) {
      meta[p.id] = {
        title: p.title,
        summary: p.shortSummary,
        chapterTitle: findChapter(p.clusterId)?.title ?? '',
      };
    }
    return { litPointIds: lit, litCount: lastIdx + 1, pointMeta: meta };
  }, []);

  const navigate = useNavigate();
  const onPickPoint = (pointId: string) => {
    const point = orderedPoints.find((p) => p.id === pointId);
    if (point) navigate(pointPath(point));
  };

  // 一键「回到最佳视角」：每次点击自增 nonce，ForestMapScene 据此平滑复位相机。
  const [resetNonce, setResetNonce] = useState(0);

  if (!supported) {
    return <ChapterMapPage />;
  }

  return (
    <main id="main-content" className="forest3d-page">
      <ForestErrorBoundary fallback={<ChapterMapPage />}>
        <ForestMapScene
          layout={layout}
          litPointIds={litPointIds}
          onPickPoint={onPickPoint}
          pointMeta={pointMeta}
          resetNonce={resetNonce}
        />
        <ForestMapOverlay
          litCount={litCount}
          total={orderedPoints.length}
          onResetView={() => setResetNonce((n) => n + 1)}
        />
      </ForestErrorBoundary>
    </main>
  );
}
