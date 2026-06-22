import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// @ts-expect-error vendor JS（参考项目原样）
import { Scene3D } from '../forest/vendor/scene3d.js';
import { buildSceneInputs } from '../forest/forestAdapter';
import { type ForestIndex, type ClusterMeta } from '../forest/forestData';
import indexJson from '../data/index.json';

type RawIndex = ForestIndex & { clusters: ClusterMeta[]; points: Array<{ id: string; clusterId: string; title: string }> };
const FOREST_INDEX = indexJson as unknown as RawIndex;

function ForestMapPage() {
  const index = FOREST_INDEX;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{ render: () => void; resize: (w: number, h: number) => void; raycast: (x: number, y: number) => string | null; flyTo: (id: string) => void; resetView: () => void } | null>(null);
  const [query, setQuery] = useState('');

  const clusterById = useMemo(() => {
    const m: Record<string, ClusterMeta> = {};
    for (const c of index.clusters) m[c.id] = c;
    return m;
  }, [index]);

  const clusterOfPoint = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of index.points) m[p.id] = p.clusterId;
    return m;
  }, [index]);

  const countByCluster = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of index.points) m[p.clusterId] = (m[p.clusterId] || 0) + 1;
    return m;
  }, [index]);

  // 点击/搜索 → 进入原阅读页
  const openReading = (id: string) => {
    const clusterId = clusterOfPoint[id];
    if (clusterId) navigate(`/ai/${clusterId}/${id}`);
  };
  const openReadingRef = useRef(openReading);
  openReadingRef.current = openReading;

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
      if (id) openReadingRef.current(id);
    };
    el.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('click', onClick);
      el.replaceChildren(); // 清空 Scene3D 注入的 canvas/标签层（含 StrictMode 双挂载）
      sceneRef.current = null;
    };
  }, [index]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.points.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 12);
  }, [query, index]);

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
                <button key={r.id} type="button" onClick={() => { setQuery(''); openReading(r.id); }}>
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
    </main>
  );
}

export default ForestMapPage;
