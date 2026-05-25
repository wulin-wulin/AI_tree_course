import type { CSSProperties } from 'react';
import { BookOpenCheck, Braces, GitBranch, Lightbulb, Tags, Target, Workflow, Zap } from 'lucide-react';
import AnimationBlock from './AnimationBlock';
import DiagramBlock from './DiagramBlock';
import FormulaBlock from './FormulaBlock';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

type KnowledgeDetailPanelProps = {
  point: KnowledgePoint;
  cluster: KnowledgeCluster;
};

function KnowledgeDetailPanel({ point, cluster }: KnowledgeDetailPanelProps) {
  const expressionTags = [
    point.formula ? '公式' : null,
    point.visualType ? '图示' : null,
    point.animationType && point.animationType !== 'none' ? '动画' : null,
  ].filter(Boolean);

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

      <div className="detail-meta-grid" aria-label="学习提示">
        <div>
          <Target size={16} aria-hidden="true" />
          <span>学习目标</span>
          <strong>理解{point.title}的机制与适用场景</strong>
        </div>
        <div>
          <Workflow size={16} aria-hidden="true" />
          <span>前置建议</span>
          <strong>{point.prerequisites?.slice(0, 2).join(' / ') || '可直接学习'}</strong>
        </div>
        <div>
          <Zap size={16} aria-hidden="true" />
          <span>表达形式</span>
          <strong>{expressionTags.join(' / ') || '文本讲解'}</strong>
        </div>
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
