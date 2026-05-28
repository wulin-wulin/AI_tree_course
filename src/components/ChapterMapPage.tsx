import { useCallback, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { knowledgePoints } from '../data/courseKnowledge';
import { chapters, chapterPoints, findPoint, pointPath, readLastPoint } from '../data/courseNav';
import ChapterPreviewDialog from './ChapterPreviewDialog';

// 俯览式地图画布，接近均衡比例（不太宽不太长）。所有坐标基于该 viewBox。
const SCENE = { w: 1000, h: 700 } as const;

// 8 个章节节点蛇形折返铺排（3 / 3 / 2 三行）：
// 第 1 行左→右、第 2 行右→左、第 3 行左→右，横纵间距均匀。
const NODES = [
  { x: 200, y: 190 }, // 01
  { x: 500, y: 190 }, // 02
  { x: 800, y: 190 }, // 03  行末向下折返
  { x: 800, y: 395 }, // 04
  { x: 500, y: 395 }, // 05
  { x: 200, y: 395 }, // 06  行末向下折返
  { x: 200, y: 600 }, // 07
  { x: 500, y: 600 }, // 08
] as const;

// 纯装饰的散布背景树（aria-hidden），营造森林纵深；不承载章节信息、避开章节节点位置。
const BG_TREES = [
  { x: 110, y: 300, s: 0.78 },
  { x: 360, y: 300, s: 0.95 },
  { x: 650, y: 300, s: 0.82 },
  { x: 895, y: 300, s: 0.9 },
  { x: 350, y: 505, s: 0.86 },
  { x: 660, y: 505, s: 0.96 },
  { x: 890, y: 505, s: 0.8 },
  { x: 700, y: 640, s: 0.92 },
  { x: 895, y: 660, s: 0.82 },
] as const;

type Point = { x: number; y: number };

// Catmull-Rom 转三次贝塞尔，画出平滑且自然弯曲的小径。
function buildTrail(points: readonly Point[]): string {
  if (points.length < 2) {
    return '';
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function ChapterMapPage() {
  const navigate = useNavigate();
  const trail = useMemo(() => buildTrail(NODES), []);

  const counts = useMemo(() => chapters.map((chapter) => chapterPoints(chapter.id).length), []);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  // 轻量进度：从上次阅读的知识点推回章节，并把走到该章为止的树视作「已长成 / 点亮」。
  const lastChapterIndex = useMemo(() => {
    const last = readLastPoint();
    const clusterId = last ? findPoint(last)?.clusterId : undefined;
    return clusterId ? chapters.findIndex((chapter) => chapter.id === clusterId) : -1;
  }, []);

  // 点击章节树 → 弹出本章预览方框（不再直接跳首点）；记住触发树，关闭时焦点回到该树。
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // 同一时刻最多一张悬浮预览卡；由 JS 状态统一驱动（取代原来的 :hover / :focus-visible CSS 触发）。
  const [previewedChapterId, setPreviewedChapterId] = useState<string | null>(null);
  // 关闭方框后，焦点会被程序化还回触发树；如果 ESC 关闭，浏览器处于「键盘交互」模式，
  // 此时 onFocus 会被触发——用一个短暂的标志位抑制这次自动焦点带来的预览，避免 bug 残留。
  const suppressFocusPreviewRef = useRef(false);

  const handleTreeClick = useCallback((chapterId: string, button: HTMLButtonElement) => {
    triggerRef.current = button;
    setPreviewedChapterId(null);
    setOpenChapterId((current) => (current === chapterId ? null : chapterId));
  }, []);

  const closeDialog = useCallback(() => {
    setOpenChapterId(null);
    setPreviewedChapterId(null);
    suppressFocusPreviewRef.current = true;
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
      // 下一个事件循环再放开标志，让后续真实的键盘 Tab 聚焦仍能正常显示预览卡。
      setTimeout(() => {
        suppressFocusPreviewRef.current = false;
      }, 60);
    });
  }, []);

  const handlePreviewEnter = useCallback((chapterId: string) => {
    setPreviewedChapterId(chapterId);
  }, []);

  const handlePreviewLeave = useCallback((chapterId: string) => {
    setPreviewedChapterId((current) => (current === chapterId ? null : current));
  }, []);

  const handleTreeFocus = useCallback((chapterId: string) => {
    if (suppressFocusPreviewRef.current) return;
    setPreviewedChapterId(chapterId);
  }, []);

  const handleSelectPoint = useCallback(
    (pointId: string) => {
      const target = findPoint(pointId);
      if (!target) return;
      setOpenChapterId(null);
      navigate(pointPath(target));
    },
    [navigate],
  );

  const openChapter = openChapterId ? chapters.find((c) => c.id === openChapterId) : undefined;
  const openChapterIndex = openChapter ? chapters.findIndex((c) => c.id === openChapter.id) : -1;
  const openChapterPoints = useMemo(
    () => (openChapter ? knowledgePoints.filter((p) => p.clusterId === openChapter.id) : []),
    [openChapter],
  );

  return (
    <main id="main-content" className="page chapter-page forest-map-page" aria-label="人工智能原理章节学习路径">
      <header className="chapter-head">
        <Link className="back-link" to="/">
          <ChevronLeft size={16} aria-hidden="true" />
          返回书架
        </Link>
        <p className="chapter-eyebrow">人工智能原理</p>
        <h1 className="chapter-title">知识森林地图</h1>
        <p className="chapter-sub">
          沿小径从林口走向林深处，{chapters.length} 棵树就是 {chapters.length} 个章节。点开任意一棵，从它的第一个知识点读起。
        </p>
      </header>

      <div className="forest-scene-wrap">
        <div className={`forest-scene ${openChapterId ? 'dialog-open' : ''}`}>
          <svg
            className="forest-backdrop"
            viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="forestMeadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ecf4e3" />
                <stop offset="1" stopColor="#e0ecd4" />
              </linearGradient>
            </defs>

            {/* 俯览地图底景：柔和草地 */}
            <rect x="0" y="0" width={SCENE.w} height={SCENE.h} fill="url(#forestMeadow)" />

            {/* 林间空地斑块：极克制的明暗，给地图一点起伏，不堆纹理 */}
            <ellipse className="scene-glade" cx="330" cy="250" rx="240" ry="120" />
            <ellipse className="scene-glade" cx="720" cy="470" rx="260" ry="130" />
            <ellipse className="scene-glade soft" cx="640" cy="150" rx="180" ry="80" />

            {/* 小径：蛇形折返、连贯成一条弯弯曲曲的徒步路 */}
            <path className="trail-band" d={trail} />
            <path className="trail-dash" d={trail} />

            {/* 纯装饰背景树（更小、更退后，散布于空隙营造森林纵深） */}
            {BG_TREES.map((tree, i) => (
              <polygon
                key={`bg-${i}`}
                className="scene-bg-tree"
                points={`${tree.x},${tree.y - 40 * tree.s} ${tree.x - 15 * tree.s},${tree.y} ${tree.x + 15 * tree.s},${tree.y}`}
              />
            ))}

            <text className="trail-mark" x={NODES[0].x - 108} y={NODES[0].y + 6}>
              林口
            </text>
            <text className="trail-mark" x={NODES[NODES.length - 1].x + 150} y={NODES[NODES.length - 1].y + 6}>
              林深处
            </text>
          </svg>

          {/* 语义化有序列表：纯视觉地图之外的键盘 / 读屏等价导航 */}
          <ol className="forest-trees">
            {chapters.map((chapter, index) => {
              const count = counts[index];
              const node = NODES[index];
              const ratio = maxCount > minCount ? (count - minCount) / (maxCount - minCount) : 0.5;
              // 以 cqw（场景宽度的百分比）为单位，让整幅地图随宽度等比缩放（桌面/移动统一）；
              // 知识点越多树越繁茂，但保持在统一风格语言内的微调。
              const treeSize = 7.2 + ratio * 2.6;
              const isCurrent = index === lastChapterIndex;
              const isVisited = lastChapterIndex >= 0 && index <= lastChapterIndex;
              const isOpen = openChapterId === chapter.id;
              const isPreviewed = previewedChapterId === chapter.id;

              return (
                <li
                  key={chapter.id}
                  className="forest-tree-slot"
                  style={{ left: `${(node.x / SCENE.w) * 100}%`, top: `${(node.y / SCENE.h) * 100}%` } as CSSProperties}
                >
                  <button
                    type="button"
                    className={`forest-tree ${isVisited ? 'is-visited' : ''} ${isCurrent ? 'is-current' : ''} ${isOpen ? 'is-open' : ''} ${isPreviewed ? 'is-previewed' : ''}`}
                    aria-label={`第 ${index + 1} 章 ${chapter.title}，${count} 个知识点，查看本章预览`}
                    aria-haspopup="dialog"
                    aria-expanded={isOpen}
                    onClick={(event) => handleTreeClick(chapter.id, event.currentTarget)}
                    onPointerEnter={() => handlePreviewEnter(chapter.id)}
                    onPointerLeave={() => handlePreviewLeave(chapter.id)}
                    onFocus={() => handleTreeFocus(chapter.id)}
                    onBlur={() => handlePreviewLeave(chapter.id)}
                    style={
                      {
                        '--chapter-accent': chapter.accent,
                        '--chapter-soft': chapter.soft,
                        '--chapter-dark': chapter.dark,
                        '--tree-size': `${treeSize.toFixed(2)}cqw`,
                      } as CSSProperties
                    }
                  >
                    <span className="tree-art" aria-hidden="true">
                      <TreeArt lush={ratio} />
                    </span>
                    <span className="tree-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="tree-label">{chapter.title}</span>
                    {isCurrent ? (
                      <span className="tree-here">
                        <MapPin size={12} aria-hidden="true" />
                        上次读到这里
                      </span>
                    ) : null}

                    <span className="tree-card" role="presentation">
                      <span className="tree-card-title">{chapter.title}</span>
                      <span className="tree-card-subtitle">{chapter.subtitle}</span>
                      <span className="tree-card-desc">{chapter.description}</span>
                      <span className="tree-card-count">{count} 个知识点</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {openChapter ? (
        <ChapterPreviewDialog
          key={openChapter.id}
          chapter={openChapter}
          chapterIndex={openChapterIndex + 1}
          points={openChapterPoints}
          onClose={closeDialog}
          onSelectPoint={handleSelectPoint}
        />
      ) : null}
    </main>
  );
}

// 扁平几何松树 icon：成套统一的平涂三角松冠 + 简洁树干。
// 主色取 cluster.accent，右侧用 dark 做单侧明暗；树冠层数随该章知识点数量（2–3 层）。
function TreeArt({ lush }: { lush: number }) {
  const tiers = lush > 0.5 ? 3 : 2;
  return (
    <svg viewBox="0 0 60 78" className="tree-svg" role="img">
      <ellipse className="tree-shadow" cx="30" cy="73" rx="16" ry="3.2" />
      <rect className="tree-trunk" x="26.5" y="58" width="7" height="15" rx="2.2" />
      {tiers === 3 ? (
        <>
          <polygon className="tree-crown" points="30,42 9,63 51,63" />
          <polygon className="tree-shade" points="30,42 30,63 51,63" />
          <polygon className="tree-crown" points="30,25 14,47 46,47" />
          <polygon className="tree-shade" points="30,25 30,47 46,47" />
          <polygon className="tree-crown" points="30,9 19,31 41,31" />
          <polygon className="tree-shade" points="30,9 30,31 41,31" />
        </>
      ) : (
        <>
          <polygon className="tree-crown" points="30,44 10,64 50,64" />
          <polygon className="tree-shade" points="30,44 30,64 50,64" />
          <polygon className="tree-crown" points="30,19 16,46 44,46" />
          <polygon className="tree-shade" points="30,19 30,46 44,46" />
        </>
      )}
    </svg>
  );
}

export default ChapterMapPage;
