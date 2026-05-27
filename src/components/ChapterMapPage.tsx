import { useMemo, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MapPin } from 'lucide-react';
import { chapters, chapterPoints, findPoint, firstPointOf, pointPath, readLastPoint } from '../data/courseNav';

function ChapterMapPage() {
  // 轻量「上次所在」位置感：从上次阅读的知识点推回它所属章节。
  const lastChapterId = useMemo(() => {
    const last = readLastPoint();
    return last ? findPoint(last)?.clusterId : undefined;
  }, []);

  return (
    <main id="main-content" className="page chapter-page" aria-label="人工智能原理章节学习路径">
      <header className="chapter-head">
        <Link className="back-link" to="/">
          <ChevronLeft size={16} aria-hidden="true" />
          返回书架
        </Link>
        <p className="chapter-eyebrow">人工智能原理</p>
        <h1 className="chapter-title">章节学习路径</h1>
        <p className="chapter-sub">沿着林间小径，依次走过 {chapters.length} 个章节。点开任意章节，从它的第一个知识点读起。</p>
      </header>

      <ol className="chapter-path" aria-label="章节顺序">
        {chapters.map((chapter, index) => {
          const points = chapterPoints(chapter.id);
          const first = firstPointOf(chapter.id);
          const isLast = lastChapterId === chapter.id;
          return (
            <li key={chapter.id} className="chapter-path-item">
              <Link
                className={`chapter-node ${isLast ? 'is-last-visited' : ''}`}
                to={first ? pointPath(first) : '/ai'}
                style={{ '--chapter-accent': chapter.accent, '--chapter-soft': chapter.soft } as CSSProperties}
              >
                <span className="chapter-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="chapter-node-body">
                  <span className="chapter-node-title">{chapter.title}</span>
                  <span className="chapter-node-subtitle">{chapter.subtitle}</span>
                </span>
                <span className="chapter-node-meta">
                  {isLast ? (
                    <span className="chapter-here">
                      <MapPin size={13} aria-hidden="true" />
                      上次读到这里
                    </span>
                  ) : null}
                  <span className="chapter-count">{points.length} 个知识点</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

export default ChapterMapPage;
