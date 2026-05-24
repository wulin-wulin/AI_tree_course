import type { AnimationType } from '../data/courseKnowledge';
import AgentLoop from '../animations/AgentLoop';
import AttentionFlow from '../animations/AttentionFlow';
import GradientDescent from '../animations/GradientDescent';
import SearchExpansion from '../animations/SearchExpansion';

type AnimationBlockProps = {
  type?: AnimationType;
  suggestion?: string;
};

const animationTitles: Record<Exclude<AnimationType, 'none'>, string> = {
  attention: '注意力权重流动',
  gradient: '梯度下降路径',
  search: 'A* 节点扩展',
  agentLoop: '智能体交互闭环',
};

function AnimationBlock({ type = 'none', suggestion }: AnimationBlockProps) {
  if (type === 'none') {
    return null;
  }

  return (
    <section className="detail-section">
      <h3>动态示意：{animationTitles[type]}</h3>
      {suggestion ? <p className="detail-note">{suggestion}</p> : null}
      {type === 'attention' ? <AttentionFlow /> : null}
      {type === 'gradient' ? <GradientDescent /> : null}
      {type === 'search' ? <SearchExpansion /> : null}
      {type === 'agentLoop' ? <AgentLoop /> : null}
    </section>
  );
}

export default AnimationBlock;
