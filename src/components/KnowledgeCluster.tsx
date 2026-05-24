import type { CSSProperties } from 'react';
import KnowledgeNode from './KnowledgeNode';
import type { KnowledgeCluster as Cluster, KnowledgePoint } from '../data/courseKnowledge';

type KnowledgeClusterProps = {
  cluster: Cluster;
  points: KnowledgePoint[];
  selectedPointId: string;
  onPointSelect: (id: string) => void;
};

const nodeSlots = [
  { left: '8%', top: '48%' },
  { left: '18%', top: '24%' },
  { left: '38%', top: '12%' },
  { left: '62%', top: '19%' },
  { left: '78%', top: '45%' },
  { left: '18%', top: '67%' },
  { left: '46%', top: '58%' },
  { left: '70%', top: '72%' },
];

function KnowledgeCluster({ cluster, points, selectedPointId, onPointSelect }: KnowledgeClusterProps) {
  const clusterStyle = {
    '--cluster-accent': cluster.accent,
    '--cluster-soft': cluster.soft,
    '--cluster-dark': cluster.dark,
  } as CSSProperties;

  return (
    <article className="cluster-tree" style={clusterStyle}>
      <div className="cluster-canopy" aria-hidden="true">
        <svg viewBox="0 0 320 210" role="img">
          <path className="canopy-shape" d="M54 134c-35-20-25-79 20-78 11-31 52-45 80-24 27-24 72-11 83 22 42-4 64 49 35 77 26 29 4 76-38 69-19 28-64 28-86 3-25 18-67 7-77-22-35 4-60-22-47-47Z" />
          <path className="branch branch-a" d="M158 173 C128 146 98 126 68 110" />
          <path className="branch branch-b" d="M160 171 C142 134 135 96 134 64" />
          <path className="branch branch-c" d="M161 173 C185 138 215 113 253 98" />
          <path className="branch branch-d" d="M160 178 C185 165 217 158 252 166" />
          <path className="trunk" d="M142 207 C146 176 150 151 158 126 C168 152 175 178 178 207 Z" />
        </svg>
      </div>

      <header className="cluster-heading">
        <span className="cluster-kicker">{points.length} 个知识点</span>
        <h2>{cluster.title}</h2>
        <p>{cluster.subtitle}</p>
      </header>

      <div className="node-field" aria-label={`${cluster.title}知识点`}>
        {points.map((point, index) => (
          <KnowledgeNode
            key={point.id}
            point={point}
            selected={selectedPointId === point.id}
            style={nodeSlots[index % nodeSlots.length]}
            onSelect={onPointSelect}
          />
        ))}
      </div>

      <p className="cluster-description">{cluster.description}</p>
    </article>
  );
}

export default KnowledgeCluster;
