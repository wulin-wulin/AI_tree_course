import type { CSSProperties } from 'react';
import { BookOpenCheck, Braces, GitBranch, Lightbulb, Tags } from 'lucide-react';
import AnimationBlock from './AnimationBlock';
import DiagramBlock from './DiagramBlock';
import FormulaBlock from './FormulaBlock';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

type KnowledgeDetailPanelProps = {
  point: KnowledgePoint;
  cluster: KnowledgeCluster;
};

function KnowledgeDetailPanel({ point, cluster }: KnowledgeDetailPanelProps) {
  return (
    <aside
      className="detail-panel"
      aria-label="知识点详情"
      style={{ '--detail-accent': cluster.accent, '--detail-soft': cluster.soft } as CSSProperties}
    >
      <div className="detail-header">
        <span className="cluster-pill">{cluster.title}</span>
        <span className={`difficulty difficulty-${point.difficulty}`}>{point.difficulty}</span>
        <h2>{point.title}</h2>
        <p>{point.shortSummary}</p>
      </div>

      <section className="detail-section">
        <h3>
          <Lightbulb size={17} aria-hidden="true" />
          核心思想
        </h3>
        <p>{point.coreIdea}</p>
      </section>

      <section className="detail-section">
        <h3>
          <GitBranch size={17} aria-hidden="true" />
          基本原理
        </h3>
        <ul className="compact-list">
          {point.principles.map((principle) => (
            <li key={principle}>{principle}</li>
          ))}
        </ul>
      </section>

      <section className="detail-section">
        <h3>
          <Tags size={17} aria-hidden="true" />
          关键术语
        </h3>
        <div className="term-cloud">
          {point.keyTerms.map((term) => (
            <span key={term}>{term}</span>
          ))}
        </div>
      </section>

      <FormulaBlock formula={point.formula} />
      <DiagramBlock point={point} />
      <AnimationBlock type={point.animationType} suggestion={point.animationSuggestion} />

      {point.comparisons?.length ? (
        <section className="detail-section">
          <h3>
            <Braces size={17} aria-hidden="true" />
            相关对比
          </h3>
          <ul className="compact-list">
            {point.comparisons.map((comparison) => (
              <li key={comparison}>{comparison}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="detail-section">
        <h3>
          <BookOpenCheck size={17} aria-hidden="true" />
          典型应用
        </h3>
        <ul className="compact-list">
          {point.applications.map((application) => (
            <li key={application}>{application}</li>
          ))}
        </ul>
      </section>

      {point.prerequisites?.length ? (
        <section className="detail-section">
          <h3>前置知识</h3>
          <div className="term-cloud muted">
            {point.prerequisites.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      ) : null}

      {point.ideologicalElement ? (
        <section className="detail-section ideology-section">
          <h3>课程思政</h3>
          <p>{point.ideologicalElement}</p>
        </section>
      ) : null}
    </aside>
  );
}

export default KnowledgeDetailPanel;
