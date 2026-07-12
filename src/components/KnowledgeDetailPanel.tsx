import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AnimationBlock from './AnimationBlock';
import DiagramBlock from './DiagramBlock';
import RichText, { hasRichTextContent } from './RichText';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

type AdjacentPoint = { id: string; title: string } | null;
type PathContext = {
  query: string;
  index: number;
  total: number;
  prev: AdjacentPoint;
  next: AdjacentPoint;
  onSelect: (id: string) => void;
  onReturn: () => void;
};
type ExtendedPoint = KnowledgePoint & {
  aliases?: string[];
  intuition?: string;
  misconceptions?: string[];
  history?: string;
  prosCons?: {
    pros?: string[];
    cons?: string[];
  };
  qa?: Array<{
    q: string;
    a: string;
  }>;
};

type KnowledgeDetailPanelProps = {
  point: ExtendedPoint;
  cluster: KnowledgeCluster;
  prev: AdjacentPoint;
  next: AdjacentPoint;
  positionInCluster: number;
  clusterTotal: number;
  onSelect: (id: string) => void;
  pathContext?: PathContext | null;
};

function KnowledgeDetailPanel({
  point,
  cluster,
  prev,
  next,
  positionInCluster,
  clusterTotal,
  onSelect,
  pathContext,
}: KnowledgeDetailPanelProps) {
  const expressionTags = [
    point.formula ? '公式' : null,
    point.visualType ? '图示' : null,
    point.animationType && point.animationType !== 'none' ? '动画' : null,
  ].filter(Boolean) as string[];
  const principles = point.principles.filter(hasRichTextContent);
  const comparisons = point.comparisons?.filter(hasRichTextContent) ?? [];
  const applications = point.applications.filter(hasRichTextContent);
  const misconceptions = point.misconceptions?.filter(hasRichTextContent) ?? [];
  const pros = point.prosCons?.pros?.filter(hasRichTextContent) ?? [];
  const cons = point.prosCons?.cons?.filter(hasRichTextContent) ?? [];

  return (
    <aside
      className="detail-panel reading-page"
      aria-label="知识点详情"
      style={{ '--detail-accent': cluster.accent, '--detail-soft': cluster.soft } as CSSProperties}
    >
      {pathContext ? (
        <nav className="reading-path-nav" aria-label="学习路径推进">
          <div className="reading-path-main">
            <span className="reading-path-kicker">学习路径 · 第 {pathContext.index}/{pathContext.total} 点</span>
            <strong>{pathContext.query}</strong>
          </div>
          <div className="reading-path-actions">
            <button
              type="button"
              className="reading-path-btn"
              disabled={!pathContext.prev}
              onClick={() => pathContext.prev && pathContext.onSelect(pathContext.prev.id)}
              title={pathContext.prev ? `路径上一点：${pathContext.prev.title}` : '已经是路径第一点'}
            >
              <ChevronLeft size={15} aria-hidden="true" />
              <span>{pathContext.prev ? pathContext.prev.title : '第一点'}</span>
            </button>
            <button type="button" className="reading-path-return" onClick={pathContext.onReturn}>
              返回森林路径
            </button>
            <button
              type="button"
              className="reading-path-btn"
              disabled={!pathContext.next}
              onClick={() => pathContext.next && pathContext.onSelect(pathContext.next.id)}
              title={pathContext.next ? `路径下一点：${pathContext.next.title}` : '已经是路径最后一点'}
            >
              <span>{pathContext.next ? pathContext.next.title : '最后一点'}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </nav>
      ) : null}

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
        <RichText text={point.coreIdea} variant="lead" />
      </section>

      <figure className="reading-figure">
        <DiagramBlock point={point} />
        <AnimationBlock type={point.animationType} suggestion={point.animationSuggestion} />
      </figure>

      <section className="reading-body" aria-label="基本原理">
        <h3>基本原理</h3>
        <ul className="reading-principles">
          {principles.map((principle) => (
            <li key={principle}>
              <RichText text={principle} variant="compact" />
            </li>
          ))}
        </ul>
        {point.formula ? (
          <div className="reading-formula">
            <span className="reading-formula-kicker">用一个式子概括</span>
            <RichText text={point.formula} variant="formula" className="formula-block" />
          </div>
        ) : null}
      </section>

      <section className="reading-reference" aria-label="扩展理解">
        <header className="reading-reference-head">
          <span>扩展理解</span>
          <h3>把概念放进使用场景里</h3>
        </header>

        <div className="reading-reference-grid">
          <section className="reading-info-panel reading-info-panel-terms" aria-label="关键词">
            <div className="reading-info-head">
              <span>关键词</span>
              <strong>{point.keyTerms.length}</strong>
            </div>
            <div className="term-cloud">
              {point.keyTerms.map((term) => (
                <span key={term}>{term}</span>
              ))}
            </div>
          </section>

          {point.prerequisites?.length ? (
            <section className="reading-info-panel" aria-label="前置知识">
              <div className="reading-info-head">
                <span>前置知识</span>
                <strong>{point.prerequisites.length}</strong>
              </div>
              <div className="term-cloud muted">
                {point.prerequisites.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {applications.length ? (
          <section className="reading-content-block" aria-label="典型应用">
            <div className="reading-block-head">
              <span>01</span>
              <h3>典型应用</h3>
            </div>
            <div className="reading-application-grid">
              {applications.map((application, applicationIndex) => (
                <article key={application} className="reading-application-card">
                  <span>{String(applicationIndex + 1).padStart(2, '0')}</span>
                  <RichText text={application} variant="compact" />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {comparisons.length ? (
          <section className="reading-content-block" aria-label="相关对比">
            <div className="reading-block-head">
              <span>02</span>
              <h3>相关对比</h3>
            </div>
            <ul className="reading-plain-list">
              {comparisons.map((comparison) => (
                <li key={comparison}>
                  <RichText text={comparison} variant="compact" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {point.intuition || point.history ? (
          <section className="reading-content-block" aria-label="讲解线索">
            <div className="reading-block-head">
              <span>03</span>
              <h3>讲解线索</h3>
            </div>
            <div className="reading-story-grid">
              {point.intuition ? (
                <article>
                  <span>直觉解释</span>
                  <RichText text={point.intuition} variant="compact" />
                </article>
              ) : null}
              {point.history ? (
                <article>
                  <span>发展脉络</span>
                  <RichText text={point.history} variant="compact" />
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        {misconceptions.length ? (
          <section className="reading-content-block" aria-label="常见误区">
            <div className="reading-block-head">
              <span>04</span>
              <h3>常见误区</h3>
            </div>
            <ul className="reading-plain-list is-warning">
              {misconceptions.map((item) => (
                <li key={item}>
                  <RichText text={item} variant="compact" />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {pros.length || cons.length ? (
          <section className="reading-content-block" aria-label="优缺点">
            <div className="reading-block-head">
              <span>05</span>
              <h3>优缺点</h3>
            </div>
            <div className="reading-pros-cons">
              {pros.length ? (
                <article className="is-pro">
                  <strong>优势</strong>
                  <ul className="reading-plain-list">
                    {pros.map((item) => (
                      <li key={item}>
                        <RichText text={item} variant="compact" />
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}
              {cons.length ? (
                <article className="is-con">
                  <strong>局限</strong>
                  <ul className="reading-plain-list">
                    {cons.map((item) => (
                      <li key={item}>
                        <RichText text={item} variant="compact" />
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        {point.qa?.length ? (
          <section className="reading-content-block" aria-label="自测问答">
            <div className="reading-block-head">
              <span>06</span>
              <h3>自测问答</h3>
            </div>
            <div className="reading-qa-list">
              {point.qa.map((item, qaIndex) => (
                <article key={item.q} className="reading-qa-item">
                  <span>Q{qaIndex + 1}</span>
                  <h4>{item.q}</h4>
                  <RichText text={item.a} variant="compact" />
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      {point.ideologicalElement ? (
        <section className="reading-coda" aria-label="延伸思考">
          <span className="reading-coda-kicker">延伸思考</span>
          <RichText text={point.ideologicalElement} variant="compact" />
        </section>
      ) : null}
    </aside>
  );
}

export default KnowledgeDetailPanel;
