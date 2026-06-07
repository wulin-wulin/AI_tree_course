export type Difficulty = '基础' | '中等' | '进阶';

export type VisualType =
  | 'foundation'
  | 'timeline'
  | 'search'
  | 'logic'
  | 'knowledgeGraph'
  | 'learning'
  | 'decisionTree'
  | 'bayes'
  | 'neuralNetwork'
  | 'gradient'
  | 'attention'
  | 'transformer'
  | 'vision'
  | 'agentLoop'
  | 'diffusion'
  | 'ethics';

export type AnimationType = 'attention' | 'gradient' | 'search' | 'agentLoop' | 'none';

export type KnowledgeCluster = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  soft: string;
  dark: string;
};

// R013 新增：例题/分步推导块的数据结构（可一节多例）。
export type WorkedExample = {
  setup: string; // 题面 / 前提
  steps: string[]; // 分步推导
  takeaway?: string; // 一句话结论（可选）
};

// R013 新增：自测题（答案点击展开）。
export type QuizItem = {
  q: string;
  a: string;
};

// R013 迭代1（教材级）新增：复杂度分析（常驻表）。
export type ComplexityInfo = {
  time: string; // 时间复杂度说明
  space: string; // 空间复杂度说明
  note?: string; // 补充（可选）
};

// R013 迭代1 新增：算法/概念对比表（常驻）。
export type ComparisonTable = {
  caption?: string; // 表标题（可选）
  headers: string[]; // 表头
  rows: string[][]; // 每行单元格，长度应与 headers 一致
};

// R013 迭代1 新增：常见误区（✗ 错误认知 / ✓ 纠正）。
export type Pitfall = {
  wrong: string;
  right: string;
};

export type KnowledgePoint = {
  id: string;
  title: string;
  clusterId: string;
  shortSummary: string;
  coreIdea: string;
  principles: string[];
  keyTerms: string[];
  comparisons?: string[];
  formula?: string;
  applications: string[];
  visualType?: VisualType;
  animationType?: AnimationType;
  visualSuggestion?: string;
  animationSuggestion?: string;
  ideologicalElement?: string;
  difficulty: Difficulty;
  prerequisites?: string[];
  // R013 加厚字段：全部可选，未填的知识点照常渲染、不显示对应块。
  intuition?: string; // A 通俗直觉 / 类比（一段）
  deepDive?: string[]; // B 展开讲讲（多段，默认折叠）
  workedExamples?: WorkedExample[]; // C 例题 / 分步推导（可多例，常驻）
  quiz?: QuizItem[]; // E 自测题（答案点击展开）
  relatedPoints?: string[]; // F 知识点关联：存知识点 id，可点跳转
  // R013 迭代1（教材级）新增常驻块：
  pseudocode?: string[]; // 算法步骤 / 伪代码，每行一步
  complexity?: ComplexityInfo; // 复杂度分析（表）
  comparison?: ComparisonTable; // 与邻近算法/概念对比（表）
  pitfalls?: Pitfall[]; // 常见误区
};

export const clusters: KnowledgeCluster[] = [
  {
    id: 'intro-history',
    title: '导论与历史',
    subtitle: 'AI 是什么，为什么发展到今天',
    description: '从定义、图灵测试到三大学派，建立课程的整体坐标。',
    accent: '#2f9e7e',
    soft: '#dff7ed',
    dark: '#175c49',
  },
  {
    id: 'search-solving',
    title: '搜索与问题求解',
    subtitle: '把问题变成状态空间中的路径',
    description: '理解盲目搜索、启发式搜索和博弈搜索的基本机制。',
    accent: '#d97706',
    soft: '#fff0cf',
    dark: '#7a3d02',
  },
  {
    id: 'knowledge-reasoning',
    title: '知识表示与推理',
    subtitle: '让机器表达事实、规则与关系',
    description: '覆盖逻辑、产生式系统、语义网络和知识图谱。',
    accent: '#7c5cff',
    soft: '#ece8ff',
    dark: '#4430a6',
  },
  {
    id: 'machine-learning',
    title: '机器学习基础',
    subtitle: '从数据中学习规律',
    description: '把监督、无监督和经典模型组织成可比较的学习范式。',
    accent: '#238be6',
    soft: '#dceeff',
    dark: '#115184',
  },
  {
    id: 'deep-learning',
    title: '神经网络与深度学习',
    subtitle: '用可训练网络表示复杂函数',
    description: '从神经元、反向传播到 CNN、RNN、Attention 和 Transformer。',
    accent: '#e6537d',
    soft: '#ffe2ea',
    dark: '#912742',
  },
  {
    id: 'nlp-vision',
    title: '自然语言处理与计算机视觉',
    subtitle: '让机器理解语言与图像',
    description: '展示词向量、预训练、图像分类、目标检测和语义分割。',
    accent: '#0ea5a4',
    soft: '#d8f8f5',
    dark: '#0c6665',
  },
  {
    id: 'rl-agents',
    title: '强化学习与智能体',
    subtitle: '在交互中学习行动策略',
    description: '连接智能体、MDP、Q-learning 与策略梯度。',
    accent: '#84a51d',
    soft: '#edf7c8',
    dark: '#4e640e',
  },
  {
    id: 'generative-safety',
    title: '生成式 AI 与安全伦理',
    subtitle: '能力边界、价值对齐与可信应用',
    description: '聚焦大语言模型、扩散模型、偏见、解释性和可信 AI。',
    accent: '#c65a23',
    soft: '#ffe6d7',
    dark: '#793615',
  },
];

export const knowledgePoints: KnowledgePoint[] = [
  {
    id: 'ai-definition',
    title: '人工智能定义',
    clusterId: 'intro-history',
    shortSummary: '人工智能研究如何让机器表现出感知、推理、学习和行动等智能行为。',
    coreIdea: 'AI 不是单一算法，而是一组围绕“智能行为可计算化”的理论、模型和工程方法。',
    principles: ['用计算模型描述智能任务', '通过搜索、知识、学习和交互实现问题求解'],
    keyTerms: ['智能体', '感知', '推理', '学习', '行动'],
    comparisons: ['强人工智能关注机器是否真正具有心智，弱人工智能关注机器能否完成特定智能任务。'],
    applications: ['智能问答', '自动驾驶', '医学辅助诊断'],
    visualType: 'foundation',
    visualSuggestion: '用四根支柱表示感知、推理、学习和行动。',
    ideologicalElement: '理解 AI 能力边界，有助于形成审慎创新和服务社会的技术观。',
    difficulty: '基础',
  },
  {
    id: 'turing-test',
    title: '图灵测试',
    clusterId: 'intro-history',
    shortSummary: '图灵测试用对话中的可区分性来讨论机器是否能表现出智能。',
    coreIdea: '如果人类评判者无法稳定地区分机器和人，机器就可被视为具有某种智能表现。',
    principles: ['以外显行为作为智能判断依据', '把抽象的“能否思考”转化为可观察的交流实验'],
    keyTerms: ['模仿游戏', '行为主义', '评判者', '可区分性'],
    comparisons: ['图灵测试强调行为表现，不直接证明机器拥有意识或理解。'],
    applications: ['对话系统评估', '人机交互研究', 'AI 哲学讨论'],
    visualType: 'timeline',
    visualSuggestion: '用评判者连接人类与机器的对话场景表现测试过程。',
    ideologicalElement: '提醒学生同时关注技术表现和人文问题。',
    difficulty: '基础',
  },
  {
    id: 'symbolic-ai',
    title: '符号主义',
    clusterId: 'intro-history',
    shortSummary: '符号主义认为智能可由符号、规则和逻辑推理来刻画。',
    coreIdea: '把世界知识表示成符号结构，再通过规则操作进行推理和问题求解。',
    principles: ['知识显式表示', '规则驱动推理', '可解释过程优先'],
    keyTerms: ['符号', '规则', '专家系统', '逻辑推理'],
    comparisons: ['相较连接主义，符号主义更可解释，但在感知和噪声数据上适应性较弱。'],
    applications: ['专家系统', '规划系统', '法律规则推理'],
    visualType: 'logic',
    visualSuggestion: '用 IF-THEN 规则链表现符号推理。',
    difficulty: '基础',
  },
  {
    id: 'connectionism',
    title: '连接主义',
    clusterId: 'intro-history',
    shortSummary: '连接主义用大量简单单元的连接权重来形成智能行为。',
    coreIdea: '知识不是显式规则，而是分布在网络连接权重中的可学习表示。',
    principles: ['神经元式计算单元', '权重学习', '分布式表示'],
    keyTerms: ['神经网络', '权重', '激活函数', '表示学习'],
    comparisons: ['连接主义擅长处理感知和模式识别，但解释单个决策更困难。'],
    applications: ['语音识别', '图像识别', '大模型预训练'],
    visualType: 'neuralNetwork',
    visualSuggestion: '用多层节点和连线展示分布式表示。',
    difficulty: '基础',
  },
  {
    id: 'behaviorism-agent',
    title: '行为主义与智能体',
    clusterId: 'intro-history',
    shortSummary: '行为主义关注智能体在环境中的感知、行动和反馈闭环。',
    coreIdea: '智能体现为在环境中选择行动、获得反馈并持续改进行为的能力。',
    principles: ['感知环境状态', '根据目标选择动作', '通过反馈调整策略'],
    keyTerms: ['智能体', '环境', '动作', '反馈'],
    comparisons: ['相较只关注内部推理，智能体视角更重视交互和目标达成。'],
    applications: ['机器人控制', '游戏 AI', '自动驾驶决策'],
    visualType: 'agentLoop',
    animationType: 'agentLoop',
    visualSuggestion: '用 agent-environment 闭环展示交互过程。',
    animationSuggestion: '让观察、动作和奖励沿闭环流动。',
    difficulty: '基础',
  },
  {
    id: 'state-space-search',
    title: '状态空间搜索',
    clusterId: 'search-solving',
    shortSummary: '状态空间搜索把问题求解转化为从初始状态到目标状态的路径寻找。',
    coreIdea: '定义状态、动作、转移和目标，再用搜索策略探索可能路径。',
    principles: ['问题形式化为图或树', '节点代表状态，边代表操作', '搜索策略决定探索顺序'],
    keyTerms: ['状态', '动作', '目标测试', '路径代价'],
    applications: ['路径规划', '拼图问题', '任务规划'],
    visualType: 'search',
    visualSuggestion: '用节点树展示从初始状态扩展到目标状态。',
    difficulty: '基础',
    intuition:
      '把“解决问题”想成在一张地图上找路：你现在站的地方是“状态”，每走一步是一个“动作”，走到的新位置又是一个新状态。求解过程就是从出发点不断尝试可走的步子，直到踩到目标点。换句话说，再复杂的问题——拼图、走迷宫、安排行程——只要能说清“现在是什么样、能做哪些操作、什么算成功”，就能统一翻译成同一道“找路”题。这也是搜索之所以是 AI 通用工具的原因：它不关心问题具体是什么，只关心状态怎么连成图、怎么在图上走到目标。',
    deepDive: [
      '一个状态空间问题由五部分形式化定义：初始状态、可用动作集合、转移模型（在某状态执行某动作后到达哪个新状态）、目标测试（判断是否到达目标）、路径代价（沿路径累加的代价，常写作各步代价之和）。这五要素一旦写清，问题就被“数学化”了，可以交给统一的搜索算法处理。',
      '把这五要素一摆，问题就变成了一张隐式的图：节点是状态，边是动作。注意它通常是“隐式”的——我们不会一次性把所有状态列出来（那可能是天文数字，例如华容道、魔方的状态空间都极其巨大），而是从初始状态出发、按需“扩展（expand）”当前节点、生成它的后继节点（successors）。',
      '要分清两个易混概念：状态（state）是问题世界的一种客观配置；节点（node）是搜索树里的记账单位，除了状态还记着父节点、到达它的动作、累计代价和深度。同一个状态可能对应搜索树里的多个节点（从不同路径到达）。',
      '由此引出“树搜索”与“图搜索”的区别：树搜索不记录已访问状态，可能反复探索同一状态、甚至在有环图上死循环；图搜索维护一个 explored（关闭表）记录已扩展状态，遇到重复状态就跳过，用空间换效率与正确性。',
      '不同搜索策略的差别，仅仅在于“下一个先扩展边界（frontier）里的哪个节点”。这就是后面 BFS、DFS、启发式搜索、A* 全部要回答的同一个问题——它们共享这套状态空间框架，只是挑选节点的规则不同。',
    ],
    pseudocode: [
      'function 搜索(问题):',
      '  边界 frontier ← { 初始状态对应的根节点 }',
      '  explored ← 空集合          // 图搜索才需要',
      '  while frontier 非空:',
      '    node ← 按策略从 frontier 取出一个节点   // 策略决定先取谁',
      '    if 目标测试(node.状态): return 回溯(node) // 得到解路径',
      '    把 node.状态 加入 explored',
      '    for 每个 动作 in 可用动作(node.状态):',
      '      child ← 由 动作 生成的后继节点',
      '      if child.状态 不在 explored 且不在 frontier:',
      '        把 child 加入 frontier',
      '  return 失败',
    ],
    workedExamples: [
      {
        setup:
          '例一（倒水问题）：有一个 3 升和一个 5 升的杯子，水可随意取用，目标量出恰好 4 升。把它形式化成状态空间。',
        steps: [
          '状态：用 (a, b) 表示 3 升杯与 5 升杯的当前水量，初始状态 (0, 0)。',
          '动作：装满某杯、倒空某杯、把一杯倒进另一杯（直到倒空或把另一杯倒满）。',
          '目标测试：任一杯水量等于 4，即 a=4 或 b=4。',
          '一条解：(0,0)→装满 5 升→(0,5)→倒入 3 升→(3,2)→倒空 3 升→(0,2)→把 2 升倒进 3 升杯→(2,0)→装满 5 升→(2,5)→倒满 3 升杯→(3,4)，5 升杯得到 4。',
        ],
        takeaway: '“怎么量 4 升”被翻译成了从 (0,0) 出发、在状态图上找一条到达含 4 状态的路径。',
      },
      {
        setup: '例二（八数码 8-puzzle）：3×3 棋盘上 8 块数字 + 1 个空格，把空格当“可移动”的对象，如何形式化？',
        steps: [
          '状态：3×3 格子里数字的一种排布（共 9!/2 = 181440 个可达状态）。',
          '动作：空格与上/下/左/右相邻块交换（边角处可用动作更少）。',
          '目标测试：排布等于目标布局；路径代价：每移动一步代价 1。',
          '于是“最少几步还原”就是在这 18 万个状态构成的图上找最短路径。',
        ],
        takeaway: '同一套五要素框架，既能套倒水，也能套拼图——这正是状态空间抽象的威力。',
      },
    ],
    complexity: {
      time: '取决于具体策略，一般用三个量刻画：分支因子 b（每个状态平均后继数）、最浅解深度 d、最大深度 m；无信息搜索最坏可达 O(b^d)。',
      space: '瓶颈常在边界与 explored 集合的大小；图搜索需额外存已访问状态，空间换正确性。',
      note: '“状态空间有多大”和“搜索要展开多少”是两件事——好策略能在巨大空间里只展开很小一部分。',
    },
    comparison: {
      caption: '树搜索 vs 图搜索',
      headers: ['维度', '树搜索', '图搜索'],
      rows: [
        ['是否判重', '不记录已访问状态', '维护 explored 记录已扩展状态'],
        ['有环图', '可能死循环', '能避免重复 / 死循环'],
        ['空间', '较省', '额外存已访问集合'],
        ['适用', '状态空间是真正的树', '状态可从多条路径到达'],
      ],
    },
    pitfalls: [
      {
        wrong: '把“状态”和搜索树里的“节点”当成一回事。',
        right: '一个状态可对应多个节点（不同路径到达同一状态）；节点还额外记父节点、动作、代价、深度。',
      },
      {
        wrong: '在有环的状态图上直接用树搜索。',
        right: '不判重会反复探索甚至死循环；应改用图搜索，维护 explored 集合跳过重复状态。',
      },
    ],
    quiz: [
      {
        q: '状态空间问题的五个形式化要素是什么？',
        a: '初始状态、动作集合、转移模型、目标测试、路径代价。',
      },
      {
        q: '状态空间搜索里，“节点”和“边”分别对应什么？',
        a: '节点对应一个状态（搜索树节点还附带父节点、动作、代价等），边对应一个把状态变到另一状态的动作。',
      },
      {
        q: '树搜索和图搜索的核心差别是什么？',
        a: '图搜索维护已访问（explored）集合、对重复状态判重，能避免重复探索与有环死循环；树搜索不判重、更省空间但可能死循环。',
      },
    ],
    relatedPoints: ['breadth-first-search', 'depth-first-search', 'heuristic-function'],
  },
  {
    id: 'breadth-first-search',
    title: '广度优先搜索',
    clusterId: 'search-solving',
    shortSummary: 'BFS 按层扩展节点，能在等代价路径中找到最短步数解。',
    coreIdea: '先扩展离起点最近的状态，逐层向外推进。',
    principles: ['使用队列保存边界节点', '按深度从小到大扩展', '适用于分支有限且路径代价一致的场景'],
    keyTerms: ['队列', '层次扩展', '完备性', '最优性'],
    comparisons: ['BFS 通常比 DFS 更耗内存，但更适合寻找最短步数路径。'],
    applications: ['无权图最短路', '社交网络层级搜索', '迷宫路径'],
    visualType: 'search',
    difficulty: '基础',
    prerequisites: ['状态空间搜索'],
    intuition:
      '想象往平静水面丢一颗石子，波纹一圈一圈向外扩。BFS 就是这样：先看离起点 1 步能到的所有地方，再看 2 步、3 步……一层一层向外铺，绝不会在看完第 1 层之前就跑去看第 2 层。正因为它严格“由近及远”，第一次碰到目标时，走的步数一定是最少的——这是 BFS 最值钱的性质。代价是它得把“当前这一圈”的所有节点都记在手里，圈越大记得越多，所以费内存。',
    deepDive: [
      'BFS 用一个先进先出（FIFO）的队列保存“边界 frontier”（待扩展节点）。每次从队首取一个节点扩展，把它新生成的后继节点放到队尾，于是浅层节点总是先于深层节点被处理——队列的 FIFO 性质直接保证了“逐层”。',
      '一个实现要点：BFS 在“生成”子节点时就做目标测试（而不是等取出时），并在生成时即标记已访问，可以更早终止、也避免同一节点重复入队。',
      '完备性：只要解存在且分支因子有限，BFS 一定能找到解（不会像 DFS 那样陷进无限深的分支）。最优性：当每一步代价相同时，BFS 找到的解就是步数最少的解；但若各步代价不等，“步数最少”不等于“代价最小”，这时要改用等代价搜索（Uniform-Cost Search，按累计代价 g 出队）或带启发式的 A*。',
      '代价是内存：BFS 要同时保存整整一层的边界节点，而一层的节点数随深度指数增长（约 b^d）。时间也同量级。实践中 BFS 往往是“内存先爆，而不是时间先到”——这正是它最主要的短板，也是迭代加深 DFS（兼顾 BFS 的最优与 DFS 的省内存）存在的理由。',
    ],
    pseudocode: [
      'function BFS(问题):',
      '  node ← 初始状态的根节点',
      '  if 目标测试(node): return node',
      '  frontier ← FIFO 队列, 入队 node',
      '  explored ← { node.状态 }',
      '  while frontier 非空:',
      '    node ← frontier 出队          // 取最早进入的（最浅的）',
      '    for 每个 动作 in 可用动作(node.状态):',
      '      child ← 后继节点',
      '      if child.状态 不在 explored:',
      '        if 目标测试(child): return child  // 生成即检测',
      '        加入 explored; child 入队',
      '  return 失败',
    ],
    workedExamples: [
      {
        setup:
          '在一张无权图上从 A 出发找最短步数到达 G。A 的邻居是 B、C；B 的邻居是 D、G；C 的邻居是 G。',
        steps: [
          '第 0 层：队列 [A]，标记 A 已访问，扩展 A → 入队 B、C。队列 [B, C]。',
          '第 1 层：出队 B → 生成 D、G，检测到 G 是目标 → 命中。',
          '回溯父指针：G←B←A，得到路径 A→B→G，共 2 步。',
          'BFS 保证这是步数最少的解；即便 C 也能到 G，那条路也不会更短。',
        ],
        takeaway: 'FIFO 队列带来“逐层扩展”，因此在等代价（无权）场景下首次命中目标即最优。',
      },
    ],
    complexity: {
      time: 'O(b^d)：b 为分支因子，d 为最浅解的深度——最坏要生成到第 d 层的几乎所有节点。',
      space: 'O(b^d)：需同时保存整层边界与已访问集合，内存是 BFS 的主要瓶颈。',
      note: '通常“内存先爆”，所以深而分支大的问题更适合迭代加深 DFS。',
    },
    comparison: {
      caption: 'BFS vs DFS',
      headers: ['维度', 'BFS（广度优先）', 'DFS（深度优先）'],
      rows: [
        ['数据结构', 'FIFO 队列', 'LIFO 栈 / 递归'],
        ['完备性', '是（b 有限）', '否（可能陷无限深）'],
        ['最优性', '等代价时最优', '否'],
        ['空间', 'O(b^d) 大', 'O(b·m) 小'],
        ['擅长', '找最短步数', '省内存、深层探索'],
      ],
    },
    pitfalls: [
      {
        wrong: 'BFS 找到的路径在任何图上都是“代价最小”。',
        right: '只有每步代价相同时，“步数最少”才等于“代价最小”；带权图要用等代价搜索或 A*。',
      },
      {
        wrong: '等到节点出队时才做目标测试和判重。',
        right: '更高效的做法是在“生成子节点”时即测试目标、即标记已访问，能更早结束并避免重复入队。',
      },
    ],
    quiz: [
      {
        q: 'BFS 用哪种数据结构保存边界节点？它带来什么扩展顺序？',
        a: '用先进先出（FIFO）队列，因此节点按深度从小到大、逐层被扩展。',
      },
      {
        q: 'BFS 一定能找到“代价最小”的解吗？',
        a: '不一定。只有在每步代价相同时，它找到的“步数最少”才等于“代价最小”；代价不等时需要等代价搜索或 A*。',
      },
      {
        q: 'BFS 的主要瓶颈通常是时间还是空间？为什么？',
        a: '通常是空间。它要保存整整一层边界节点，数量约 b^d 随深度指数增长，往往内存先耗尽。',
      },
    ],
    relatedPoints: ['state-space-search', 'depth-first-search', 'a-star-search'],
  },
  {
    id: 'depth-first-search',
    title: '深度优先搜索',
    clusterId: 'search-solving',
    shortSummary: 'DFS 沿一个分支尽可能深入，再回溯探索其他分支。',
    coreIdea: '用较小内存快速深入搜索空间，但可能陷入很深或无限分支。',
    principles: ['使用栈或递归', '先深后广', '可结合深度限制避免无限搜索'],
    keyTerms: ['栈', '回溯', '深度限制', '搜索树'],
    comparisons: ['DFS 内存占用低，但不保证找到最短解。'],
    applications: ['拓扑遍历', '约束求解', '组合搜索'],
    visualType: 'search',
    difficulty: '基础',
    prerequisites: ['状态空间搜索'],
    intuition:
      '像走迷宫时“一条道走到黑”：选一个方向一直往里走，撞墙了（走不通或不是目标）就退回上一个岔路口，换一条没试过的路再往里走。这种“先深入、走不通再回头”的策略就是 DFS——回头的动作叫回溯（backtracking）。它的好处是脑子里只需要记住“当前这一条路”，所以省内存；坏处是它可能一头扎进一条又长又错的路里出不来，也不保证先找到的就是最短的那条。',
    deepDive: [
      'DFS 用栈（后进先出，LIFO）或等价的递归来保存路径：总是优先扩展最新生成的、最深的节点。一旦当前分支到底或失败，就弹栈回到上一个分叉点，继续尝试它尚未走过的兄弟分支。',
      '它最大的优点是省内存：任何时刻只需保存“当前这条从根到叶的路径”及沿途各节点未展开的兄弟，内存约 O(b·m) 随深度线性增长，而不是像 BFS 那样保存整整一层 O(b^d)。这在状态空间很大时是决定性优势。',
      '代价是：DFS 既不完备也不最优——在无限深或带环的空间里可能一直下陷找不到解；即便找到，解也未必最短。常见补救有三：深度受限 DFS（设上限 L，超过就回溯）、迭代加深 DFS（L 从 0 逐步加大，反复跑 DFS），以及对环做判重。',
      '迭代加深（IDS）是经典折中：它像 DFS 一样省内存 O(b·d)，又像 BFS 一样在等代价时给出最短解。重复搜索浅层看似浪费，但因为节点数随层指数增长，最深一层占了绝大多数，重复开销其实只是常数倍，整体仍是 O(b^d)。',
    ],
    pseudocode: [
      'function DFS(node, 深度上限 L):   // 深度受限版，递归实现',
      '  if 目标测试(node.状态): return node',
      '  if node.深度 = L: return 截断       // 达到上限，回溯',
      '  for 每个 动作 in 可用动作(node.状态):',
      '    child ← 后继节点',
      '    result ← DFS(child, L)',
      '    if result ≠ 失败/截断: return result',
      '  return 失败/截断                    // 本分支走完，回溯到上层',
    ],
    workedExamples: [
      {
        setup:
          '同一张图：A 的邻居 B、C；B 的邻居 D、G；C 的邻居 G。用 DFS（优先走先入栈的分支，先 B 后 C）从 A 找 G。',
        steps: [
          '压栈深入：A → B → D（沿最左分支一直到底）。',
          'D 不是目标且无新邻居 → 弹栈回溯到 B。',
          'B 还有未走的邻居 G → 命中目标。访问序为 A、B、D、G。',
          '注意：DFS 找到的这条路是“先撞到的”，不保证步数最少——若图序变成先访问一条很长的弯路，它就会先返回那条长路。',
        ],
        takeaway: 'LIFO 栈带来“先深后广”，省内存但不保证最短解，常配深度限制 / 迭代加深使用。',
      },
    ],
    complexity: {
      time: 'O(b^m)：m 为搜索树最大深度，最坏要走遍整棵树；m 可能远大于最浅解深度 d。',
      space: 'O(b·m)：只存当前路径及沿途兄弟，随深度线性增长——这是 DFS 相对 BFS 的核心优势。',
      note: '迭代加深 DFS 用 O(b·d) 空间换回等代价最优，是“省内存 + 最短解”的折中。',
    },
    comparison: {
      caption: 'DFS 家族对比',
      headers: ['策略', '完备', '最优(等代价)', '空间'],
      rows: [
        ['基础 DFS', '否', '否', 'O(b·m)'],
        ['深度受限 DFS', '若解在 L 内则是', '否', 'O(b·L)'],
        ['迭代加深 DFS', '是', '是', 'O(b·d)'],
        ['BFS（对照）', '是', '是', 'O(b^d)'],
      ],
    },
    pitfalls: [
      {
        wrong: 'DFS 找到的第一条到达目标的路，就是最短路。',
        right: 'DFS 不保证最短；它返回的是“按访问顺序最先撞到”的解，可能绕远。要最短需 BFS / 迭代加深 / A*。',
      },
      {
        wrong: '在有环或无限深的空间里直接跑基础 DFS。',
        right: '会死循环或一直下陷；应加判重（图搜索）或深度限制 / 迭代加深。',
      },
    ],
    quiz: [
      {
        q: 'DFS 相比 BFS 最大的优势是什么？代价又是什么？',
        a: '优势是内存占用低（只需保存当前路径，约 O(b·m) 随深度线性增长）；代价是不完备、不最优，可能陷入很深或无限的分支。',
      },
      {
        q: '怎样避免 DFS 在很深/无限的分支上一直下陷？',
        a: '给它加深度限制（深度受限 DFS），或使用迭代加深搜索逐步放大深度上限，并对环做判重。',
      },
      {
        q: '迭代加深 DFS 为什么能同时“省内存”和“等代价最优”？',
        a: '它按 DFS 方式搜索（空间 O(b·d)），又像 BFS 一样从浅到深逐层放开上限，因此第一次找到的解最浅、等代价时最优；重复搜浅层的开销只是常数倍。',
      },
    ],
    relatedPoints: ['state-space-search', 'breadth-first-search'],
  },
  {
    id: 'heuristic-function',
    title: '启发式函数',
    clusterId: 'search-solving',
    shortSummary: '启发式函数估计状态到目标的剩余代价，引导搜索更快接近答案。',
    coreIdea: '用领域知识给搜索方向提供“直觉”，减少盲目扩展。',
    principles: ['估计目标距离', '在速度和准确性之间折中', '可采纳启发式不高估真实代价'],
    keyTerms: ['h(n)', '可采纳性', '一致性', '估计代价'],
    comparisons: ['盲目搜索不使用目标信息，启发式搜索用估计值优先探索希望更大的节点。'],
    formula: 'f(n) = g(n) + h(n)',
    applications: ['A* 搜索', '路径规划', '游戏寻路'],
    visualType: 'search',
    difficulty: '中等',
    prerequisites: ['状态空间搜索'],
    intuition:
      '盲目搜索像蒙着眼睛在房间里乱摸找门，启发式函数则像给搜索装上“目标方向感”：每到一个节点 n，它先估一下“从这儿到目标大概还有多远”，记作 h(n)，然后优先去探索那些“看起来离目标更近”的节点。哪怕这个估计很粗——比如直接量当前点到终点的直线距离——也足以让搜索朝目标方向使劲，少走大量冤枉路。启发式的好坏，直接决定了搜索是“事半功倍”还是“瞎忙”。',
    deepDive: [
      'h(n) 是一个估计值而非精确值，它编码了我们对问题的“领域知识”。地图寻路里常用直线（欧氏）距离或曼哈顿距离；八数码里常用“放错位的方块数”或“各方块到目标位的曼哈顿距离之和”。设计一个好启发式，往往是把原问题“放松约束”后求精确解——这类松弛问题的最优解天然就是可采纳启发式。',
      '可采纳性（admissible）：对所有 n 有 h(n) ≤ h*(n)，即从不高估到目标的真实最小代价 h*。它是 A* 用树搜索时能保证最优解的关键——因为不高估，就不会过早放弃一条实际更优的路。',
      '一致性（consistent，又称单调性）：对任意一步 n→n′ 有 h(n) ≤ cost(n,n′) + h(n′)，类似三角不等式。一致性比可采纳性更强（一致必可采纳，反之不一定），它保证 A* 用图搜索时每个节点只需扩展一次、f 值沿任意路径单调不减，效率更稳。',
      '启发式的“强弱（informedness）”决定效率：若对所有 n 都有 h₂(n) ≥ h₁(n) 且二者皆可采纳，则称 h₂ 占优（dominates）h₁，用 h₂ 的 A* 扩展的节点不会更多。极端地，h≡0 可采纳但毫无信息，A* 退化成等代价搜索（Dijkstra）；h 越贴近 h*，扩展越少；若 h=h* 则一路直奔目标。',
      '多个可采纳启发式可取逐点最大值组合：h(n)=max(h₁(n),…,hₖ(n)) 仍可采纳，且占优于其中每一个——这是实践中“拼”出强启发式的常用手法。',
    ],
    workedExamples: [
      {
        setup:
          '网格地图只能上下左右走、每步代价 1。当前格 (0,0)，目标 (3,2)。比较两种启发式。',
        steps: [
          '曼哈顿距离 h₁ = |3-0| + |2-0| = 5，表示“至少还要 5 步”。',
          '因为不能斜走、每步代价 1，真实最少步数恰好也是 5 → h₁ 没高估，可采纳，且正好等于 h*。',
          '直线距离 h₂ = √(3²+2²) ≈ 3.6，同样不高估（更小），但比曼哈顿“更松”，对该网格引导力更弱。',
          '结论：两者都可采纳，但 h₁ 占优于 h₂，用 h₁ 的 A* 扩展节点更少。',
        ],
        takeaway: '好的启发式要“不高估、又尽量贴近真实代价”——前者保证最优，后者保证高效。',
      },
      {
        setup: '八数码里设计启发式：用“放错位方块数 h_a”和“各方块曼哈顿距离之和 h_b”，哪个更好？',
        steps: [
          '某局面有 6 个方块不在目标位 → h_a = 6。',
          '这 6 个方块各自到目标位的曼哈顿距离相加 = 比如 12 → h_b = 12。',
          '两者都不高估真实步数（每步最多消去 1 个错位、最多让一个方块靠近 1 格）→ 皆可采纳。',
          'h_b ≥ h_a 恒成立 → h_b 占优，A* 用 h_b 更快。',
        ],
        takeaway: '“放松约束后的精确代价”是构造可采纳启发式的通用配方，且越接近真实越强。',
      },
    ],
    complexity: {
      time: '启发式本身的计算应尽量轻（常 O(1)~O(状态规模)）；它的价值在于把搜索的指数底数“变小”，整体快多少取决于 h 有多准。',
      space: '通常不额外占空间，只是给每个节点多算一个 h 值。',
      note: '启发式是“以少量计算换大量剪枝”的买卖——估得准才划算，估得离谱反而拖慢。',
    },
    comparison: {
      caption: '常见启发式性质',
      headers: ['启发式', '可采纳', '相对强弱'],
      rows: [
        ['h ≡ 0', '是', '最弱（退化为 Dijkstra）'],
        ['直线/欧氏距离', '是（网格不可斜走时偏松）', '中'],
        ['曼哈顿距离', '上下左右移动时是', '强'],
        ['h = h*（真实代价）', '是', '最强（直奔目标）'],
      ],
    },
    pitfalls: [
      {
        wrong: 'h 估得越大越好，估得大搜得快。',
        right: '估得大确实更快，但一旦高估就不再可采纳、可能丢最优解；追求最优时必须保证不高估。',
      },
      {
        wrong: '可采纳和一致是一回事。',
        right: '一致更强：一致必可采纳，反之未必。图搜索要保证最优、且节点只扩展一次，需要一致性。',
      },
    ],
    quiz: [
      {
        q: '“可采纳启发式”是什么意思？它保证了什么？',
        a: '指 h(n) 从不高估到目标的真实最小代价 h*(n)。它保证 A*（树搜索）能找到最优解。',
      },
      {
        q: '在都可采纳的两个启发式里，越接近真实代价的那个有什么好处？',
        a: '它占优（dominates）另一个，引导力更强、扩展的节点更少、效率更高；h≡0 时则退化为盲目的等代价搜索。',
      },
      {
        q: '手里有两个可采纳启发式 h₁、h₂，怎么组合出更强且仍可采纳的启发式？',
        a: '取逐点最大值 h(n)=max(h₁(n),h₂(n))：它仍可采纳，且占优于各自。',
      },
    ],
    relatedPoints: ['state-space-search', 'a-star-search'],
  },
  {
    id: 'a-star-search',
    title: 'A* 搜索',
    clusterId: 'search-solving',
    shortSummary: 'A* 同时考虑已走代价和预计剩余代价，是经典启发式最短路径算法。',
    coreIdea: '每次选择 f(n)=g(n)+h(n) 最小的节点扩展，在合适启发式下兼顾效率和最优性。',
    principles: ['g(n) 表示起点到当前节点的实际代价', 'h(n) 表示当前节点到目标的估计代价', '可采纳启发式可保证最优解'],
    keyTerms: ['开放表', '关闭表', '路径代价', '启发式'],
    comparisons: ['当 h(n)=0 时，A* 退化为 Dijkstra；当更偏重 h(n) 时更像贪心最佳优先搜索。'],
    formula: 'f(n) = g(n) + h(n)',
    applications: ['机器人导航', '游戏地图寻路', '物流路径规划'],
    visualType: 'search',
    animationType: 'search',
    visualSuggestion: '用网格显示起点、目标、已扩展节点和候选路径。',
    animationSuggestion: '逐格点亮搜索前沿，最后连成路径。',
    difficulty: '中等',
    prerequisites: ['启发式函数', '状态空间搜索'],
    intuition:
      '在陌生城市找地铁站：只看“已经走了多远”，你会把附近岔路都试一遍，很慢；只看“大概在那个方向”猛冲，又可能撞进死胡同绕远。A* 的聪明在于把两者相加——既不浪费已走的路（g），又始终朝目标使劲（h）——所以它走得又快又稳。',
    deepDive: [
      'A* 给每个节点算一个评分 f(n)=g(n)+h(n)：g(n) 是从起点到 n 的真实已付出代价（精确累加），h(n) 是 n 到目标的估计剩余代价。f(n) 就是“经过 n 的整条路的预估总代价”。A* 维护一个开放表（按 f 排序的优先队列）和关闭表（已扩展节点），每次取出 f 最小的节点扩展。',
      '更新规则：扩展 n 时对每个邻居 m，新路径代价 g_new = g(n)+cost(n,m)。若 m 没见过，或 g_new 比已记录的 g(m) 更小，就更新 m 的 g、f 与父指针并放入开放表（这一步叫 relax / 松弛）。这保证每个节点记录的是“目前已知到它的最短路”。',
      '为什么可采纳的 h 能保证最优？因为此时 f 始终是经过该节点的真实总代价的下界。当目标第一次从优先队列被取出时，它的 f 等于其真实代价，而队列里其它任何节点的 f 都不小于它——不可能还藏着一条更短的路，否则那条路上的节点 f 会更小、会被先取出。',
      '若 h 还满足一致性，则沿任意路径 f 单调不减，每个节点第一次被取出时其 g 即最优，因此只会被扩展一次，无需反复回退更新——这让图搜索版 A* 既正确又高效。',
      'A* 是一族算法的统一视角：h≡0 时只剩 g，退化为 Dijkstra（等代价搜索）；只用 h、丢掉 g 则是贪心最佳优先搜索（快但可能不最优）。给 h 加权得 f=g+w·h（加权 A*，w>1）会更快但可能牺牲最优性，是工程上常用的“快一点、略次优”折中。',
      '最优性还有个更强的结论：在同样可采纳启发式下，A*（一致 h）扩展的节点集合本质上是“最少的”——任何同样保证最优的算法都至少要扩展 A* 扩展过的那些 f<C* 的节点。所以 A* 不只是“一种好算法”，在某种意义上是“最有效率的最优算法”。',
    ],
    pseudocode: [
      'function A*(起点, 目标):',
      '  g[起点] ← 0;  f[起点] ← h(起点)',
      '  开放表 ← 优先队列(按 f), 放入 起点',
      '  while 开放表 非空:',
      '    n ← 取出 f 最小的节点',
      '    if n = 目标: return 回溯路径(n)',
      '    把 n 加入 关闭表',
      '    for 每个邻居 m of n:',
      '      g_new ← g[n] + cost(n, m)',
      '      if g_new < g[m]:               // 发现更短路 → 松弛',
      '        g[m] ← g_new;  f[m] ← g_new + h(m);  父[m] ← n',
      '        把 m 放入/更新 开放表',
      '  return 失败',
    ],
    workedExamples: [
      {
        setup:
          '搜索边界上有两个候选节点 A、B，启发式 h 可采纳。已知 A：g=2、h=5；B：g=4、h=2。A* 先扩展谁？',
        steps: [
          '算 f：f(A)=g+h=2+5=7；f(B)=4+2=6。',
          '比较 f：6 < 7 → 先扩展 B（尽管 B 已走的 g 更大）。',
          '展开 B 的邻居，对每个邻居做松弛、算 g+h，重新塞回优先队列，继续取 f 最小者。',
        ],
        takeaway: 'A* 不是“谁走得近选谁”，而是“谁的预估总账 f=g+h 最小选谁”。',
      },
      {
        setup:
          '网格寻路（每步代价 1，曼哈顿启发式）。起点 S=(0,0)，目标 T=(2,0)，但 (1,0) 是墙。看 A* 怎么绕。',
        steps: [
          'S 的邻居 (1,0) 是墙跳过；(0,1)：g=1,h=|2-0|+|0-1|=3,f=4。先走它。',
          '从 (0,1) 扩展 (1,1)：g=2,h=2,f=4；继续 (2,1)：g=3,h=1,f=4。',
          '从 (2,1) 扩展 (2,0)=T：g=4,h=0,f=4 → 取出即目标。',
          '路径 S→(0,1)→(1,1)→(2,1)→T，长度 4——绕开墙的最短路；全程 f 稳定为 4，几乎没走冤枉格。',
        ],
        takeaway: '可采纳启发式让 A* 沿 f 几乎恒定的“等值带”直奔目标，绕障也只多走必要的格子。',
      },
    ],
    complexity: {
      time: '最坏 O(b^d)（启发式无信息时同 Dijkstra/BFS）；h 越准、扩展的节点越少，实际可远快于此。',
      space: 'O(开放表+关闭表)，最坏 O(b^d)——A* 要把所有候选节点留在内存，空间通常是它的瓶颈。',
      note: '内存吃紧时用 IDA*、SMA* 等变体以时间换空间。',
    },
    comparison: {
      caption: 'A* 与邻近算法',
      headers: ['算法', '评价依据', '最优性'],
      rows: [
        ['Dijkstra / 等代价', '只用 g', '是'],
        ['贪心最佳优先', '只用 h', '否'],
        ['A*', 'f = g + h', 'h 可采纳时是'],
        ['加权 A* (w>1)', 'f = g + w·h', '否（更快、次优有界）'],
      ],
    },
    pitfalls: [
      {
        wrong: 'h 估得越大越好，估得大搜得快。',
        right: '高估虽快但会丢最优性；要最优解，h 必须不高估（可采纳）。',
      },
      {
        wrong: 'A* 永远是最快的搜索算法。',
        right: 'h≡0 时它退化成 Dijkstra；它省的是“扩展节点数”，不必然是壁钟时间最短，且空间开销大。',
      },
    ],
    quiz: [
      {
        q: '把所有 h(n) 设为 0，A* 等价于哪种算法？',
        a: '等价于 Dijkstra / 等代价搜索——因为只剩 g 在起作用。',
      },
      {
        q: 'A* 要找到最优解，启发式 h 必须满足什么条件？',
        a: '可采纳性（admissible），即对任意节点都不高估到目标的真实剩余代价；图搜索还需一致性以避免重复扩展。',
      },
      {
        q: '为什么 A* 第一次取出目标节点时就能停？',
        a: '因为可采纳 h 下 f 是真实总代价下界，目标被取出时其 f 等于真实代价，且不大于队列中任何其它节点的 f——不可能再有更短的路，可安全终止。',
      },
    ],
    relatedPoints: ['heuristic-function', 'breadth-first-search', 'game-search-minimax'],
  },
  {
    id: 'game-search-minimax',
    title: '博弈搜索与 Minimax',
    clusterId: 'search-solving',
    shortSummary: 'Minimax 用“我方最大化、对手最小化”的方式评估零和博弈决策。',
    coreIdea: '在对手也理性行动的假设下，从博弈树底部向上回传局面价值。',
    principles: ['MAX 层选择最大收益', 'MIN 层选择最小化我方收益', '评价函数估计叶节点价值'],
    keyTerms: ['博弈树', 'MAX/MIN 层', '评价函数', '零和博弈'],
    comparisons: ['普通搜索寻找目标路径，博弈搜索还要考虑对手的最优反制。'],
    applications: ['井字棋', '国际象棋引擎', '对抗决策'],
    visualType: 'decisionTree',
    difficulty: '中等',
    prerequisites: ['搜索树'],
    intuition:
      '下棋时高手不会只想“我这步多爽”，而是会想“我走了之后，对手会怎么反击我最难受”，再倒推回来选当前最稳的一步。Minimax 就是把这种“假设对手也走最优”的对弈思路算法化：轮到我时挑对我最有利的，轮到对手时假设他挑对我最不利的。',
    deepDive: [
      '博弈被建模成一棵博弈树：层与层交替属于双方。我方决策的层叫 MAX 层（取子节点最大值），对手决策的层叫 MIN 层（取子节点最小值），因为在零和博弈里“对我最好”恰是“对他最差”，双方的利益完全相反。',
      '叶节点用评价函数给出局面分数：终局可用真实胜负（赢 +∞、平 0、输 −∞），非终局（因深度截断而停）用启发式评估函数估值，例如国际象棋常用“子力 + 位置”的加权和。评价函数的质量很大程度决定了引擎棋力。',
      '算法本体是一个递归：从叶向根“回传（back up）”——MAX 层取孩子里的最大值，MIN 层取最小值，一直传到根；根处取到最大值的那个孩子，就是当前该走的着法。这一过程也叫极小化极大。',
      'Minimax 假设对手完全理性、也走最优，因此给出的是“最坏情况下最好的结果”——即便对手不那么强，按 Minimax 走也不会更糟。完整博弈树往往大到无法穷举（国际象棋状态数天文级），实践中会限制搜索深度、在截断处用评价函数估值，并配合 Alpha-Beta 剪枝；多人或非零和博弈则需推广（如各方各自最大化的向量回传）。',
    ],
    pseudocode: [
      'function minimax(node, 轮到MAX):',
      '  if node 是叶/到达深度: return 评价(node)',
      '  if 轮到MAX:',
      '    best ← −∞',
      '    for child of node: best ← max(best, minimax(child, false))',
      '    return best',
      '  else:                       // 轮到 MIN',
      '    best ← +∞',
      '    for child of node: best ← min(best, minimax(child, true))',
      '    return best',
    ],
    workedExamples: [
      {
        setup:
          '一棵两层博弈树：根是 MAX；它有两个 MIN 孩子。左 MIN 的叶子是 {3, 5}，右 MIN 的叶子是 {2, 9}。根该选哪边？',
        steps: [
          'MIN 层先回传（对手取最小）：左 MIN = min(3,5)=3；右 MIN = min(2,9)=2。',
          'MAX 层（我方取最大）：根 = max(3, 2)=3。',
          '所以根选“左”分支，保证至少拿到 3。注意右边虽有诱人的 9，但理性对手会把我们压到 2，不能贪。',
        ],
        takeaway: '价值从叶子按 MAX 取大、MIN 取小逐层回传到根，根处最优孩子即当前最佳着法。',
      },
    ],
    complexity: {
      time: 'O(b^m)：b 为每步合法着法数（分支因子），m 为搜索深度——需遍历整棵深度 m 的博弈树。',
      space: 'O(b·m)：递归深度优先，只存当前一条路径，与 DFS 同量级。',
      note: '指数爆炸是博弈搜索的核心难题，Alpha-Beta 剪枝与评价函数截断是主要应对手段。',
    },
    comparison: {
      caption: '普通搜索 vs 博弈搜索',
      headers: ['维度', '普通搜索(如 A*)', '博弈搜索(Minimax)'],
      rows: [
        ['环境', '单方、静态', '双方对抗、对手会反制'],
        ['目标', '找到达目标的路径', '找最优着法（对手也最优）'],
        ['回传方式', '沿一条路径累加代价', '逐层 MAX 取大 / MIN 取小'],
        ['终止', '到达目标', '终局或深度截断 + 评价函数'],
      ],
    },
    pitfalls: [
      {
        wrong: '只挑“眼前收益最大”的着法走。',
        right: '要倒推对手的最优反制：贪图大数（如 9）可能被理性对手压到很低；Minimax 选的是“对手最优下我仍最好”。',
      },
      {
        wrong: '把 MIN 层也当成“为我取最大”。',
        right: 'MIN 层是对手在决策，他取对我最不利（最小）的值；只有我方 MAX 层才取最大。',
      },
    ],
    quiz: [
      {
        q: '为什么对手所在的层要取“最小值”？',
        a: '因为是零和博弈，对手让自己最好就等于让我方最差；从我方收益的角度看，对手会把我的收益压到最小。',
      },
      {
        q: '完整博弈树通常无法穷举，实践中怎么办？',
        a: '限制搜索深度，在截断处用评价函数估算局面分数，并用 Alpha-Beta 剪枝跳过无用分支。',
      },
      {
        q: 'Minimax 的时间复杂度是多少？主要难点是什么？',
        a: 'O(b^m)，b 为分支因子、m 为深度；难点是博弈树随深度指数爆炸，必须靠剪枝和评价函数截断来控制。',
      },
    ],
    relatedPoints: ['alpha-beta-pruning', 'a-star-search'],
  },
  {
    id: 'alpha-beta-pruning',
    title: 'Alpha-Beta 剪枝',
    clusterId: 'search-solving',
    shortSummary: 'Alpha-Beta 剪枝在不改变 Minimax 结果的前提下跳过无用分支。',
    coreIdea: '用 alpha 和 beta 记录当前可保证边界，发现不可能影响最终选择的分支就停止展开。',
    principles: ['alpha 表示 MAX 当前最好下界', 'beta 表示 MIN 当前最好上界', '当 alpha >= beta 时发生剪枝'],
    keyTerms: ['alpha', 'beta', '剪枝', '博弈树'],
    formula: 'prune when alpha >= beta',
    applications: ['棋类 AI', '对抗搜索优化', '决策树裁剪类比教学'],
    visualType: 'decisionTree',
    difficulty: '进阶',
    prerequisites: ['博弈搜索与 Minimax'],
    intuition:
      '挑西瓜时，如果第一个摊位已经有个 8 分的瓜，到第二个摊位老板刚说“我这最好的也就 6 分”，你立刻就不用再翻看他剩下的瓜了——反正不可能比 8 分更好。Alpha-Beta 剪枝就是这个道理：一旦发现某个分支不可能影响最终选择，就直接跳过，不浪费力气展开。',
    deepDive: [
      'Alpha-Beta 在 Minimax 递归里多带两个边界：alpha 是“MAX 方在通往此处的路径上，目前至少已能保证的值”（下界）；beta 是“MIN 方目前至多会允许的值”（上界）。搜索向下传递 [alpha, beta] 这个窗口，向上回传时不断收紧它。',
      '剪枝条件是 alpha ≥ beta：窗口闭合，意味着当前节点的真实值已落在“上层双方都不会选择”的区间，继续展开它剩下的孩子毫无意义，直接砍掉。发生在 MAX 节点的叫 β 剪枝（值已 ≥ beta），发生在 MIN 节点的叫 α 剪枝（值已 ≤ alpha）。',
      '关键性质：剪枝不改变 Minimax 的最终结果——被剪掉的分支被证明不可能影响根的选择，所以返回的着法与纯 Minimax 完全一样。它只是“省了算白工”，不是“近似”。',
      '收益取决于节点访问顺序：若总能先搜“最好的”着法（好的着法排序，例如用上一轮迭代加深的结果、置换表、杀手启发），剪枝最充分。理想顺序下有效分支因子从 b 降到约 √b，时间从 O(b^m) 降到 O(b^{m/2})——相当于在同样时间里把搜索深度翻一倍，这对棋力是质变。',
    ],
    pseudocode: [
      'function αβ(node, α, β, 轮到MAX):',
      '  if node 是叶/到深度: return 评价(node)',
      '  if 轮到MAX:',
      '    v ← −∞',
      '    for child of node:',
      '      v ← max(v, αβ(child, α, β, false))',
      '      α ← max(α, v)',
      '      if α ≥ β: break       // β 剪枝：剩余孩子不用看',
      '    return v',
      '  else:',
      '    v ← +∞',
      '    for child of node:',
      '      v ← min(v, αβ(child, α, β, true))',
      '      β ← min(β, v)',
      '      if α ≥ β: break       // α 剪枝',
      '    return v',
    ],
    workedExamples: [
      {
        setup:
          '根是 MAX，左 MIN 孩子已算完得 3，于是根的 alpha=3。现在搜右 MIN 孩子，它第一个叶子的值是 2。还要不要看右 MIN 剩下的叶子？',
        steps: [
          '右孩子是 MIN 层，它的值 = 它所有叶子的最小值，看到 2 后只会 ≤ 2。',
          '此时右孩子的上界 beta=2，而沿路径传下来的 alpha=3，满足 alpha(3) ≥ beta(2) → 触发剪枝。',
          '右 MIN 最终 ≤ 2，绝不可能超过左边的 3，根一定不会选它 → 右孩子剩余叶子全部跳过。',
        ],
        takeaway: '当 alpha ≥ beta，剩余分支不可能改变上层选择，直接剪掉；结果与纯 Minimax 一致。',
      },
      {
        setup:
          '看“着法排序”的威力：同一个 MIN 节点有叶子 {2, 7, 1}，父节点 alpha=3。比较先看 2 与先看 7 两种顺序的剪枝量。',
        steps: [
          '先看 2：MIN 当前值降到 2 ≤ alpha(3) → 立刻剪掉 7 和 1，只看了 1 个叶子。',
          '先看 7：MIN 当前值 7，未触发剪枝；再看 2 才降到 2 ≤ 3 → 剪掉 1，看了 2 个叶子。',
          '同样的树、同样的结果，访问顺序好就少看一半叶子。',
        ],
        takeaway: '剪枝效率高度依赖访问顺序——好的着法排序是 Alpha-Beta 发挥威力的前提。',
      },
    ],
    complexity: {
      time: '最坏 O(b^m)（无任何剪枝，退化为 Minimax）；最优着法排序下约 O(b^{m/2})，有效分支因子降到 √b。',
      space: 'O(b·m)，与 Minimax 同（深度优先递归）。',
      note: '结果与 Minimax 完全相同，是无损优化；提速全靠剪掉被证明无关的分支。',
    },
    comparison: {
      caption: 'Minimax vs Alpha-Beta',
      headers: ['维度', 'Minimax', 'Alpha-Beta'],
      rows: [
        ['结果', '最优着法', '同 Minimax（无损）'],
        ['时间(最坏)', 'O(b^m)', 'O(b^m)'],
        ['时间(理想序)', 'O(b^m)', 'O(b^{m/2})'],
        ['依赖', '—', '着法排序质量'],
      ],
    },
    pitfalls: [
      {
        wrong: 'Alpha-Beta 是一种近似，可能给出比 Minimax 差的着法。',
        right: '它是无损优化，结果与 Minimax 完全相同；只是跳过了被证明不影响结果的分支。',
      },
      {
        wrong: '不管怎么排着法，Alpha-Beta 都能稳定快一倍。',
        right: '提速依赖访问顺序：最坏顺序退化为 Minimax，只有较好的着法排序才接近 O(b^{m/2})。',
      },
    ],
    quiz: [
      {
        q: 'Alpha-Beta 剪枝的触发条件是什么？',
        a: '当 alpha ≥ beta 时剪枝——当前分支已不可能影响上层的最终选择。',
      },
      {
        q: '剪枝会让 Minimax 给出不同的着法吗？什么因素决定剪枝效率？',
        a: '不会，最终着法与纯 Minimax 完全相同；剪枝效率取决于节点访问顺序，越早搜到好着法、剪得越多。',
      },
      {
        q: '理想着法排序下，Alpha-Beta 把时间复杂度从 O(b^m) 降到多少？意味着什么？',
        a: '降到约 O(b^{m/2})，有效分支因子从 b 降到 √b——相当于同样时间内能多搜一倍深度。',
      },
    ],
    relatedPoints: ['game-search-minimax'],
  },
  {
    id: 'propositional-logic',
    title: '命题逻辑',
    clusterId: 'knowledge-reasoning',
    shortSummary: '命题逻辑用真假命题和逻辑联结词表达可判定事实。',
    coreIdea: '把复杂判断拆成命题变量，再用与、或、非、蕴含等规则进行推理。',
    principles: ['命题只有真或假', '复合命题由联结词构成', '真值表可验证推理有效性'],
    keyTerms: ['命题', '真值表', '蕴含', '可满足性'],
    comparisons: ['命题逻辑表达简单，但不能直接描述对象、属性和量词。'],
    applications: ['规则校验', '电路逻辑', '自动定理证明入门'],
    visualType: 'logic',
    difficulty: '基础',
  },
  {
    id: 'first-order-logic',
    title: '一阶谓词逻辑',
    clusterId: 'knowledge-reasoning',
    shortSummary: '一阶谓词逻辑用对象、谓词和量词表达更丰富的世界知识。',
    coreIdea: '在命题逻辑基础上引入变量、函数、关系和全称/存在量词。',
    principles: ['谓词描述对象属性和关系', '量词表达范围', '推理规则支持更复杂的知识演绎'],
    keyTerms: ['谓词', '变量', '全称量词', '存在量词'],
    comparisons: ['相较命题逻辑，一阶逻辑表达力更强，但推理复杂度也更高。'],
    formula: 'forall x: Human(x) -> Mortal(x)',
    applications: ['知识库推理', '语义解析', '规则系统'],
    visualType: 'logic',
    difficulty: '中等',
    prerequisites: ['命题逻辑'],
  },
  {
    id: 'production-system',
    title: '产生式系统',
    clusterId: 'knowledge-reasoning',
    shortSummary: '产生式系统以“条件-动作”规则驱动推理过程。',
    coreIdea: '当工作记忆满足规则条件时触发动作，逐步推出新事实或决策。',
    principles: ['规则库保存 IF-THEN 规则', '工作记忆保存当前事实', '推理机负责匹配和执行规则'],
    keyTerms: ['规则库', '工作记忆', '推理机', '冲突消解'],
    applications: ['专家系统', '诊断系统', '流程自动化'],
    visualType: 'logic',
    difficulty: '中等',
    prerequisites: ['命题逻辑'],
  },
  {
    id: 'semantic-network',
    title: '语义网络',
    clusterId: 'knowledge-reasoning',
    shortSummary: '语义网络用节点和边表示概念之间的语义关系。',
    coreIdea: '把概念组织成图结构，使继承、关联和类别关系更直观。',
    principles: ['节点表示概念或实体', '边表示 is-a、part-of 等关系', '可通过图遍历进行简单推理'],
    keyTerms: ['概念节点', '语义关系', '继承', '图结构'],
    comparisons: ['语义网络比纯规则更形象，但形式化严谨性通常弱于逻辑系统。'],
    applications: ['概念图谱', '教学知识结构', '语义检索'],
    visualType: 'knowledgeGraph',
    difficulty: '基础',
  },
  {
    id: 'knowledge-graph',
    title: '知识图谱',
    clusterId: 'knowledge-reasoning',
    shortSummary: '知识图谱用实体、关系和属性构建可查询、可推理的结构化知识网络。',
    coreIdea: '把现实世界知识表示为三元组，使机器能够沿关系进行检索和推理。',
    principles: ['实体与关系抽取', '三元组存储', '链接预测和图推理'],
    keyTerms: ['实体', '关系', '三元组', '图嵌入'],
    formula: '(head, relation, tail)',
    applications: ['搜索推荐', '智能问答', '科研知识管理'],
    visualType: 'knowledgeGraph',
    difficulty: '中等',
    prerequisites: ['语义网络'],
  },
  {
    id: 'ml-paradigms',
    title: '机器学习范式',
    clusterId: 'machine-learning',
    shortSummary: '机器学习根据反馈信号不同，可分为监督、无监督和强化学习等范式。',
    coreIdea: '学习任务的关键在于数据、目标函数、反馈信号和泛化能力。',
    principles: ['从样本中拟合规律', '用损失函数衡量错误', '在未见数据上保持泛化'],
    keyTerms: ['训练集', '模型', '损失函数', '泛化'],
    comparisons: ['监督学习有标签，无监督学习找结构，强化学习通过奖励学习行动。'],
    applications: ['分类预测', '聚类分析', '智能决策'],
    visualType: 'learning',
    difficulty: '基础',
  },
  {
    id: 'supervised-learning',
    title: '监督学习',
    clusterId: 'machine-learning',
    shortSummary: '监督学习用带标签样本学习输入到输出的映射。',
    coreIdea: '模型通过最小化预测输出和真实标签之间的误差来获得规律。',
    principles: ['样本包含输入和标签', '训练目标是降低损失', '测试集衡量泛化性能'],
    keyTerms: ['标签', '分类', '回归', '训练误差'],
    comparisons: ['分类预测离散类别，回归预测连续数值。'],
    applications: ['垃圾邮件分类', '房价预测', '疾病风险评估'],
    visualType: 'learning',
    difficulty: '基础',
    prerequisites: ['机器学习范式'],
  },
  {
    id: 'unsupervised-learning',
    title: '无监督学习',
    clusterId: 'machine-learning',
    shortSummary: '无监督学习在没有标签的情况下发现数据内部结构。',
    coreIdea: '通过相似性、密度或潜在变量挖掘隐藏模式。',
    principles: ['没有人工标签', '关注聚类、降维和表示学习', '结果常需结合业务解释'],
    keyTerms: ['聚类', '降维', '表示', '相似度'],
    comparisons: ['监督学习问“这是什么”，无监督学习问“它们如何组织”。'],
    applications: ['用户分群', '异常检测', '主题发现'],
    visualType: 'learning',
    difficulty: '基础',
    prerequisites: ['机器学习范式'],
  },
  {
    id: 'decision-tree',
    title: '决策树',
    clusterId: 'machine-learning',
    shortSummary: '决策树通过一系列特征判断把样本划分到不同类别或数值区间。',
    coreIdea: '每个内部节点选择一个特征划分数据，叶节点给出预测。',
    principles: ['选择能最大程度降低不确定性的划分', '递归构建树结构', '通过剪枝降低过拟合'],
    keyTerms: ['信息增益', '基尼指数', '叶节点', '剪枝'],
    comparisons: ['决策树可解释性强，单棵树容易过拟合；随机森林通过集成提高稳定性。'],
    applications: ['信用评估', '医疗分诊', '规则解释'],
    visualType: 'decisionTree',
    difficulty: '中等',
    prerequisites: ['监督学习'],
  },
  {
    id: 'bayesian-classifier',
    title: '贝叶斯分类',
    clusterId: 'machine-learning',
    shortSummary: '贝叶斯分类用先验概率和似然估计类别后验概率。',
    coreIdea: '在观测到特征后，选择后验概率最大的类别。',
    principles: ['先验表示已有类别倾向', '似然表示类别生成特征的可能性', '朴素贝叶斯假设特征条件独立'],
    keyTerms: ['先验', '似然', '后验', '条件独立'],
    formula: 'P(C|x) = P(x|C)P(C) / P(x)',
    comparisons: ['朴素贝叶斯假设强但训练快，在文本分类中常有不错表现。'],
    applications: ['垃圾邮件识别', '情感分类', '风险预测'],
    visualType: 'bayes',
    difficulty: '中等',
    prerequisites: ['概率基础'],
  },
  {
    id: 'svm',
    title: '支持向量机',
    clusterId: 'machine-learning',
    shortSummary: 'SVM 寻找最大间隔超平面，使不同类别样本尽量分开。',
    coreIdea: '分类边界由最靠近边界的支持向量决定，核方法可处理非线性划分。',
    principles: ['最大化分类间隔', '允许软间隔处理噪声', '核函数隐式映射到高维空间'],
    keyTerms: ['超平面', '间隔', '支持向量', '核函数'],
    formula: 'maximize margin = 2 / ||w||',
    applications: ['文本分类', '小样本分类', '生物信息识别'],
    visualType: 'learning',
    difficulty: '进阶',
    prerequisites: ['监督学习', '线性代数'],
  },
  {
    id: 'neuron-model',
    title: '神经元模型',
    clusterId: 'deep-learning',
    shortSummary: '人工神经元对输入加权求和并经过激活函数输出。',
    coreIdea: '神经元是神经网络的基本计算单元，权重决定输入特征的重要性。',
    principles: ['输入乘以权重并求和', '偏置调整激活阈值', '激活函数引入非线性'],
    keyTerms: ['权重', '偏置', '激活函数', '加权和'],
    formula: 'y = sigma(w*x + b)',
    applications: ['分类模型', '函数近似', '深度网络基础'],
    visualType: 'neuralNetwork',
    difficulty: '基础',
  },
  {
    id: 'multilayer-perceptron',
    title: '多层感知机',
    clusterId: 'deep-learning',
    shortSummary: 'MLP 由输入层、隐藏层和输出层构成，可学习非线性映射。',
    coreIdea: '多层非线性变换让模型能拟合更复杂的函数关系。',
    principles: ['层与层之间全连接', '隐藏层提取中间表示', '输出层完成分类或回归'],
    keyTerms: ['输入层', '隐藏层', '输出层', '全连接'],
    comparisons: ['单层感知机只能处理线性可分问题，多层结构可表示非线性边界。'],
    applications: ['表格数据建模', '基础分类器', '深度学习入门实验'],
    visualType: 'neuralNetwork',
    difficulty: '基础',
    prerequisites: ['神经元模型'],
  },
  {
    id: 'backpropagation',
    title: '反向传播',
    clusterId: 'deep-learning',
    shortSummary: '反向传播用链式法则高效计算网络参数的梯度。',
    coreIdea: '误差信号从输出层向前一层层传回，使每个参数知道自己应如何调整。',
    principles: ['前向传播得到预测和损失', '反向传播计算梯度', '优化器根据梯度更新参数'],
    keyTerms: ['链式法则', '梯度', '损失函数', '参数更新'],
    formula: 'dL/dw = dL/dy * dy/dw',
    applications: ['训练神经网络', '深度学习框架自动微分', '模型微调'],
    visualType: 'neuralNetwork',
    difficulty: '中等',
    prerequisites: ['多层感知机', '微积分'],
  },
  {
    id: 'gradient-descent',
    title: '梯度下降',
    clusterId: 'deep-learning',
    shortSummary: '梯度下降沿损失函数下降最快的反方向迭代更新参数。',
    coreIdea: '把训练看作寻找低损失位置的优化过程，每一步都根据局部斜率调整参数。',
    principles: ['计算当前参数梯度', '按学习率决定步长', '迭代更新直到收敛或达到停止条件'],
    keyTerms: ['损失曲面', '学习率', '梯度', '收敛'],
    formula: 'theta <- theta - eta * grad J(theta)',
    applications: ['线性回归训练', '神经网络训练', '模型微调'],
    visualType: 'gradient',
    animationType: 'gradient',
    visualSuggestion: '用曲线和小球展示损失下降过程。',
    animationSuggestion: '小球沿损失曲线逐步滚向低点。',
    difficulty: '中等',
    prerequisites: ['损失函数', '微积分'],
  },
  {
    id: 'cnn',
    title: '卷积神经网络',
    clusterId: 'deep-learning',
    shortSummary: 'CNN 用卷积核提取局部特征，特别适合图像和网格数据。',
    coreIdea: '通过局部连接和参数共享降低参数量，并逐层组合低级到高级特征。',
    principles: ['卷积提取局部模式', '池化降低空间尺寸', '深层特征用于分类或检测'],
    keyTerms: ['卷积核', '特征图', '池化', '参数共享'],
    comparisons: ['CNN 比全连接网络更适合处理图像的局部结构。'],
    applications: ['图像分类', '目标检测', '医学影像分析'],
    visualType: 'vision',
    difficulty: '中等',
    prerequisites: ['神经网络基础'],
  },
  {
    id: 'rnn',
    title: '循环神经网络',
    clusterId: 'deep-learning',
    shortSummary: 'RNN 通过隐藏状态在序列时间步之间传递信息。',
    coreIdea: '当前输出不仅依赖当前输入，也依赖过去积累的隐藏状态。',
    principles: ['共享循环单元处理序列', '隐藏状态保存历史信息', '可展开成时间维度上的网络'],
    keyTerms: ['隐藏状态', '时间步', '序列建模', '梯度消失'],
    comparisons: ['RNN 适合短序列依赖，Transformer 更擅长并行处理长距离依赖。'],
    applications: ['语言模型早期结构', '时间序列预测', '语音识别'],
    visualType: 'neuralNetwork',
    difficulty: '中等',
    prerequisites: ['神经网络基础'],
  },
  {
    id: 'attention-mechanism',
    title: '注意力机制',
    clusterId: 'deep-learning',
    shortSummary: '注意力机制让模型在处理一个位置时动态关注其他相关位置。',
    coreIdea: '通过 Query、Key、Value 的相似度计算权重，再加权汇聚信息。',
    principles: ['Query 与 Key 计算相关性', 'Softmax 得到注意力权重', '按权重汇聚 Value 信息'],
    keyTerms: ['Query', 'Key', 'Value', 'Softmax', '权重'],
    formula: 'Attention(Q,K,V)=softmax(QK^T/sqrt(d_k))V',
    applications: ['机器翻译', '文本理解', '多模态对齐'],
    visualType: 'attention',
    animationType: 'attention',
    visualSuggestion: '用 token 间流动线条表现权重分配。',
    animationSuggestion: '让不同粗细的光流在 token 之间循环。',
    difficulty: '中等',
    prerequisites: ['向量表示', '神经网络基础'],
  },
  {
    id: 'transformer',
    title: 'Transformer',
    clusterId: 'deep-learning',
    shortSummary: 'Transformer 以自注意力为核心，成为现代大模型的基础架构。',
    coreIdea: '通过多头注意力和前馈网络堆叠，在并行计算中建模长距离依赖。',
    principles: ['位置编码补充顺序信息', '多头注意力捕捉不同关系', '残差连接和层归一化稳定训练'],
    keyTerms: ['自注意力', '多头注意力', '位置编码', '前馈网络'],
    comparisons: ['相较 RNN，Transformer 并行度更高，也更适合大规模预训练。'],
    applications: ['大语言模型', '机器翻译', '视觉 Transformer'],
    visualType: 'transformer',
    animationType: 'attention',
    visualSuggestion: '绘制 embedding、attention、feed-forward 和输出的流程块。',
    animationSuggestion: '用流动线表示 token 经过注意力层的信息交换。',
    difficulty: '进阶',
    prerequisites: ['注意力机制', '神经网络基础'],
  },
  {
    id: 'word-embedding',
    title: '词向量',
    clusterId: 'nlp-vision',
    shortSummary: '词向量把词映射到连续向量空间，使语义相近的词距离更近。',
    coreIdea: '用分布式表示把离散符号转化为可计算的语义坐标。',
    principles: ['词的上下文反映语义', '向量距离表示相似度', '线性关系可表达部分语义规律'],
    keyTerms: ['Embedding', '语义空间', '相似度', '上下文'],
    comparisons: ['One-hot 表示稀疏且无语义距离，词向量提供稠密语义表示。'],
    applications: ['文本分类', '搜索排序', '语义匹配'],
    visualType: 'knowledgeGraph',
    difficulty: '基础',
  },
  {
    id: 'semantic-representation',
    title: '语义表示',
    clusterId: 'nlp-vision',
    shortSummary: '语义表示把文本、图像或多模态内容转成可比较、可检索的向量。',
    coreIdea: '把复杂对象压缩到表示空间中，使模型能计算相似性、关系和类别。',
    principles: ['编码器提取特征', '向量空间承载语义', '任务目标塑造表示质量'],
    keyTerms: ['编码器', '向量空间', '表征学习', '相似度'],
    applications: ['语义检索', '推荐系统', '多模态检索'],
    visualType: 'knowledgeGraph',
    difficulty: '中等',
    prerequisites: ['词向量'],
  },
  {
    id: 'pretrained-model',
    title: '预训练模型',
    clusterId: 'nlp-vision',
    shortSummary: '预训练模型先在大规模数据上学习通用表示，再迁移到下游任务。',
    coreIdea: '用大规模自监督学习积累通用能力，再用微调或提示适配具体任务。',
    principles: ['预训练阶段学习通用模式', '微调阶段适配任务', '参数复用降低数据需求'],
    keyTerms: ['自监督学习', '微调', '迁移学习', '下游任务'],
    comparisons: ['从零训练依赖大量任务数据，预训练-微调能复用已有知识。'],
    applications: ['文本理解', '代码生成', '图像识别迁移'],
    visualType: 'transformer',
    difficulty: '中等',
  },
  {
    id: 'image-classification',
    title: '图像分类',
    clusterId: 'nlp-vision',
    shortSummary: '图像分类为整张图像预测一个或多个类别标签。',
    coreIdea: '模型从像素中提取特征，并把特征映射到类别概率。',
    principles: ['卷积或视觉编码器提取特征', '分类头输出类别分布', '用交叉熵等损失训练'],
    keyTerms: ['类别标签', '特征图', '分类头', 'Top-1 准确率'],
    applications: ['质检识别', '医学影像初筛', '图片内容管理'],
    visualType: 'vision',
    difficulty: '基础',
    prerequisites: ['卷积神经网络'],
  },
  {
    id: 'object-detection',
    title: '目标检测',
    clusterId: 'nlp-vision',
    shortSummary: '目标检测同时回答图像中有什么，以及它们在哪里。',
    coreIdea: '模型需要输出类别标签和边界框位置，比分类多了定位任务。',
    principles: ['候选区域或密集预测', '分类分支判断类别', '回归分支预测边界框'],
    keyTerms: ['边界框', 'IoU', '候选框', '非极大值抑制'],
    comparisons: ['图像分类只给整图标签，目标检测给出每个目标的位置。'],
    applications: ['自动驾驶感知', '安防检测', '工业缺陷定位'],
    visualType: 'vision',
    difficulty: '中等',
    prerequisites: ['图像分类'],
  },
  {
    id: 'semantic-segmentation',
    title: '语义分割',
    clusterId: 'nlp-vision',
    shortSummary: '语义分割为图像中的每个像素预测类别。',
    coreIdea: '从图像级理解进一步细化到像素级理解，形成密集预测结果。',
    principles: ['编码器提取上下文特征', '解码器恢复空间分辨率', '每个像素输出类别概率'],
    keyTerms: ['像素级分类', '掩膜', '编码器-解码器', 'mIoU'],
    comparisons: ['目标检测给框，语义分割给像素级区域。'],
    applications: ['医学器官分割', '遥感地物分类', '自动驾驶道路理解'],
    visualType: 'vision',
    difficulty: '进阶',
    prerequisites: ['卷积神经网络', '图像分类'],
  },
  {
    id: 'intelligent-agent',
    title: '智能体',
    clusterId: 'rl-agents',
    shortSummary: '智能体是能感知环境、选择行动并追求目标的系统。',
    coreIdea: '用感知-决策-行动闭环描述智能系统的基本运行方式。',
    principles: ['接收环境观察', '依据策略选择动作', '通过结果调整未来行为'],
    keyTerms: ['观察', '动作', '策略', '目标'],
    applications: ['机器人', '游戏角色', '自动交易系统'],
    visualType: 'agentLoop',
    animationType: 'agentLoop',
    difficulty: '基础',
  },
  {
    id: 'mdp',
    title: '马尔可夫决策过程',
    clusterId: 'rl-agents',
    shortSummary: 'MDP 用状态、动作、转移概率和奖励形式化序贯决策问题。',
    coreIdea: '未来只依赖当前状态和动作，而不依赖更早历史，这就是马尔可夫性。',
    principles: ['状态描述决策所需信息', '动作影响状态转移', '奖励定义优化目标'],
    keyTerms: ['状态', '动作', '转移概率', '奖励', '折扣因子'],
    formula: 'MDP = (S, A, P, R, gamma)',
    applications: ['强化学习建模', '库存控制', '机器人路径规划'],
    visualType: 'agentLoop',
    difficulty: '中等',
    prerequisites: ['智能体', '概率基础'],
  },
  {
    id: 'reinforcement-learning',
    title: '强化学习',
    clusterId: 'rl-agents',
    shortSummary: '强化学习通过试错交互学习使长期奖励最大的策略。',
    coreIdea: '智能体不是直接模仿标签，而是在环境反馈中学习行动价值。',
    principles: ['探索未知动作', '利用已知高价值动作', '优化长期累计奖励'],
    keyTerms: ['奖励', '策略', '价值函数', '探索-利用'],
    comparisons: ['监督学习从标签中学习，强化学习从奖励信号中学习。'],
    applications: ['游戏 AI', '机器人控制', '资源调度'],
    visualType: 'agentLoop',
    animationType: 'agentLoop',
    difficulty: '中等',
    prerequisites: ['智能体', '马尔可夫决策过程'],
  },
  {
    id: 'q-learning',
    title: 'Q-learning',
    clusterId: 'rl-agents',
    shortSummary: 'Q-learning 学习状态-动作价值函数，从而选择高价值动作。',
    coreIdea: '用当前奖励和下一状态最大价值来更新 Q 值，不需要已知环境模型。',
    principles: ['估计 Q(s,a)', '用时序差分误差更新', '离策略学习目标最优价值'],
    keyTerms: ['Q 值', '时序差分', '离策略', 'epsilon-greedy'],
    formula: 'Q(s,a) <- Q(s,a) + alpha[r + gamma max Q(s*,a*) - Q(s,a)]',
    applications: ['网格世界', '简单游戏决策', '教学型强化学习实验'],
    visualType: 'agentLoop',
    animationType: 'agentLoop',
    difficulty: '进阶',
    prerequisites: ['强化学习', '马尔可夫决策过程'],
  },
  {
    id: 'policy-gradient',
    title: '策略梯度',
    clusterId: 'rl-agents',
    shortSummary: '策略梯度直接优化策略参数，使期望回报最大。',
    coreIdea: '不先学习价值表，而是根据采样轨迹估计提升好动作概率的方向。',
    principles: ['策略输出动作概率', '采样轨迹估计回报', '沿提高期望回报的梯度更新参数'],
    keyTerms: ['随机策略', '回报', 'REINFORCE', '优势函数'],
    formula: 'grad J(theta) = E[grad log pi(a|s) * R]',
    applications: ['连续控制', '机器人运动', '大模型偏好优化的思想基础'],
    visualType: 'agentLoop',
    difficulty: '进阶',
    prerequisites: ['强化学习', '梯度下降'],
  },
  {
    id: 'large-language-model',
    title: '大语言模型',
    clusterId: 'generative-safety',
    shortSummary: '大语言模型通过大规模预训练学习文本生成、理解和推理能力。',
    coreIdea: '在海量语料上预测下一个 token，使模型获得可迁移的语言与知识表示。',
    principles: ['Transformer 架构承载大规模参数', '自监督目标驱动预训练', '指令微调和对齐改善可用性'],
    keyTerms: ['Token', '预训练', '指令微调', '对齐'],
    comparisons: ['传统 NLP 模型面向单任务，大语言模型通过提示适配多种任务。'],
    applications: ['智能助教', '代码辅助', '知识问答'],
    visualType: 'transformer',
    difficulty: '中等',
    prerequisites: ['Transformer', '预训练模型'],
  },
  {
    id: 'generative-model',
    title: '生成模型',
    clusterId: 'generative-safety',
    shortSummary: '生成模型学习数据分布，并从中采样生成新的文本、图像或声音。',
    coreIdea: '模型不仅判断输入属于什么，还能学习“像什么”并创造新样本。',
    principles: ['估计或隐式学习数据分布', '从潜在变量或条件输入生成样本', '用质量、多样性和可控性评估结果'],
    keyTerms: ['数据分布', '采样', '潜在空间', '条件生成'],
    comparisons: ['判别模型学习类别边界，生成模型学习数据如何产生。'],
    applications: ['图像生成', '文本创作', '数据增强'],
    visualType: 'diffusion',
    difficulty: '中等',
  },
  {
    id: 'diffusion-model',
    title: '扩散模型',
    clusterId: 'generative-safety',
    shortSummary: '扩散模型通过学习从噪声逐步还原数据来生成高质量样本。',
    coreIdea: '正向过程逐步加噪，反向网络学习去噪，最终从随机噪声生成图像等内容。',
    principles: ['正向扩散加入噪声', '反向去噪恢复结构', '条件信息可控制生成方向'],
    keyTerms: ['加噪', '去噪', '采样步', '条件生成'],
    comparisons: ['GAN 通过对抗训练生成，扩散模型通过逐步去噪生成，训练更稳定但采样较慢。'],
    applications: ['文生图', '图像修复', '视频生成'],
    visualType: 'diffusion',
    difficulty: '进阶',
    prerequisites: ['生成模型', '神经网络基础'],
  },
  {
    id: 'ai-ethics',
    title: 'AI 伦理',
    clusterId: 'generative-safety',
    shortSummary: 'AI 伦理关注技术应用对人、公平、隐私和社会责任的影响。',
    coreIdea: '评价 AI 系统不能只看性能，还要看是否尊重人的权利、尊严和公共利益。',
    principles: ['保护隐私和数据权益', '减少歧视性影响', '明确责任边界和人工监督'],
    keyTerms: ['公平', '隐私', '责任', '透明'],
    applications: ['教育 AI 审核', '医疗 AI 治理', '公共服务算法评估'],
    visualType: 'ethics',
    ideologicalElement: '把技术创新与人民利益、社会公平和国家治理能力结合起来思考。',
    difficulty: '基础',
  },
  {
    id: 'model-bias',
    title: '模型偏见',
    clusterId: 'generative-safety',
    shortSummary: '模型偏见来自数据、目标函数或部署环境中的不平衡和不公正。',
    coreIdea: '模型会放大训练数据和评价指标中的偏差，导致对某些群体不公平。',
    principles: ['检查数据代表性', '评估不同群体的误差差异', '用约束、重采样或人工审核缓解偏见'],
    keyTerms: ['数据偏差', '公平性指标', '群体误差', '治理'],
    applications: ['招聘筛选审查', '信贷风控公平性', '内容推荐治理'],
    visualType: 'ethics',
    ideologicalElement: '培养负责任使用算法的意识，避免让技术成为不公平的放大器。',
    difficulty: '中等',
  },
  {
    id: 'explainable-ai',
    title: '可解释性',
    clusterId: 'generative-safety',
    shortSummary: '可解释性研究如何让模型决策原因更容易被人理解和审查。',
    coreIdea: '当 AI 影响重要决策时，人需要知道模型依据了哪些特征和证据。',
    principles: ['全局解释说明模型整体规律', '局部解释说明单个预测原因', '解释应服务于调试、信任和责任追踪'],
    keyTerms: ['特征重要性', '局部解释', '透明模型', '可审计性'],
    comparisons: ['高性能黑箱模型可能难解释，简单模型更透明但表达能力有限。'],
    applications: ['医疗辅助决策', '金融风控', '教学模型分析'],
    visualType: 'ethics',
    difficulty: '中等',
  },
  {
    id: 'trustworthy-ai',
    title: '可信 AI',
    clusterId: 'generative-safety',
    shortSummary: '可信 AI 强调安全、可靠、公平、可解释和可治理的系统能力。',
    coreIdea: 'AI 系统要在真实场景中可用，就必须能被验证、监控和持续改进。',
    principles: ['鲁棒性抵抗异常输入', '安全性降低滥用风险', '治理机制保障责任闭环'],
    keyTerms: ['安全', '鲁棒', '公平', '可审计'],
    applications: ['行业大模型落地', '智能制造质控', '政务智能服务'],
    visualType: 'ethics',
    ideologicalElement: '将科技自立自强与可信、安全、向善的人工智能发展方向统一起来。',
    difficulty: '进阶',
  },
];
