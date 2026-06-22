import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-expect-error vendor JS（参考项目原样）
import { Scene3D } from '../forest/vendor/scene3d.js';
import { buildSceneInputs } from '../forest/forestAdapter';
import { loadPoint, type ForestIndex, type FullPoint, type ClusterMeta } from '../forest/forestData';
import indexJson from '../data/index.json';
import ForestPointPanel from './ForestPointPanel';

type RawIndex = ForestIndex & { clusters: ClusterMeta[]; points: Array<{ id: string; clusterId: string; title: string }> };
const FOREST_INDEX = indexJson as unknown as RawIndex;

function ForestMapPage() {
  const index = FOREST_INDEX;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{ render: () => void; resize: (w: number, h: number) => void; raycast: (x: number, y: number) => string | null; flyTo: (id: string) => void; highlightTree: (id: string) => void; unhighlightAll: () => void; resetView: () => void } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [point, setPoint] = useState<FullPoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const clusterById = useMemo(() => {
    const m: Record<string, ClusterMeta> = {};
    for (const c of index.clusters) m[c.id] = c;
    return m;
  }, [index]);

  const countByCluster = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of index.points) m[p.clusterId] = (m[p.clusterId] || 0) + 1;
    return m;
  }, [index]);

  // 启动 Scene3D（参考项目原生场景）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { layout, data } = buildSceneInputs(index);
    const scene = new Scene3D(el, layout, data);
    sceneRef.current = scene;

    let raf = 0;
    const loop = () => { raf = requestAnimationFrame(loop); scene.render(); };
    loop();
    const onResize = () => scene.resize(el.clientWidth, el.clientHeight);
    window.addEventListener('resize', onResize);
    requestAnimationFrame(onResize);

    const onClick = (e: MouseEvent) => {
      const id = scene.raycast(e.clientX, e.clientY);
      if (id) setSelectedId(id);
    };
    el.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('click', onClick);
      // Scene3D 把 canvas 与标签层 append 到容器；卸载（含 StrictMode 双挂载）时清空，避免叠加。
      el.replaceChildren();
      sceneRef.current = null;
    };
  }, [index]);

  // 选中 → 高亮 + 飞向 + 懒加载详情
  useEffect(() => {
    const scene = sceneRef.current;
    if (!selectedId) {
      setPoint(null);
      scene?.unhighlightAll();
      return;
    }
    scene?.flyTo(selectedId);
    scene?.highlightTree(selectedId);
    let alive = true;
    setLoading(true);
    loadPoint(selectedId)
      .then((p) => { if (alive) { setPoint(p); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [selectedId]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.points.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 12);
  }, [query, index]);

  const selectedClusterId = point?.clusterId ?? index.points.find((p) => p.id === selectedId)?.clusterId;

  return (
    <main id="main-content" className="forest-parity-page" aria-label="人工智能知识森林">
      <header id="forest-topbar">
        <Link className="forest-home-link" to="/">← 书架</Link>
        <h1>AI 知识森林</h1>
        <div className="forest-search">
          <input
            type="text"
            placeholder="搜索知识点…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length ? (
            <div className="forest-search-results">
              {results.map((r) => (
                <button key={r.id} type="button" onClick={() => { setSelectedId(r.id); setQuery(''); }}>
                  <strong>{r.title}</strong>
                  <small>{clusterById[r.clusterId]?.title}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <select
          className="forest-region-select"
          value=""
          onChange={(e) => { const c = e.target.value; if (c) sceneRef.current?.flyTo(c); }}
        >
          <option value="">— 跳到知识簇 —</option>
          {index.clusters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button type="button" className="forest-reset" title="重置视图" onClick={() => sceneRef.current?.resetView()}>⟳</button>
      </header>

      <div id="forest-canvas-container" ref={containerRef} />

      <div id="forest-legend">
        <h4>知识簇</h4>
        <div className="forest-legend-list">
          {index.clusters.map((c) => (
            <button key={c.id} type="button" className="forest-legend-item" onClick={() => sceneRef.current?.flyTo(c.id)}>
              <span className="forest-legend-color" style={{ background: c.accent }} />
              {c.title} <small>({countByCluster[c.id] || 0})</small>
            </button>
          ))}
        </div>
      </div>

      {selectedId ? (
        <ForestPointPanel
          point={point}
          cluster={selectedClusterId ? clusterById[selectedClusterId] : undefined}
          loading={loading}
          readingHref={selectedId && selectedClusterId ? `#/ai/${selectedClusterId}/${selectedId}` : undefined}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </main>
  );
}

export default ForestMapPage;
