import type { CSSProperties } from 'react';
import { LocateFixed, Sprout } from 'lucide-react';
import KnowledgeCluster from './KnowledgeCluster';
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
  const visibleClusters =
    activeClusterId === 'all' ? clusters : clusters.filter((cluster) => cluster.id === activeClusterId);

  return (
    <div className="forest-panel">
      <div className="forest-toolbar">
        <div>
          <span className="section-kicker">
            <Sprout size={16} aria-hidden="true" />
            课程知识结构
          </span>
          <h2>知识森林主视图</h2>
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

      <div className="forest-grid">
        {visibleClusters.map((cluster) => {
          const clusterPoints = points.filter((point) => point.clusterId === cluster.id);

          return (
            <KnowledgeCluster
              key={cluster.id}
              cluster={cluster}
              points={clusterPoints}
              selectedPointId={selectedPointId}
              onPointSelect={onPointSelect}
            />
          );
        })}
      </div>
    </div>
  );
}

export default KnowledgeForest;
