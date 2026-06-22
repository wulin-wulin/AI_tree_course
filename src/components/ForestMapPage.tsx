import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ForestScene } from '../forest/ForestScene';
import { loadPoint, type ForestIndex, type FullPoint, type ClusterMeta } from '../forest/forestData';
import indexJson from '../data/index.json';
import ForestPointPanel from './ForestPointPanel';

const FOREST_INDEX = indexJson as unknown as ForestIndex;

function ForestMapPage() {
  const index = FOREST_INDEX;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ForestScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [point, setPoint] = useState<FullPoint | null>(null);
  const [loading, setLoading] = useState(false);

  const clusterById = useMemo(() => {
    const m: Record<string, ClusterMeta> = {};
    for (const c of index.clusters) m[c.id] = c;
    return m;
  }, [index]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new ForestScene(canvasRef.current, index);
    scene.onPick((id) => setSelectedId(id));
    sceneRef.current = scene;
    const onResize = () => scene.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      scene.dispose();
      sceneRef.current = null;
    };
  }, [index]);

  useEffect(() => {
    sceneRef.current?.highlight(selectedId);
    if (!selectedId) {
      setPoint(null);
      return;
    }
    let alive = true;
    setLoading(true);
    loadPoint(selectedId)
      .then((p) => {
        if (alive) {
          setPoint(p);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedId]);

  const selectedClusterId =
    point?.clusterId ?? index.points.find((p) => p.id === selectedId)?.clusterId;

  return (
    <main id="main-content" className="page forest-3d-page" aria-label="人工智能知识森林">
      <header className="chapter-head forest-3d-head">
        <Link className="back-link" to="/">
          <ChevronLeft size={16} aria-hidden="true" />
          返回书架
        </Link>
        <p className="chapter-eyebrow">人工智能原理</p>
        <h1 className="chapter-title">知识森林</h1>
        <p className="chapter-sub">
          {index.points.length} 棵树就是 {index.points.length} 个知识点，分布在 {index.clusters.length} 个知识簇。
          滚轮缩放、拖拽平移，点击任意一棵树查看详情。
        </p>
      </header>

      <div className="forest-3d-stage">
        <div ref={canvasRef} className="forest-3d-canvas" />
        {selectedId ? (
          <ForestPointPanel
            point={point}
            cluster={selectedClusterId ? clusterById[selectedClusterId] : undefined}
            loading={loading}
            readingHref={selectedId && selectedClusterId ? `#/ai/${selectedClusterId}/${selectedId}` : undefined}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </div>
    </main>
  );
}

export default ForestMapPage;
