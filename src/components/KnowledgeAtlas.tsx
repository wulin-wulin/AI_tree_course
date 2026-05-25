import type { CSSProperties } from 'react';
import { Activity, CircleDot, Layers3, PlayCircle } from 'lucide-react';
import type { KnowledgeCluster, KnowledgePoint } from '../data/courseKnowledge';

type KnowledgeAtlasProps = {
  clusters: KnowledgeCluster[];
  points: KnowledgePoint[];
  selectedPointId: string;
  activeClusterId: string;
  onPointSelect: (id: string) => void;
  onClusterChange: (id: string) => void;
};

type ClusterLayout = {
  x: number;
  y: number;
  rx: number;
  ry: number;
};

const clusterLayouts: Record<string, ClusterLayout> = {
  'intro-history': { x: 15, y: 22, rx: 96, ry: 56 },
  'search-solving': { x: 42, y: 17, rx: 104, ry: 58 },
  'knowledge-reasoning': { x: 70, y: 25, rx: 102, ry: 58 },
  'machine-learning': { x: 24, y: 52, rx: 108, ry: 62 },
  'deep-learning': { x: 52, y: 49, rx: 116, ry: 68 },
  'nlp-vision': { x: 79, y: 55, rx: 104, ry: 62 },
  'rl-agents': { x: 36, y: 80, rx: 96, ry: 58 },
  'generative-safety': { x: 66, y: 80, rx: 108, ry: 62 },
};

function KnowledgeAtlas({
  clusters,
  points,
  selectedPointId,
  activeClusterId,
  onPointSelect,
  onClusterChange,
}: KnowledgeAtlasProps) {
  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? points[0];
  const focusClusterId = activeClusterId === 'all' ? selectedPoint.clusterId : activeClusterId;

  return (
    <div className="atlas-map" aria-label="交互式课程知识地图">
      <svg className="atlas-backbone" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M15 22 C26 8 35 12 42 17 S60 18 70 25 S86 39 79 55 S76 73 66 80 S48 88 36 80 S18 67 24 52 S10 34 15 22"
          className="atlas-route"
        />
        <path d="M42 17 C43 34 47 42 52 49" className="atlas-link" />
        <path d="M24 52 C34 50 42 49 52 49" className="atlas-link" />
        <path d="M52 49 C61 52 69 54 79 55" className="atlas-link" />
        <path d="M52 49 C49 65 43 73 36 80" className="atlas-link" />
        <path d="M52 49 C57 66 61 75 66 80" className="atlas-link" />
      </svg>

      {clusters.map((cluster, clusterIndex) => {
        const layout = clusterLayouts[cluster.id];
        const clusterPoints = points.filter((point) => point.clusterId === cluster.id);
        const isExpanded = cluster.id === focusClusterId;
        const isSelectedCluster = selectedPoint.clusterId === cluster.id;
        const renderedPoints = isExpanded ? clusterPoints : clusterPoints.slice(0, 3);
        const style = {
          '--atlas-accent': cluster.accent,
          '--atlas-soft': cluster.soft,
          '--atlas-dark': cluster.dark,
          left: `${layout.x}%`,
          top: `${layout.y}%`,
        } as CSSProperties;

        return (
          <section
            key={cluster.id}
            className={`atlas-cluster ${isExpanded ? 'is-expanded' : ''} ${isSelectedCluster ? 'is-current' : ''}`}
            style={style}
            aria-label={`${cluster.title}知识簇`}
          >
            <button
              type="button"
              className="atlas-hub"
              onClick={() => onClusterChange(cluster.id)}
              aria-pressed={isExpanded}
            >
              <span className="hub-index">{String(clusterIndex + 1).padStart(2, '0')}</span>
              <span className="hub-title">{cluster.title}</span>
              <span className="hub-count">{clusterPoints.length} 点</span>
            </button>

            {renderedPoints.map((point, pointIndex) => {
              const total = renderedPoints.length;
              const angle = -Math.PI / 2 + (pointIndex / Math.max(total, 1)) * Math.PI * 2;
              const dx = Math.cos(angle) * layout.rx;
              const dy = Math.sin(angle) * layout.ry;
              const isSelected = point.id === selectedPointId;
              const nodeStyle = {
                '--node-x': `${dx}px`,
                '--node-y': `${dy}px`,
                '--node-delay': `${pointIndex * 55}ms`,
              } as CSSProperties;

              return (
                <button
                  key={point.id}
                  type="button"
                  className={`atlas-node ${isExpanded ? 'is-expanded' : 'is-compact'} ${isSelected ? 'is-selected' : ''}`}
                  style={nodeStyle}
                  onClick={() => {
                    onClusterChange(cluster.id);
                    onPointSelect(point.id);
                  }}
                  title={point.title}
                >
                  <span className="node-signal" aria-hidden="true" />
                  <span className="atlas-node-title">{point.title}</span>
                  {point.animationType && point.animationType !== 'none' ? (
                    <PlayCircle size={13} aria-label="含动画" />
                  ) : null}
                </button>
              );
            })}

            {!isExpanded ? <span className="cluster-reserve">+{Math.max(clusterPoints.length - 3, 0)}</span> : null}
          </section>
        );
      })}

      <div className="atlas-legend" aria-label="地图图例">
        <span>
          <CircleDot size={14} aria-hidden="true" />
          当前知识点
        </span>
        <span>
          <Activity size={14} aria-hidden="true" />
          主题路径
        </span>
        <span>
          <Layers3 size={14} aria-hidden="true" />
          展开知识簇
        </span>
      </div>
    </div>
  );
}

export default KnowledgeAtlas;
