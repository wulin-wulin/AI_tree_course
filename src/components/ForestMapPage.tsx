import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// @ts-expect-error vendor JS（参考项目原样）
import { Scene3D } from '../forest/vendor/scene3d.js';
import { buildSceneInputs } from '../forest/forestAdapter';
import { type ForestIndex, type ClusterMeta } from '../forest/forestData';
import indexJson from '../data/index.json';

type RawIndex = ForestIndex & { clusters: ClusterMeta[]; points: Array<{ id: string; clusterId: string; title: string }> };
const FOREST_INDEX = indexJson as unknown as RawIndex;

type SceneHandle = {
  render: () => void;
  resize: (w: number, h: number) => void;
  raycast: (x: number, y: number) => string | null;
  flyTo: (id: string) => void;
  flyToCluster: (id: string) => void;
  resetView: () => void;
  setHover: (id: string | null) => void;
  getCameraHeight: () => number;
  setCameraHeight: (value: number) => void;
  onCameraChange: (fn: ((state: { phi: number; height: number }) => void) | null) => void;
  dispose: () => void;
};

function ForestMapPage() {
  const index = FOREST_INDEX;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);
  const legendDragRef = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const [query, setQuery] = useState('');
  const [legendHidden, setLegendHidden] = useState(false);
  const [legendPosition, setLegendPosition] = useState<{ x: number; y: number } | null>(null);
  const [cameraHeight, setCameraHeight] = useState(46);

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
    const scene = new Scene3D(el, layout, data) as SceneHandle;
    sceneRef.current = scene;
    scene.onCameraChange((state) => setCameraHeight(state.height));

    let raf = 0;
    const loop = () => { raf = requestAnimationFrame(loop); scene.render(); };
    loop();
    const onResize = () => scene.resize(el.clientWidth, el.clientHeight);
    window.addEventListener('resize', onResize);
    requestAnimationFrame(onResize);

    // 区分「点击」与「拖拽」：拖拽（平移/转视角）松手不应误触发进入阅读页
    let downX = 0;
    let downY = 0;
    let dragging = false;
    const onPointerDown = (e: PointerEvent) => { downX = e.clientX; downY = e.clientY; dragging = true; };
    const onClick = (e: MouseEvent) => {
      if (Math.abs(e.clientX - downX) > 6 || Math.abs(e.clientY - downY) > 6) return; // 发生了拖拽，忽略
      const id = scene.raycast(e.clientX, e.clientY);
      if (id) openReadingRef.current(id);
    };
    // 悬停高亮：远景默认隐藏树标签，鼠标移到某棵树时单独显示它的名字 + 手型光标
    const onPointerMove = (e: PointerEvent) => {
      if (dragging) return;
      const id = scene.raycast(e.clientX, e.clientY);
      scene.setHover(id);
      el.style.cursor = id ? 'pointer' : '';
    };
    const onPointerUpHover = () => { dragging = false; };
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUpHover);
    el.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUpHover);
      el.removeEventListener('click', onClick);
      scene.onCameraChange(null);
      scene.dispose(); // 解绑 Scene3D 的指针/滚轮监听，避免 StrictMode 双挂载残留
      el.replaceChildren(); // 清空 Scene3D 注入的 canvas/标签层
      sceneRef.current = null;
    };
  }, [index]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index.points.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 12);
  }, [query, index]);

  const clampLegendPosition = (x: number, y: number, width: number, height: number) => {
    const margin = 12;
    const topLimit = 58;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(topLimit, window.innerHeight - height - margin);
    return {
      x: Math.min(Math.max(margin, x), maxX),
      y: Math.min(Math.max(topLimit, y), maxY),
    };
  };

  const startLegendDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const panel = legendRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    legendDragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    setLegendPosition({ x: rect.left, y: rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const moveLegendDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = legendDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const pos = clampLegendPosition(e.clientX - drag.offsetX, e.clientY - drag.offsetY, drag.width, drag.height);
    setLegendPosition(pos);
    e.preventDefault();
  };

  const endLegendDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = legendDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    legendDragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  const cameraHeightLabel = cameraHeight < 34 ? '高' : cameraHeight < 68 ? '中' : '低';

  const changeCameraHeight = (value: number) => {
    setCameraHeight(value);
    sceneRef.current?.setCameraHeight(value);
  };

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
          onChange={(e) => { const c = e.target.value; if (c) sceneRef.current?.flyToCluster(c); }}
        >
          <option value="">— 跳到知识簇 —</option>
          {index.clusters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button type="button" className="forest-reset" title="重置视图" onClick={() => sceneRef.current?.resetView()}>⟳</button>
      </header>

      <div className="forest-camera-height-control" aria-label="视角高度控制">
        <div className="forest-camera-height-head">
          <span>视角高度</span>
          <output>{cameraHeightLabel}</output>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={cameraHeight}
          aria-label="调整视角高度"
          onChange={(e) => changeCameraHeight(Number(e.target.value))}
        />
      </div>

      <div id="forest-canvas-container" ref={containerRef} />

      {!legendHidden ? (
        <div
          id="forest-legend"
          ref={legendRef}
          style={legendPosition ? { left: legendPosition.x, top: legendPosition.y, bottom: 'auto' } : undefined}
        >
          <div
            className="forest-legend-header"
            onPointerDown={startLegendDrag}
            onPointerMove={moveLegendDrag}
            onPointerUp={endLegendDrag}
            onPointerCancel={endLegendDrag}
          >
            <h4>知识簇</h4>
            <button type="button" className="forest-legend-hide" aria-label="隐藏知识簇导览" onClick={() => setLegendHidden(true)}>
              隐藏
            </button>
          </div>
          <div className="forest-legend-list">
            {index.clusters.map((c) => (
              <button key={c.id} type="button" className="forest-legend-item" onClick={() => sceneRef.current?.flyToCluster(c.id)}>
                <span className="forest-legend-color" style={{ background: c.accent }} />
                <span className="forest-legend-name">{c.title}</span>
                <small>({countByCluster[c.id] || 0})</small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className="forest-legend-restore" aria-label="恢复知识簇导览" onClick={() => setLegendHidden(false)}>
          知识簇
        </button>
      )}
    </main>
  );
}

export default ForestMapPage;
