# Development Guidelines

本文件保存项目的详细开发规范。根目录 `AGENT.md` 是长期记忆入口；本文件是给执行智能体展开阅读的辅助规范。

## 项目结构

主要源码：

```text
src/
  animations/
    AgentLoop.tsx
    AttentionFlow.tsx
    GradientDescent.tsx
    SearchExpansion.tsx
  components/
    AnimationBlock.tsx
    DiagramBlock.tsx
    FormulaBlock.tsx
    Header.tsx
    KnowledgeAtlas.tsx
    KnowledgeCluster.tsx
    KnowledgeDetailPanel.tsx
    KnowledgeForest.tsx
    KnowledgeNode.tsx
    SkillStrip.tsx
  data/
    courseKnowledge.ts
  App.tsx
  main.tsx
  styles.css
```

模块职责：

- `src/main.tsx`：React 应用挂载入口。
- `src/App.tsx`：页面状态和主布局入口。
- `src/components/Header.tsx`：顶部课程工作台信息。
- `src/components/KnowledgeForest.tsx` / `KnowledgeAtlas.tsx`：知识地图、知识簇导航和知识点选择。
- `src/components/KnowledgeDetailPanel.tsx`：知识详情展示。
- `src/components/DiagramBlock.tsx`：知识点自绘 SVG 图示。
- `src/components/AnimationBlock.tsx` 与 `src/animations/`：轻量动画展示。
- `src/data/courseKnowledge.ts`：知识簇和知识点结构化数据。
- `src/styles.css`：全局样式和组件样式。

## 本地开发

常用命令：

```bash
npm install
npm run dev
npm run build
npm run preview
```

- `npm run dev`：启动 Vite 开发服务。
- `npm run build`：执行 `tsc -b && vite build`，是当前优先验证命令。
- `npm run preview`：预览生产构建。
- 构建产物输出到 `dist/`。

## 需求执行流程

执行开发需求前，先读：

1. `docs/next_upgrade_prompt.md`
2. `docs/requirements/README.md`
3. `docs/requirements/AGENT_PROTOCOL.md`
4. `docs/requirements/current_state.md`
5. 当前轮次文档

执行规则：

- 当前轮次必须是 `Ready` 才能实现。
- `Draft` 状态只能阅读和说明，不能开发。
- 只实现当前轮次明确要求的内容。
- 不主动实现 `docs/requirements/backlog.md` 中未被引用的想法。
- 不直接修改 `docs/requirements/current_state.md`，除非用户明确要求。
- 不把执行反馈写入 `docs/next_upgrade_prompt.md`。
- 完成后将执行反馈写入当前轮次文档的“执行反馈”区域。

执行反馈至少包含：

- 实现概况
- 已完成需求
- 未完成或部分完成
- 执行中发现的问题
- 认为需求不合理或需要澄清的点
- 修改文件清单
- 验证结果

## 开发风格

- 优先延续现有 React 组件结构、数据结构和 CSS 组织方式。
- 保持改动范围聚焦，避免无关重构。
- 数据结构优先维护在 `src/data/courseKnowledge.ts`，不要把课程内容散落到组件里。
- 组件职责保持清晰：状态编排放入口层，展示逻辑放组件层。
- 涉及样式调整时，优先复用现有 class 命名和视觉系统。
- 修改用户可见文案时，必须站在学习者视角，不暴露内部开发流程概念。
- Git 提交信息遵循 `.agents/git.md` 中的 Conventional Commits 规范。

## 产品注意事项

当前项目仍是早期 demo，已知问题：

- 左侧知识地图有新意，但视觉较拥挤，成熟度不足。
- 右侧详情面板可用，但内容呈现仍偏生硬。
- 页面主要交互集中在选择知识点和切换详情，整体容易像静态 PPT。
- 页面底部和用户可见区域不应展示 skill 化、生成流程迁移、开发者抽象等内部概念。
- 后续优化应优先提升学习路径、理解反馈、信息层次和可读性，而不是只增加装饰性动效。

## 验证建议

- 普通代码改动后优先运行 `npm run build`。
- UI 或交互改动后，建议启动 `npm run dev` 并在浏览器中检查主要路径：
  - 页面首次加载。
  - 点击知识簇。
  - 点击知识点。
  - 右侧详情内容同步更新。
  - 动画和图示正常展示。
- 如果无法运行验证命令，应在最终回复和执行反馈中说明原因。
