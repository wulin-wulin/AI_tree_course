import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { chapters, orderedPoints, pointPath, readLastPoint } from '../data/courseNav';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

/*
 * R010 · 知识森林地图 → 矩形之字形（蛇形）徒步长卷
 * 一条由「水平行 + 直角竖直转弯」组成的蛇形路，自上而下串起全部 49 个小节 + 8 个章节地标。
 * 树不落在路上，而是沿每个水平行交替分布到路的「上 / 下两侧」（朝上的标题朝上排、朝下的朝下排，
 * 避免压住路面），形成林荫道；路居中保持干净，并按章节分段染色。布局随容器宽度自适应。
 */

type Pt = { x: number; y: number };

// 确定性伪随机（mulberry32）：用于装饰背景树的确定性散布。
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 沿路按弧长取精确点（线性插值）。
function interpAt(pts: Pt[], cum: number[], total: number, arc: number): Pt {
  const a = Math.max(0, Math.min(total, arc));
  let i = 1;
  while (i < cum.length - 1 && cum[i] < a) i += 1;
  const span = cum[i] - cum[i - 1] || 1e-6;
  const t = (a - cum[i - 1]) / span;
  return {
    x: +(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t).toFixed(1),
    y: +(pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t).toFixed(1),
  };
}

function polylineD(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

// 章节路段染色用：取弧长区间 [a,b] 的折线，两端用精确插值点。相邻章节段共享边界点 → 平头对接、无重叠。
function segPath(pts: Pt[], cum: number[], total: number, a: number, b: number): string {
  const start = interpAt(pts, cum, total, a);
  const end = interpAt(pts, cum, total, b);
  const mid: Pt[] = [];
  for (let i = 0; i < pts.length; i += 1) if (cum[i] > a && cum[i] < b) mid.push(pts[i]);
  return polylineD([start, ...mid, end]);
}

type TrailItem = {
  key: string;
  kind: 'landmark' | 'point';
  chapter: KnowledgeCluster;
  chapterIndex: number;
  point?: KnowledgePoint;
  pointGlobalIndex: number;
  x: number;
  y: number;
  above: boolean; // true = 树在路上方（标题朝上排，避免压在路面）
  cardAlign: 'left' | 'center' | 'right';
};

type DecoTree = { x: number; y: number; s: number; species: number };

type Layout = {
  width: number;
  height: number;
  items: TrailItem[];
  trailD: string;
  segments: { d: string; accent: string }[];
  deco: DecoTree[];
  landmarkSize: number;
  pointSize: number;
  firstPos: Pt;
  lastPos: Pt;
};

// 把矩形角点序列变成「圆角」蛇形，并拍平成密集折线（直角转弯处用二次贝塞尔倒角）。
function roundedSerpentine(corners: Pt[], R: number): { pts: Pt[]; cum: number[]; total: number } {
  const pts: Pt[] = [];
  const pushLine = (from: Pt, to: Pt) => {
    const d = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.round(d / 16));
    for (let k = 1; k <= steps; k += 1) {
      pts.push({ x: from.x + (to.x - from.x) * (k / steps), y: from.y + (to.y - from.y) * (k / steps) });
    }
  };
  pts.push(corners[0]);
  for (let i = 1; i < corners.length - 1; i += 1) {
    const prev = corners[i - 1];
    const cur = corners[i];
    const next = corners[i + 1];
    const inLen = Math.hypot(cur.x - prev.x, cur.y - prev.y) || 1e-6;
    const outLen = Math.hypot(next.x - cur.x, next.y - cur.y) || 1e-6;
    const rr = Math.min(R, inLen / 2, outLen / 2);
    const pA = { x: cur.x - ((cur.x - prev.x) / inLen) * rr, y: cur.y - ((cur.y - prev.y) / inLen) * rr };
    const pB = { x: cur.x + ((next.x - cur.x) / outLen) * rr, y: cur.y + ((next.y - cur.y) / outLen) * rr };
    pushLine(pts[pts.length - 1], pA);
    const arcSteps = 8;
    for (let k = 1; k <= arcSteps; k += 1) {
      const t = k / arcSteps;
      const u = 1 - t;
      pts.push({
        x: u * u * pA.x + 2 * u * t * cur.x + t * t * pB.x,
        y: u * u * pA.y + 2 * u * t * cur.y + t * t * pB.y,
      });
    }
  }
  pushLine(pts[pts.length - 1], corners[corners.length - 1]);
  const cum = [0];
  for (let i = 1; i < pts.length; i += 1) {
    cum[i] = cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return { pts, cum, total: cum[cum.length - 1] };
}

// 把一个点投影到道路折线上，返回其弧长（取最近折线点）。用于章节分段染色的边界定位。
function arcOfPoint(pts: Pt[], cum: number[], p: Pt): number {
  let best = 0;
  let bd = Infinity;
  for (let i = 0; i < pts.length; i += 1) {
    const d = (pts[i].x - p.x) ** 2 + (pts[i].y - p.y) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return cum[best];
}

const SPECIES_BY_CHAPTER = [0, 1, 2, 3, 4, 5, 6, 7] as const;
const PATH_SEED = 7; // 装饰背景树散布用的随机种子

function computeLayout(width: number): Layout {
  const w = width > 0 ? width : 960;
  const perRow = w >= 600 ? 5 : 4; // 每个水平行放几棵树
  const padX = w >= 600 ? 92 : 46;
  const leftX = padX;
  const rightX = w - padX;
  const rowLen = rightX - leftX;
  const rowH = w >= 600 ? 300 : 286; // 行间竖向距离
  const cornerR = 30; // 转弯圆角半径
  const inset = w >= 600 ? 104 : 76; // 行两端留白：树内缩，圆角与竖直连接段上不放树
  const roadHalf = 12; // 路面半宽
  const rootGap = 13; // 树根（阴影中心）离路沿外侧的缝（保证树根不落在路面上）
  const padTop = w >= 600 ? 178 : 150;
  const padBottom = w >= 600 ? 150 : 128;
  const landmarkSize = w >= 600 ? 150 : 108; // 桌面约 2×
  const pointSize = w >= 600 ? 104 : 76; // 桌面约 2×

  // 旅程序列：每章先地标，再它的小节。
  const seq: {
    kind: 'landmark' | 'point';
    chapter: KnowledgeCluster;
    chapterIndex: number;
    point?: KnowledgePoint;
  }[] = [];
  chapters.forEach((chapter, ci) => {
    seq.push({ kind: 'landmark', chapter, chapterIndex: ci });
    orderedPoints
      .filter((p) => p.clusterId === chapter.id)
      .forEach((point) => seq.push({ kind: 'point', chapter, chapterIndex: ci, point }));
  });
  const N = seq.length;

  // 1) 矩形之字形（蛇形）：水平行 + 直角转弯（圆角化）。树沿水平行均匀排、内缩避开转弯，
  //    并交替分布到路的「上 / 下两侧」（树根贴路沿外侧，不落在路面上）。
  const P = perRow;
  const R = Math.ceil(N / P);
  const innerLeft = leftX + inset;
  const innerRight = rightX - inset;
  const innerLen = innerRight - innerLeft;
  // 每个 item 在路上的基点 (x, rowY)（作为树的对齐基准与染色定位；树根再偏到路沿外）
  const bases = seq.map((_, i) => {
    const r = Math.floor(i / P);
    const c = i % P;
    const colPos = r % 2 === 0 ? c : P - 1 - c; // 蛇形：偶数行左→右，奇数行右→左
    const x = innerLeft + (P > 1 ? colPos / (P - 1) : 0.5) * innerLen;
    return { x, rowY: padTop + r * rowH };
  });

  // 2) 道路角点：整行铺满 leftX..rightX（树内缩 → 转弯/连接段无树），最后一行到最后一棵树列。
  const lastX = bases[N - 1].x;
  const corners: Pt[] = [];
  let curX = leftX;
  for (let r = 0; r < R; r += 1) {
    const rowY = padTop + r * rowH;
    const startX = curX;
    const endX = r === R - 1 ? lastX : startX === leftX ? rightX : leftX;
    corners.push({ x: startX, y: rowY });
    corners.push({ x: endX, y: rowY });
    curX = endX;
  }
  const { pts, cum, total } = roundedSerpentine(corners, cornerR);

  const pointIndexById = new Map(orderedPoints.map((p, i) => [p.id, i] as const));
  const items: TrailItem[] = seq.map((entry, i) => {
    const b = bases[i];
    const above = i % 2 !== 0; // 交替上 / 下两侧
    const y = above ? b.rowY - (roadHalf + rootGap) : b.rowY + (roadHalf + rootGap); // 树根贴路沿外侧
    const xFrac = b.x / w;
    const cardAlign: TrailItem['cardAlign'] = xFrac < 0.3 ? 'left' : xFrac > 0.7 ? 'right' : 'center';
    return {
      key: entry.kind === 'landmark' ? `c-${entry.chapter.id}` : entry.point!.id,
      kind: entry.kind,
      chapter: entry.chapter,
      chapterIndex: entry.chapterIndex,
      point: entry.point,
      pointGlobalIndex: entry.point ? pointIndexById.get(entry.point.id)! : -1,
      x: b.x,
      y,
      above,
      cardAlign,
    };
  });

  // 3) 道路按章节分段染色：用每个 item 路上基点投影到弧长，取相邻章节中点为边界，精确对接不重叠。
  const baseArcs = bases.map((b) => arcOfPoint(pts, cum, { x: b.x, y: b.rowY }));
  const segments = chapters.map((chapter, ci) => {
    const idxs = items.map((it, i) => (it.chapterIndex === ci ? i : -1)).filter((i) => i >= 0);
    const a = idxs[0];
    const b = idxs[idxs.length - 1];
    const startArc = a === 0 ? 0 : (baseArcs[a - 1] + baseArcs[a]) / 2;
    const endArc = b === N - 1 ? total : (baseArcs[b] + baseArcs[b + 1]) / 2;
    return { d: segPath(pts, cum, total, startArc, endArc), accent: chapter.accent };
  });

  const height = Math.ceil(padTop + (R - 1) * rowH + (roadHalf + rootGap) + padBottom);

  // 4) 稀疏装饰背景树：填补外侧空隙，纯视觉、避开主路（落在最外 8% 边缘带）。
  const deco: DecoTree[] = [];
  const decoRnd = mulberry32(PATH_SEED * 31 + 5);
  const decoRows = Math.floor(height / 150);
  for (let r = 0; r < decoRows; r += 1) {
    const onLeft = decoRnd() < 0.5;
    const x = onLeft ? w * (0.015 + decoRnd() * 0.05) : w * (0.94 + decoRnd() * 0.045);
    const yy = padTop + r * 150 + decoRnd() * 90;
    if (yy > height - 40) continue;
    deco.push({ x, y: yy, s: 0.5 + decoRnd() * 0.3, species: Math.floor(decoRnd() * 8) });
  }

  return {
    width: w,
    height,
    items,
    trailD: polylineD(pts),
    segments,
    deco,
    landmarkSize,
    pointSize,
    firstPos: corners[0],
    lastPos: corners[corners.length - 1],
  };
}

function ChapterMapPage() {
  const navigate = useNavigate();
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = sceneRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => computeLayout(width), [width]);

  const lastPointIndex = useMemo(() => {
    const lastId = readLastPoint();
    if (!lastId) return -1;
    return orderedPoints.findIndex((p) => p.id === lastId);
  }, []);
  const progressCount = lastPointIndex + 1;

  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const showPreview = useCallback((key: string) => setPreviewKey(key), []);
  const hidePreview = useCallback(
    (key: string) => setPreviewKey((cur) => (cur === key ? null : cur)),
    [],
  );

  const handleItemClick = useCallback(
    (item: TrailItem) => {
      if (item.kind === 'point' && item.point) {
        navigate(pointPath(item.point));
        return;
      }
      const first = orderedPoints.find((p) => p.clusterId === item.chapter.id);
      if (first) navigate(pointPath(first));
    },
    [navigate],
  );

  return (
    <main id="main-content" className="page forest-trail-page" aria-label="人工智能原理章节学习路径">
      <div className="trail-topbar">
        <Link className="back-link" to="/">
          <ChevronLeft size={16} aria-hidden="true" />
          返回书架
        </Link>
        <p className="trail-topbar-title">知识森林地图</p>
        <div className="trail-progress" aria-label={`已点亮 ${progressCount} / ${orderedPoints.length} 个知识点`}>
          <span className="trail-progress-text">
            已点亮 {progressCount}/{orderedPoints.length}
          </span>
          <span className="trail-progress-bar" aria-hidden="true">
            <span
              className="trail-progress-fill"
              style={{ width: `${(progressCount / orderedPoints.length) * 100}%` }}
            />
          </span>
        </div>
      </div>

      <header className="trail-head">
        <p className="chapter-eyebrow">人工智能原理</p>
        <h1 className="chapter-title">沿小径走过知识森林</h1>
        <p className="chapter-sub">
          一条小路从林口蜿蜒到林深处，串起 {chapters.length} 个章节、{orderedPoints.length} 个知识点。
          向下滚动一路走过，点开任意一棵小树就从那一节读起。
        </p>
      </header>

      <div className="forest-trail-wrap">
        <div
          className="forest-trail-scene"
          ref={sceneRef}
          style={{ height: `${layout.height}px` } as CSSProperties}
        >
          <svg
            className="trail-backdrop"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width}
            height={layout.height}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* 装饰背景树（纯视觉，外侧空隙） */}
            {layout.deco.map((t, i) => (
              <g
                key={`deco-${i}`}
                transform={`translate(${t.x} ${t.y}) scale(${t.s})`}
                className="trail-deco-tree"
              >
                <polygon points="0,-34 -13,0 13,0" />
                <rect x="-2.4" y="0" width="4.8" height="9" />
              </g>
            ))}

            {/* 小路：底色土带 + 各章分段染色 + 中线虚线 */}
            <path className="trail-band" d={layout.trailD} />
            {layout.segments.map((s, i) => (
              <path key={`seg-${i}`} className="trail-seg" d={s.d} style={{ stroke: s.accent } as CSSProperties} />
            ))}
            <path className="trail-dash" d={layout.trailD} />

            <text className="trail-mark" x={layout.firstPos.x} y={layout.firstPos.y - 56} textAnchor="middle">
              林口
            </text>
            <text className="trail-mark" x={layout.lastPos.x} y={layout.height - 44} textAnchor="middle">
              林深处
            </text>
          </svg>

          <ol className="forest-trail-nodes">
            {layout.items.map((item) => {
              const isLandmark = item.kind === 'landmark';
              const isCurrent = !isLandmark && item.pointGlobalIndex === lastPointIndex;
              const chapterFirstIndex = orderedPoints.findIndex((p) => p.clusterId === item.chapter.id);
              const isVisited = isLandmark
                ? lastPointIndex >= chapterFirstIndex
                : item.pointGlobalIndex <= lastPointIndex;
              const isPreviewed = previewKey === item.key;
              const title = isLandmark ? item.chapter.title : item.point!.title;
              const size = isLandmark ? layout.landmarkSize : layout.pointSize;
              const ariaLabel = isLandmark
                ? `第 ${item.chapterIndex + 1} 章 ${item.chapter.title}，进入本章`
                : `${item.point!.title}，第 ${item.pointGlobalIndex + 1} / ${orderedPoints.length} 个知识点，${item.point!.difficulty}，进入阅读`;

              return (
                <li
                  key={item.key}
                  className="trail-slot"
                  style={{ left: `${item.x}px`, top: `${item.y}px` } as CSSProperties}
                >
                  <button
                    type="button"
                    className={`trail-node ${isLandmark ? 'is-landmark' : 'is-point'} ${
                      isVisited ? 'is-visited' : ''
                    } ${isCurrent ? 'is-current' : ''} ${isPreviewed ? 'is-previewed' : ''} ${
                      item.above ? 'node-above' : ''
                    } card-${item.cardAlign}`}
                    aria-label={ariaLabel}
                    onClick={() => handleItemClick(item)}
                    onPointerEnter={() => showPreview(item.key)}
                    onPointerLeave={() => hidePreview(item.key)}
                    onFocus={() => showPreview(item.key)}
                    onBlur={() => hidePreview(item.key)}
                    style={
                      {
                        '--chapter-accent': item.chapter.accent,
                        '--chapter-soft': item.chapter.soft,
                        '--chapter-dark': item.chapter.dark,
                        '--node-size': `${size}px`,
                      } as CSSProperties
                    }
                  >
                    <span className="node-art" aria-hidden="true">
                      <TreeArt species={SPECIES_BY_CHAPTER[item.chapterIndex]} />
                    </span>
                    <span className="node-label">
                      {isLandmark ? (
                        <span className="node-index" aria-hidden="true">
                          {String(item.chapterIndex + 1).padStart(2, '0')}
                        </span>
                      ) : null}
                      <span className="node-title">{title}</span>
                      {isCurrent ? (
                        <span className="node-here">
                          <MapPin size={12} aria-hidden="true" />
                          上次读到这里
                        </span>
                      ) : null}
                    </span>

                    <span className="node-card" role="presentation">
                      {isLandmark ? (
                        <>
                          <span className="node-card-eyebrow">第 {item.chapterIndex + 1} 章</span>
                          <span className="node-card-title">{item.chapter.title}</span>
                          <span className="node-card-desc">{item.chapter.subtitle}</span>
                        </>
                      ) : (
                        <>
                          <span className="node-card-eyebrow">
                            {item.chapter.title} · {item.point!.difficulty}
                          </span>
                          <span className="node-card-title">{item.point!.title}</span>
                          <span className="node-card-desc">{item.point!.shortSummary}</span>
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </main>
  );
}

// ── 8 种扁平几何树种剪影；共用 .tree-crown / .tree-shade / .tree-trunk 类，便于按状态着色 ──
function TreeArt({ species }: { species: number }) {
  return (
    <svg viewBox="0 0 60 84" className="tree-svg" role="img" aria-hidden="true">
      <ellipse className="tree-shadow" cx="30" cy="74" rx="15" ry="3.4" />
      {renderSpecies(species)}
    </svg>
  );
}

function renderSpecies(species: number) {
  switch (species) {
    case 0: // 层叠针叶松
      return (
        <>
          <rect className="tree-trunk" x="26.5" y="60" width="7" height="14" rx="2" />
          <polygon className="tree-crown" points="30,40 10,62 50,62" />
          <polygon className="tree-shade" points="30,40 30,62 50,62" />
          <polygon className="tree-crown" points="30,23 14,45 46,45" />
          <polygon className="tree-shade" points="30,23 30,45 46,45" />
          <polygon className="tree-crown" points="30,8 18,28 42,28" />
          <polygon className="tree-shade" points="30,8 30,28 42,28" />
        </>
      );
    case 1: // 高瘦白杨（柱状）
      return (
        <>
          <rect className="tree-trunk" x="27" y="62" width="6" height="12" rx="2" />
          <ellipse className="tree-crown" cx="30" cy="34" rx="13" ry="30" />
          <path className="tree-shade" d="M30 5 A13 30 0 0 1 30 64 Z" />
        </>
      );
    case 2: // 圆冠阔叶树
      return (
        <>
          <rect className="tree-trunk" x="26.5" y="56" width="7" height="18" rx="2" />
          <circle className="tree-crown" cx="30" cy="32" r="22" />
          <path className="tree-shade" d="M30 10 A22 22 0 0 1 30 54 Z" />
        </>
      );
    case 3: // 宽冠橡树
      return (
        <>
          <rect className="tree-trunk" x="26" y="52" width="8" height="22" rx="2.5" />
          <ellipse className="tree-crown" cx="30" cy="34" rx="27" ry="18" />
          <circle className="tree-crown" cx="16" cy="26" r="11" />
          <circle className="tree-crown" cx="44" cy="26" r="11" />
          <path className="tree-shade" d="M30 16 A27 18 0 0 1 30 52 Z" />
        </>
      );
    case 4: // 柱形塔柏（细高三角）
      return (
        <>
          <rect className="tree-trunk" x="27" y="64" width="6" height="10" rx="2" />
          <polygon className="tree-crown" points="30,4 17,66 43,66" />
          <polygon className="tree-shade" points="30,4 30,66 43,66" />
        </>
      );
    case 5: // 细干桦树（纤细多叉小冠）
      return (
        <>
          <rect className="tree-trunk" x="28" y="44" width="4" height="30" rx="1.5" />
          <ellipse className="tree-crown" cx="30" cy="26" rx="15" ry="20" />
          <ellipse className="tree-crown" cx="19" cy="34" rx="8" ry="11" />
          <ellipse className="tree-crown" cx="42" cy="33" rx="8" ry="11" />
          <path className="tree-shade" d="M30 6 A15 20 0 0 1 30 46 Z" />
        </>
      );
    case 6: // 垂枝柳（圆顶 + 下垂枝梢）
      return (
        <>
          <rect className="tree-trunk" x="27" y="58" width="6" height="16" rx="2" />
          <ellipse className="tree-crown" cx="30" cy="28" rx="24" ry="18" />
          <path className="tree-shade" d="M30 10 A24 18 0 0 1 30 46 Z" />
          <ellipse className="tree-crown" cx="12" cy="42" rx="4.5" ry="11" />
          <ellipse className="tree-crown" cx="24" cy="48" rx="4" ry="12" />
          <ellipse className="tree-crown" cx="36" cy="48" rx="4" ry="12" />
          <ellipse className="tree-crown" cx="48" cy="42" rx="4.5" ry="11" />
        </>
      );
    case 7: // 团簇矮灌丛
    default:
      return (
        <>
          <rect className="tree-trunk" x="28" y="58" width="4" height="16" rx="1.5" />
          <circle className="tree-crown" cx="20" cy="46" r="15" />
          <circle className="tree-crown" cx="42" cy="46" r="15" />
          <circle className="tree-crown" cx="30" cy="34" r="17" />
          <path className="tree-shade" d="M30 17 A17 17 0 0 1 30 51 Z" />
        </>
      );
  }
}

export default ChapterMapPage;
