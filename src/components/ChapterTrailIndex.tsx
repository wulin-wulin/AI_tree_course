import { forwardRef, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { KnowledgeCluster } from '../data/courseKnowledge';

type ChapterTrailIndexProps = {
  chapters: KnowledgeCluster[];
  activeChapterId: string | null;
  lastChapterIndex: number;
  onJump: (chapterId: string) => void;
  onCollapse: () => void;
};

const ChapterTrailIndex = forwardRef<HTMLElement, ChapterTrailIndexProps>(function ChapterTrailIndex(
  { chapters, activeChapterId, lastChapterIndex, onJump, onCollapse },
  ref,
) {
  return (
    <nav id="trail-index-panel" ref={ref} className="trail-index" aria-label="章节索引">
      <div className="trail-index-head">
        <p className="trail-index-title">本课章节</p>
        <button
          type="button"
          className="trail-index-close"
          data-trail-index-close
          aria-expanded="true"
          aria-controls="trail-index-panel"
          aria-label="收起章节索引"
          onClick={onCollapse}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <ol className="trail-index-list">
        {chapters.map((chapter, index) => {
          const isActive = activeChapterId === chapter.id;
          const isVisited = lastChapterIndex >= 0 && index <= lastChapterIndex;
          return (
            <li key={chapter.id}>
              <button
                type="button"
                className={`trail-index-item ${isActive ? 'is-active' : ''} ${isVisited ? 'is-visited' : ''}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={() => onJump(chapter.id)}
                style={{ '--chapter-accent': chapter.accent } as CSSProperties}
              >
                <span className="trail-index-num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="trail-index-dot" aria-hidden="true" />
                <span className="trail-index-text">{chapter.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

export default ChapterTrailIndex;
