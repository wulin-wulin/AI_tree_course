import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimationBlock from './AnimationBlock';
import DiagramBlock from './DiagramBlock';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

type AdjacentPoint = { id: string; title: string } | null;

type KnowledgeDetailPanelProps = {
  point: KnowledgePoint;
  cluster: KnowledgeCluster;
  prev: AdjacentPoint;
  next: AdjacentPoint;
  positionInCluster: number;
  clusterTotal: number;
  onSelect: (id: string) => void;
};

function KnowledgeDetailPanel({
  point,
  cluster,
  prev,
  next,
  positionInCluster,
  clusterTotal,
  onSelect,
}: KnowledgeDetailPanelProps) {
  const expressionTags = [
    point.formula ? '公式' : null,
    point.visualType ? '图示' : null,
    point.animationType && point.animationType !== 'none' ? '动画' : null,
  ].filter(Boolean) as string[];

  return (
    <aside
      className="detail-panel reading-page"
      aria-label="知识点详情"
      style={{ '--detail-accent': cluster.accent, '--detail-soft': cluster.soft } as CSSProperties}
    >
      <nav className="reading-nav" aria-label="知识点之间的推进">
        <div className="reading-steps">
          <button
            type="button"
            className="reading-nav-btn prev"
            disabled={!prev}
            onClick={() => prev && onSelect(prev.id)}
            title={prev ? `上一点：${prev.title}` : '已是第一个知识点'}
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span>{prev ? prev.title : '已是第一个'}</span>
          </button>
          <span className="reading-position" aria-live="polite">
            {cluster.title} · 第 {positionInCluster}/{clusterTotal} 点
          </span>
          <button
            type="button"
            className="reading-nav-btn next"
            disabled={!next}
            onClick={() => next && onSelect(next.id)}
            title={next ? `下一点：${next.title}` : '已是最后一个知识点'}
          >
            <span>{next ? next.title : '已是最后一个'}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <header className="reading-head">
        <div className="reading-tags">
          <span className="cluster-pill">{cluster.title}</span>
          <span className={`difficulty difficulty-${point.difficulty}`}>{point.difficulty}</span>
          {expressionTags.map((tag) => (
            <span key={tag} className="form-tag">
              {tag}
            </span>
          ))}
        </div>
        <h2>{point.title}</h2>
        <p className="reading-summary">{point.shortSummary}</p>
      </header>

      <section className="reading-lead" aria-label="核心思想">
        <span className="reading-lead-kicker">核心思想</span>
        <p>{point.coreIdea}</p>
      </section>

      <figure className="reading-figure">
        <DiagramBlock point={point} />
        <AnimationBlock type={point.animationType} suggestion={point.animationSuggestion} />
      </figure>

      <section className="reading-body" aria-label="基本原理">
        <h3>基本原理</h3>
        <ul className="reading-principles">
          {point.principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
        {point.formula ? (
          <div className="reading-formula">
            <span className="reading-formula-kicker">用一个式子概括</span>
            <div className="formula-block">{point.formula}</div>
          </div>
        ) : null}
      </section>

      <section className="reading-aside-group" aria-label="参考资料">
        <details className="reading-aside">
          <summary>
            关键术语 <span className="aside-count">{point.keyTerms.length}</span>
          </summary>
          <div className="term-cloud">
            {point.keyTerms.map((term) => (
              <span key={term}>{term}</span>
            ))}
          </div>
        </details>

        {point.comparisons?.length ? (
          <details className="reading-aside">
            <summary>
              相关对比 <span className="aside-count">{point.comparisons.length}</span>
            </summary>
            <ul className="compact-list">
              {point.comparisons.map((comparison) => (
                <li key={comparison}>{comparison}</li>
              ))}
            </ul>
          </details>
        ) : null}

        <details className="reading-aside">
          <summary>
            典型应用 <span className="aside-count">{point.applications.length}</span>
          </summary>
          <ul className="compact-list">
            {point.applications.map((application) => (
              <li key={application}>{application}</li>
            ))}
          </ul>
        </details>

        {point.prerequisites?.length ? (
          <details className="reading-aside">
            <summary>
              前置知识 <span className="aside-count">{point.prerequisites.length}</span>
            </summary>
            <div className="term-cloud muted">
              {point.prerequisites.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      {point.ideologicalElement ? (
        <section className="reading-coda" aria-label="延伸思考">
          <span className="reading-coda-kicker">延伸思考</span>
          <p>{point.ideologicalElement}</p>
        </section>
      ) : null}
    </aside>
  );
}

export default KnowledgeDetailPanel;
