import { useMemo, type CSSProperties } from 'react';
import { ArrowLeft, CircleDot, Layers3, PlayCircle, Route } from 'lucide-react';
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
};

const clusterLayouts: Record<string, ClusterLayout> = {
  'intro-history': { x: 15, y: 22 },
  'search-solving': { x: 42, y: 17 },
  'knowledge-reasoning': { x: 70, y: 25 },
  'machine-learning': { x: 24, y: 52 },
  'deep-learning': { x: 52, y: 49 },
  'nlp-vision': { x: 79, y: 55 },
  'rl-agents': { x: 36, y: 80 },
  'generative-safety': { x: 66, y: 80 },
};

const FOCUS_RX = 248;
const FOCUS_RY = 188;

function KnowledgeAtlas({
  clusters,
  points,
  selectedPointId,
  activeClusterId,
  onPointSelect,
  onClusterChange,
}: KnowledgeAtlasProps) {
  const isOverview = activeClusterId === 'all';
  const pointsByCluster = useMemo(() => {
    const grouped = new Map<string, KnowledgePoint[]>();
    for (const point of points) {
      const group = grouped.get(point.clusterId);
      if (group) {
        group.push(point);
      } else {
        grouped.set(point.clusterId, [point]);
      }
    }
    return grouped;
  }, [points]);

  const focusedCluster = useMemo(
    () => clusters.find((cluster) => cluster.id === activeClusterId) ?? null,
    [activeClusterId, clusters],
  );

  return (
    <div
      className={`atlas-map ${isOverview ? 'is-overview' : 'is-focus'}`}
      aria-label="交互式课程知识地图"
    >
      <svg
        className="atlas-backbone"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
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
        const clusterPoints = pointsByCluster.get(cluster.id) ?? [];
        const isFocused = !isOverview && cluster.id === activeClusterId;
        const isHidden = !isOverview && !isFocused;

        const style = {
          '--atlas-accent': cluster.accent,
          '--atlas-soft': cluster.soft,
          '--atlas-dark': cluster.dark,
          left: isFocused ? '50%' : `${layout.x}%`,
          top: isFocused ? '50%' : `${layout.y}%`,
        } as CSSProperties;

        return (
          <section
            key={cluster.id}
            className={`atlas-cluster ${isFocused ? 'is-focused' : ''} ${isHidden ? 'is-hidden' : ''}`}
            style={style}
            aria-label={`${cluster.title}知识簇`}
            aria-hidden={isHidden}
          >
            {isFocused ? (
              <svg className="atlas-radial" aria-hidden="true">
                {clusterPoints.map((point, pointIndex) => {
                  const total = clusterPoints.length;
                  const angle = -Math.PI / 2 + (pointIndex / Math.max(total, 1)) * Math.PI * 2;
                  const dx = Math.cos(angle) * FOCUS_RX;
                  const dy = Math.sin(angle) * FOCUS_RY;
                  return (
                    <line
                      key={point.id}
                      x1={0}
                      y1={0}
                      x2={dx}
                      y2={dy}
                      className="atlas-radial-line"
                      style={{ '--node-delay': `${80 + pointIndex * 55}ms` } as CSSProperties}
                    />
                  );
                })}
              </svg>
            ) : null}

            <button
              type="button"
              className="atlas-hub"
              onClick={() => {
                if (isFocused) return;
                onClusterChange(cluster.id);
              }}
              aria-pressed={isFocused}
              tabIndex={isHidden ? -1 : 0}
            >
              <span className="hub-index">{String(clusterIndex + 1).padStart(2, '0')}</span>
              <span className="hub-title">{cluster.title}</span>
              <span className="hub-count">{clusterPoints.length} 点</span>
            </button>

            {isFocused
              ? clusterPoints.map((point, pointIndex) => {
                  const total = clusterPoints.length;
                  const angle = -Math.PI / 2 + (pointIndex / Math.max(total, 1)) * Math.PI * 2;
                  const dx = Math.cos(angle) * FOCUS_RX;
                  const dy = Math.sin(angle) * FOCUS_RY;
                  const isSelected = point.id === selectedPointId;
                  const nodeStyle = {
                    '--node-x': `${dx}px`,
                    '--node-y': `${dy}px`,
                    '--node-delay': `${140 + pointIndex * 55}ms`,
                  } as CSSProperties;

                  return (
                    <button
                      key={point.id}
                      type="button"
                      className={`atlas-node ${isSelected ? 'is-selected' : ''}`}
                      style={nodeStyle}
                      aria-label={`查看知识点：${point.title}`}
                      aria-pressed={isSelected}
                      onClick={() => onPointSelect(point.id)}
                      title={point.title}
                    >
                      <span className="node-signal" aria-hidden="true" />
                      <span className="atlas-node-title">{point.title}</span>
                      {point.animationType && point.animationType !== 'none' ? (
                        <PlayCircle size={13} aria-label="含动画" />
                      ) : null}
                    </button>
                  );
                })
              : null}
          </section>
        );
      })}

      {!isOverview && focusedCluster ? (
        <button
          type="button"
          className="atlas-return"
          onClick={() => onClusterChange('all')}
          aria-label="返回知识图谱概览"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          返回概览
        </button>
      ) : null}

      <div className="atlas-legend" aria-label="地图图例">
        {isOverview ? (
          <>
            <span>
              <Route size={14} aria-hidden="true" />
              主干路径
            </span>
            <span>
              <Layers3 size={14} aria-hidden="true" />
              点击章节进入子图
            </span>
          </>
        ) : (
          <>
            <span>
              <CircleDot size={14} aria-hidden="true" />
              当前知识点
            </span>
            <span>
              <Layers3 size={14} aria-hidden="true" />
              {focusedCluster?.title ?? ''}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default KnowledgeAtlas;
