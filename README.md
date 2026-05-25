# 人工智能原理知识森林

这是一个《人工智能原理》课程知识可视化 demo。项目根据 `docx/` 目录中的需求说明、Codex 初始提示词和录音转写整理实现，采用静态前端方案，不接入后端、数据库或外部图片资源。

## 当前实现

- Vite + React + TypeScript 单页应用。
- 内置 8 个知识簇、49 个结构化知识点。
- 学习工作台界面：顶部呈现课程地图、知识屏、skill 迁移等状态信息。
- Knowledge Atlas 主视图：主题簇以地图枢纽呈现，当前主题展开为知识节点轨道，并保留学习路径跳转。
- 点击知识点后，在详情面板展示概括、核心思想、原理、术语、公式、应用、图示和课程思政元素。
- 自绘 SVG 图示覆盖搜索、神经网络、Transformer、强化学习、知识图谱、视觉任务、伦理治理等类型。
- 包含注意力流动、梯度下降、A* 搜索扩展、智能体闭环 4 类轻量动画。
- 页面底部和 `docs/skills_design.md` 说明后续 skill 化迁移方向。

## 运行方式

```bash
npm install
npm run dev
```

默认开发服务由 Vite 启动，终端会显示本地访问地址。

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`。

## 项目结构

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

## 后续扩展

- 把 `courseKnowledge.ts` 的生成过程抽象成 Course Planning Skill 和 Knowledge Content Skill。
- 为更多知识点补充专属图示和动画。
- 接入课程大纲或教材后，可增加内容校正与引用来源检查。
- 增加学习路径、知识点搜索和演示模式。
