import type { KnowledgePoint } from '../data/courseKnowledge';

type DiagramBlockProps = {
  point: KnowledgePoint;
};

function DiagramBlock({ point }: DiagramBlockProps) {
  return (
    <section className="detail-section">
      <h3>自绘图示</h3>
      <p className="detail-note">{point.visualSuggestion ?? '用结构化图形把该知识点的核心关系可视化。'}</p>
      <div className="diagram-canvas">{renderDiagram(point.visualType)}</div>
    </section>
  );
}

function renderDiagram(type: KnowledgePoint['visualType']) {
  switch (type) {
    case 'timeline':
      return <TimelineDiagram />;
    case 'search':
      return <SearchDiagram />;
    case 'logic':
      return <LogicDiagram />;
    case 'knowledgeGraph':
      return <KnowledgeGraphDiagram />;
    case 'learning':
      return <LearningDiagram />;
    case 'decisionTree':
      return <DecisionTreeDiagram />;
    case 'bayes':
      return <BayesDiagram />;
    case 'neuralNetwork':
      return <NeuralNetworkDiagram />;
    case 'gradient':
      return <GradientDiagram />;
    case 'attention':
      return <AttentionDiagram />;
    case 'transformer':
      return <TransformerDiagram />;
    case 'vision':
      return <VisionDiagram />;
    case 'agentLoop':
      return <AgentLoopDiagram />;
    case 'diffusion':
      return <DiffusionDiagram />;
    case 'ethics':
      return <EthicsDiagram />;
    case 'foundation':
    default:
      return <FoundationDiagram />;
  }
}

function FoundationDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="人工智能四个能力支柱">
      <rect x="30" y="24" width="300" height="28" rx="14" className="diagram-plate" />
      <text x="180" y="43" textAnchor="middle">智能行为可计算化</text>
      {['感知', '推理', '学习', '行动'].map((label, index) => (
        <g key={label} transform={`translate(${50 + index * 75}, 72)`}>
          <rect width="55" height="78" rx="16" className="diagram-block" />
          <circle cx="28" cy="24" r="12" className="diagram-dot" />
          <text x="28" y="58" textAnchor="middle">{label}</text>
        </g>
      ))}
      <path d="M44 166H316" className="diagram-line" />
    </svg>
  );
}

function TimelineDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="图灵测试结构">
      <circle cx="180" cy="54" r="28" className="diagram-dot" />
      <text x="180" y="59" textAnchor="middle">评判者</text>
      <rect x="40" y="122" width="92" height="40" rx="14" className="diagram-block" />
      <rect x="228" y="122" width="92" height="40" rx="14" className="diagram-block-alt" />
      <text x="86" y="147" textAnchor="middle">人类</text>
      <text x="274" y="147" textAnchor="middle">机器</text>
      <path d="M160 74C130 92 104 104 88 122" className="diagram-line" />
      <path d="M200 74C230 92 254 104 272 122" className="diagram-line" />
      <text x="180" y="102" textAnchor="middle" className="diagram-small">只看对话表现</text>
    </svg>
  );
}

function SearchDiagram() {
  const cells = [
    [0, 0, 'S'], [1, 0, ''], [2, 0, ''], [3, 0, ''],
    [0, 1, ''], [1, 1, 'x'], [2, 1, ''], [3, 1, ''],
    [0, 2, ''], [1, 2, ''], [2, 2, ''], [3, 2, 'G'],
  ];

  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="搜索网格">
      {cells.map(([x, y, label]) => (
        <g key={`${x}-${y}`} transform={`translate(${64 + Number(x) * 58}, ${28 + Number(y) * 46})`}>
          <rect width="44" height="34" rx="9" className={`grid-cell ${label === 'x' ? 'is-wall' : ''}`} />
          <text x="22" y="23" textAnchor="middle">{label}</text>
        </g>
      ))}
      <path d="M86 45H144V91H202V137H260" className="diagram-path" />
      <text x="180" y="176" textAnchor="middle" className="diagram-small">从起点扩展候选节点，逐步接近目标</text>
    </svg>
  );
}

function LogicDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="逻辑规则推理">
      <rect x="28" y="70" width="90" height="48" rx="14" className="diagram-block" />
      <rect x="136" y="58" width="88" height="72" rx="18" className="diagram-plate" />
      <rect x="242" y="70" width="90" height="48" rx="14" className="diagram-block-alt" />
      <text x="73" y="99" textAnchor="middle">事实</text>
      <text x="180" y="86" textAnchor="middle">IF</text>
      <text x="180" y="110" textAnchor="middle">THEN</text>
      <text x="287" y="99" textAnchor="middle">结论</text>
      <path d="M118 94H136M224 94H242" className="diagram-line" />
    </svg>
  );
}

function KnowledgeGraphDiagram() {
  const nodes = [
    ['AI', 76, 92],
    ['学习', 168, 48],
    ['推理', 262, 88],
    ['知识', 170, 140],
  ] as const;

  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="知识图谱三元组">
      <path d="M91 86L151 55M187 54L247 84M248 99L188 133M152 132L92 102M170 66V124" className="diagram-line" />
      {nodes.map(([label, x, y]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="28" className="diagram-dot" />
          <text x={x} y={y + 5} textAnchor="middle">{label}</text>
        </g>
      ))}
      <text x="180" y="176" textAnchor="middle" className="diagram-small">(实体, 关系, 实体)</text>
    </svg>
  );
}

function LearningDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="机器学习三类范式">
      {[
        ['有标签', '监督学习', 180, 48],
        ['找结构', '无监督学习', 102, 128],
        ['看奖励', '强化学习', 258, 128],
      ].map(([top, bottom, x, y]) => (
        <g key={bottom}>
          <circle cx={Number(x)} cy={Number(y)} r="42" className="diagram-block" />
          <text x={Number(x)} y={Number(y) - 5} textAnchor="middle">{top}</text>
          <text x={Number(x)} y={Number(y) + 18} textAnchor="middle" className="diagram-small">{bottom}</text>
        </g>
      ))}
      <path d="M154 74L124 98M206 74L236 98M144 128H216" className="diagram-line" />
    </svg>
  );
}

function DecisionTreeDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="决策树">
      <circle cx="180" cy="42" r="26" className="diagram-dot" />
      <circle cx="106" cy="105" r="24" className="diagram-block" />
      <circle cx="254" cy="105" r="24" className="diagram-block" />
      <rect x="60" y="146" width="72" height="28" rx="12" className="diagram-block-alt" />
      <rect x="146" y="146" width="72" height="28" rx="12" className="diagram-block-alt" />
      <rect x="232" y="146" width="72" height="28" rx="12" className="diagram-block-alt" />
      <path d="M160 58L124 90M200 58L236 90M101 129L96 146M119 126L170 146M257 130L268 146" className="diagram-line" />
      <text x="180" y="47" textAnchor="middle">特征?</text>
      <text x="96" y="166" textAnchor="middle">A类</text>
      <text x="182" y="166" textAnchor="middle">B类</text>
      <text x="268" y="166" textAnchor="middle">C类</text>
    </svg>
  );
}

function BayesDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="贝叶斯分类">
      <rect x="34" y="52" width="88" height="74" rx="16" className="diagram-block" />
      <rect x="136" y="36" width="88" height="106" rx="18" className="diagram-plate" />
      <rect x="238" y="52" width="88" height="74" rx="16" className="diagram-block-alt" />
      <text x="78" y="82" textAnchor="middle">先验</text>
      <text x="78" y="106" textAnchor="middle">P(C)</text>
      <text x="180" y="78" textAnchor="middle">似然</text>
      <text x="180" y="104" textAnchor="middle">P(x|C)</text>
      <text x="282" y="82" textAnchor="middle">后验</text>
      <text x="282" y="106" textAnchor="middle">P(C|x)</text>
      <path d="M122 89H136M224 89H238" className="diagram-line" />
    </svg>
  );
}

function NeuralNetworkDiagram() {
  const layers = [
    [60, 55, 95, 135],
    [150, 42, 78, 114, 150],
    [240, 62, 114],
    [310, 90],
  ];

  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="神经网络层级结构">
      {layers.slice(0, -1).map((layer, layerIndex) =>
        layer.slice(1).map((y) =>
          layers[layerIndex + 1].slice(1).map((nextY) => (
            <path key={`${layerIndex}-${y}-${nextY}`} d={`M${layer[0] + 12} ${y}L${layers[layerIndex + 1][0] - 12} ${nextY}`} className="diagram-line muted" />
          )),
        ),
      )}
      {layers.map((layer, layerIndex) =>
        layer.slice(1).map((y) => (
          <circle key={`${layerIndex}-${y}`} cx={layer[0]} cy={y} r="13" className={layerIndex === 0 ? 'diagram-dot' : 'diagram-block'} />
        )),
      )}
      <text x="180" y="176" textAnchor="middle" className="diagram-small">输入层 → 隐藏层 → 输出层</text>
    </svg>
  );
}

function GradientDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="梯度下降曲线">
      <path d="M42 151 C96 36 128 42 166 116 C202 181 250 164 318 50" className="loss-curve" />
      <circle cx="122" cy="67" r="10" className="diagram-dot" />
      <circle cx="198" cy="157" r="10" className="diagram-block" />
      <path d="M126 75L184 144" className="diagram-path" />
      <text x="180" y="176" textAnchor="middle" className="diagram-small">沿负梯度方向降低损失</text>
    </svg>
  );
}

function AttentionDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="注意力权重">
      {['我', '喜欢', '机器', '学习'].map((token, index) => (
        <g key={token} transform={`translate(${42 + index * 78}, 124)`}>
          <rect width="58" height="34" rx="13" className="diagram-block" />
          <text x="29" y="23" textAnchor="middle">{token}</text>
        </g>
      ))}
      <path d="M71 124C94 54 180 52 226 124" className="attention-line strong" />
      <path d="M149 124C168 82 206 82 226 124" className="attention-line" />
      <path d="M226 124C248 78 288 78 304 124" className="attention-line soft" />
      <text x="180" y="42" textAnchor="middle" className="diagram-small">相关 token 获得更高权重</text>
    </svg>
  );
}

function TransformerDiagram() {
  const blocks = ['Token', 'Embedding', 'Attention', 'FFN', 'Output'];

  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="Transformer 简化结构">
      {blocks.map((block, index) => (
        <g key={block} transform={`translate(${18 + index * 68}, ${index % 2 === 0 ? 58 : 82})`}>
          <rect width="58" height="46" rx="13" className={index === 2 ? 'diagram-plate' : 'diagram-block'} />
          <text x="29" y="28" textAnchor="middle" className="diagram-small">{block}</text>
        </g>
      ))}
      <path d="M76 82H86M144 106H154M212 82H222M280 106H290" className="diagram-path" />
      <path d="M171 58C192 24 232 28 247 58" className="attention-line" />
      <text x="210" y="35" textAnchor="middle" className="diagram-small">多头关系建模</text>
    </svg>
  );
}

function VisionDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="视觉任务示意">
      <rect x="34" y="36" width="104" height="104" rx="18" className="diagram-plate" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect key={`${row}-${col}`} x={52 + col * 24} y={54 + row * 24} width="20" height="20" rx="5" className="pixel-cell" />
        )),
      )}
      <rect x="78" y="70" width="42" height="34" rx="7" className="detect-box" />
      <path d="M146 88H206" className="diagram-path" />
      <rect x="214" y="48" width="112" height="34" rx="13" className="diagram-block" />
      <rect x="214" y="96" width="112" height="34" rx="13" className="diagram-block-alt" />
      <text x="270" y="70" textAnchor="middle">分类标签</text>
      <text x="270" y="118" textAnchor="middle">位置/掩膜</text>
    </svg>
  );
}

function AgentLoopDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="强化学习智能体闭环">
      <rect x="50" y="70" width="92" height="54" rx="18" className="diagram-block" />
      <rect x="218" y="70" width="92" height="54" rx="18" className="diagram-block-alt" />
      <text x="96" y="102" textAnchor="middle">智能体</text>
      <text x="264" y="102" textAnchor="middle">环境</text>
      <path d="M142 86H218" className="diagram-path" />
      <path d="M218 110H142" className="diagram-path reverse" />
      <text x="180" y="76" textAnchor="middle" className="diagram-small">动作</text>
      <text x="180" y="136" textAnchor="middle" className="diagram-small">观察 / 奖励</text>
    </svg>
  );
}

function DiffusionDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="扩散模型去噪过程">
      {[0, 1, 2, 3].map((step) => (
        <g key={step} transform={`translate(${38 + step * 78}, 60)`}>
          <rect width="56" height="56" rx="15" className={step < 2 ? 'noise-tile' : 'diagram-block'} />
          <circle cx={20 + step * 4} cy={22} r={8 + step} className="diagram-dot" />
          <path d={`M16 ${42 - step * 4}C28 ${30 - step * 2} 40 ${36 - step * 3} 46 ${20 + step * 2}`} className="diagram-line" />
        </g>
      ))}
      <path d="M96 88H116M174 88H194M252 88H272" className="diagram-path" />
      <text x="180" y="150" textAnchor="middle" className="diagram-small">随机噪声 → 多步去噪 → 清晰样本</text>
    </svg>
  );
}

function EthicsDiagram() {
  return (
    <svg viewBox="0 0 360 190" className="diagram-svg" role="img" aria-label="可信 AI 维度">
      <polygon points="180,38 266,86 232,158 128,158 94,86" className="ethics-ring" />
      <polygon points="180,66 232,94 212,138 148,138 128,94" className="ethics-core" />
      {[
        ['公平', 180, 28],
        ['隐私', 286, 88],
        ['安全', 242, 176],
        ['透明', 118, 176],
        ['责任', 74, 88],
      ].map(([label, x, y]) => (
        <text key={label} x={Number(x)} y={Number(y)} textAnchor="middle" className="diagram-small">{label}</text>
      ))}
      <text x="180" y="110" textAnchor="middle">可信 AI</text>
    </svg>
  );
}

export default DiagramBlock;
