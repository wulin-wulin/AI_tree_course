import type { CSSProperties } from 'react';
import { BookMarked, LocateFixed, Route, Search, Sparkles } from 'lucide-react';
import KnowledgeAtlas from './KnowledgeAtlas';
import type { KnowledgeCluster as Cluster, KnowledgePoint } from '../data/courseKnowledge';

type KnowledgeForestProps = {
  clusters: Cluster[];
  points: KnowledgePoint[];
  selectedPointId: string;
  activeClusterId: string;
  onPointSelect: (id: string) => void;
  onClusterChange: (id: string) => void;
};

function KnowledgeForest({
  clusters,
  points,
  selectedPointId,
  activeClusterId,
  onPointSelect,
  onClusterChange,
}: KnowledgeForestProps) {
  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? points[0];
  const focusClusterId = activeClusterId === 'all' ? selectedPoint.clusterId : activeClusterId;
  const focusCluster = clusters.find((cluster) => cluster.id === focusClusterId) ?? clusters[0];
  const focusPoints = points.filter((point) => point.clusterId === focusCluster.id);
  const formulaCount = focusPoints.filter((point) => point.formula).length;
  const animationCount = focusPoints.filter((point) => point.animationType && point.animationType !== 'none').length;

  return (
    <div className="forest-panel">
      <div className="forest-toolbar">
        <div>
          <span className="section-kicker">
            <Route size={16} aria-hidden="true" />
            课程知识地图
          </span>
          <h2>AI 原理学习路径总览</h2>
          <p className="toolbar-copy">主题枢纽表示课程章节，节点轨道表示当前展开的知识簇，点击任意节点进入右侧知识屏。</p>
        </div>

        <div className="cluster-tabs" role="tablist" aria-label="选择知识簇">
          <button
            type="button"
            className={activeClusterId === 'all' ? 'is-active' : ''}
            onClick={() => onClusterChange('all')}
          >
            <LocateFixed size={15} aria-hidden="true" />
            全部
          </button>
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              type="button"
              className={activeClusterId === cluster.id ? 'is-active' : ''}
              style={{ '--tab-accent': cluster.accent } as CSSProperties}
              onClick={() => onClusterChange(cluster.id)}
            >
              {cluster.title}
            </button>
          ))}
        </div>
      </div>

      <div className="learning-brief" style={{ '--brief-accent': focusCluster.accent } as CSSProperties}>
        <div>
          <span>当前展开</span>
          <strong>{focusCluster.title}</strong>
        </div>
        <div>
          <span>知识点</span>
          <strong>{focusPoints.length}</strong>
        </div>
        <div>
          <span>公式点</span>
          <strong>{formulaCount}</strong>
        </div>
        <div>
          <span>动画点</span>
          <strong>{animationCount}</strong>
        </div>
      </div>

      <KnowledgeAtlas
        clusters={clusters}
        points={points}
        selectedPointId={selectedPointId}
        activeClusterId={activeClusterId}
        onPointSelect={onPointSelect}
        onClusterChange={onClusterChange}
      />

      <section
        className="path-board"
        aria-label={`${focusCluster.title}学习路径`}
        style={{ '--brief-accent': focusCluster.accent } as CSSProperties}
      >
        <div className="path-board-heading">
          <div>
            <span className="section-kicker">
              <BookMarked size={15} aria-hidden="true" />
              本簇学习路径
            </span>
            <h3>{focusCluster.subtitle}</h3>
          </div>
          <p>{focusCluster.description}</p>
        </div>

        <div className="path-node-list">
          {focusPoints.map((point, index) => (
            <button
              key={point.id}
              type="button"
              className={`path-node ${point.id === selectedPointId ? 'is-selected' : ''}`}
              onClick={() => onPointSelect(point.id)}
            >
              <span className="path-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="path-title">{point.title}</span>
              <span className="path-meta">
                {point.formula ? <Search size={13} aria-label="含公式" /> : null}
                {point.animationType && point.animationType !== 'none' ? <Sparkles size={13} aria-label="含动画" /> : null}
                {point.difficulty}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default KnowledgeForest;
