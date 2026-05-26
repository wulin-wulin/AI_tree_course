import type { CSSProperties } from 'react';
import type { KnowledgePoint } from '../data/courseKnowledge';

type KnowledgeNodeProps = {
  point: KnowledgePoint;
  selected: boolean;
  style: CSSProperties;
  onSelect: (id: string) => void;
};

function KnowledgeNode({ point, selected, style, onSelect }: KnowledgeNodeProps) {
  const label = point.title.length > 7 ? `${point.title.slice(0, 7)}…` : point.title;

  return (
    <button
      type="button"
      className={`knowledge-node ${selected ? 'is-selected' : ''}`}
      style={style}
      aria-pressed={selected}
      aria-label={`查看知识点：${point.title}`}
      title={point.title}
      onClick={() => onSelect(point.id)}
    >
      <span className="node-dot" aria-hidden="true" />
      <span className="node-label">{label}</span>
    </button>
  );
}

export default KnowledgeNode;
