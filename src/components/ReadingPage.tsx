import { useEffect, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Home, List, PanelRightClose } from 'lucide-react';
import KnowledgeDetailPanel from './KnowledgeDetailPanel';
import {
  adjacent,
  chapterPoints,
  findChapter,
  findPoint,
  pointPath,
  positionInChapter,
  rememberLastPoint,
} from '../data/courseNav';

function ReadingPage() {
  const { chapterId, pointId } = useParams();
  const navigate = useNavigate();
  const [isDockOpen, setDockOpen] = useState(true);

  const point = findPoint(pointId);
  const chapter = findChapter(chapterId);

  useEffect(() => {
    if (point) {
      rememberLastPoint(point.id);
    }
  }, [point]);

  // 兜底：知识点不存在 → 回章节导览；章节不匹配 → 跳到该知识点的正确章节地址。
  if (!point) {
    return <Navigate to="/ai" replace />;
  }
  if (!chapter || chapter.id !== point.clusterId) {
    return <Navigate to={pointPath(point)} replace />;
  }

  const points = chapterPoints(chapter.id);
  const { prev, next } = adjacent(point.id);
  const { index, total } = positionInChapter(point);

  const goToPoint = (id: string) => {
    const target = findPoint(id);
    if (target) {
      navigate(pointPath(target));
    }
  };

  return (
    <main
      id="main-content"
      className={`page reading-layout ${isDockOpen ? '' : 'dock-collapsed'}`}
      aria-label={`${chapter.title}知识点阅读`}
      style={{ '--chapter-accent': chapter.accent, '--chapter-soft': chapter.soft } as CSSProperties}
    >
      <div className="reading-main">
        <KnowledgeDetailPanel
          key={point.id}
          point={point}
          cluster={chapter}
          prev={prev}
          next={next}
          positionInCluster={index}
          clusterTotal={total}
          onSelect={goToPoint}
        />
      </div>

      <aside className={`chapter-dock ${isDockOpen ? 'is-open' : 'is-collapsed'}`} aria-label="本章节知识点列表">
        {isDockOpen ? (
          <>
            <div className="dock-head">
              <div>
                <span className="dock-eyebrow">本章节</span>
                <strong className="dock-title">{chapter.title}</strong>
              </div>
              <button
                type="button"
                className="dock-collapse"
                onClick={() => setDockOpen(false)}
                aria-label="收起章节列表"
                title="收起章节列表"
              >
                <PanelRightClose size={16} aria-hidden="true" />
              </button>
            </div>

            <ol className="dock-list">
              {points.map((item, itemIndex) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`dock-item ${item.id === point.id ? 'is-current' : ''}`}
                    aria-current={item.id === point.id ? 'true' : undefined}
                    onClick={() => goToPoint(item.id)}
                  >
                    <span className="dock-item-index">{String(itemIndex + 1).padStart(2, '0')}</span>
                    <span className="dock-item-title">{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="dock-foot">
              <button type="button" className="dock-link" onClick={() => navigate('/ai')}>
                <ChevronLeft size={15} aria-hidden="true" />
                切换章节
              </button>
              <button type="button" className="dock-link" onClick={() => navigate('/')}>
                <Home size={15} aria-hidden="true" />
                返回书架
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="dock-open-handle"
            onClick={() => setDockOpen(true)}
            aria-label="展开章节列表"
            title="展开章节列表"
          >
            <List size={16} aria-hidden="true" />
            <span>章节目录</span>
          </button>
        )}
      </aside>
    </main>
  );
}

export default ReadingPage;
