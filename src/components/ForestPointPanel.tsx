import type { CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { FullPoint, ClusterMeta } from '../forest/forestData';

type Props = {
  point: FullPoint | null;
  cluster: ClusterMeta | undefined;
  loading: boolean;
  onClose: () => void;
};

function ForestPointPanel({ point, cluster, loading, onClose }: Props) {
  return (
    <aside
      className="forest-detail-panel"
      aria-label="知识点详情"
      style={{ '--detail-accent': cluster?.accent ?? '#4a7', '--detail-soft': cluster?.soft ?? '#eef' } as CSSProperties}
    >
      <button type="button" className="forest-detail-close" onClick={onClose} aria-label="关闭详情">
        <X size={18} aria-hidden="true" />
      </button>
      {loading || !point ? (
        <p className="forest-detail-loading">加载中…</p>
      ) : (
        <>
          <header className="forest-detail-head">
            <div className="forest-detail-tags">
              {cluster ? <span className="cluster-pill">{cluster.title}</span> : null}
              <span className={`difficulty difficulty-${point.difficulty}`}>{point.difficulty}</span>
            </div>
            <h2>{point.title}</h2>
            <p className="forest-detail-summary">{point.shortSummary}</p>
          </header>

          {point.coreIdea ? (
            <section className="forest-detail-section">
              <h3>核心思想</h3>
              <p>{point.coreIdea}</p>
            </section>
          ) : null}

          {point.principles?.length ? (
            <section className="forest-detail-section">
              <h3>基本原理</h3>
              <ul>{point.principles.map((p) => <li key={p}>{p}</li>)}</ul>
            </section>
          ) : null}

          {point.formula ? (
            <section className="forest-detail-section">
              <h3>公式</h3>
              <div className="formula-block">{point.formula}</div>
            </section>
          ) : null}

          {point.keyTerms?.length ? (
            <section className="forest-detail-section">
              <h3>关键术语</h3>
              <div className="term-cloud">{point.keyTerms.map((t) => <span key={t}>{t}</span>)}</div>
            </section>
          ) : null}

          {point.applications?.length ? (
            <section className="forest-detail-section">
              <h3>典型应用</h3>
              <ul>{point.applications.map((a) => <li key={a}>{a}</li>)}</ul>
            </section>
          ) : null}

          {point.comparisons?.length ? (
            <section className="forest-detail-section">
              <h3>相关对比</h3>
              <ul>{point.comparisons.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
          ) : null}
        </>
      )}
    </aside>
  );
}

export default ForestPointPanel;
