# Project Agent Memory

本文件是项目级长期记忆入口，供后续参与本仓库的智能体优先阅读。它只保留必须立即知道的项目信息和工作边界；更详细的开发规范放在 `.agent/` 中。

若本文件与 `docs/requirements/` 中的最新轮次文档冲突，以最新轮次文档和用户明确指令为准。

## 项目定位

- 项目名称：人工智能原理知识森林。
- 项目目标：面向学习者展示《人工智能原理》课程知识结构，帮助学习者理解知识簇、知识点关系、核心概念、公式、图示、动画和应用场景。
- 当前性质：课程知识可视化 demo，仍处于早期产品探索阶段。
- 产品视角：前端页面应优先服务学习者，不应把开发者内部生成流程、skill 化迁移、工程抽象作为学习者可见卖点。

## 技术栈

- Vite + React + TypeScript 单页应用。
- 纯前端静态项目，不接入后端、数据库或外部图片资源。
- 课程结构和展示数据主要维护在 `src/data/courseKnowledge.ts`。
- 样式主要维护在 `src/styles.css`。

## 运行与验证

常用命令：

```bash
npm install
npm run dev
npm run build
npm run preview
```

- `npm run dev` 使用 Vite 启动开发服务。
- `npm run build` 执行 TypeScript 构建和 Vite 生产构建，是当前优先验证命令。
- 构建产物输出到 `dist/`。

## 需求文档流程

需求和执行流程集中在 `docs/requirements/`。执行需求前必须先读：

1. `docs/next_upgrade_prompt.md`
2. `docs/requirements/README.md`
3. `docs/requirements/AGENT_PROTOCOL.md`
4. `docs/requirements/current_state.md`
5. 当前轮次文档

状态规则：

- `Draft`：需求仍在讨论中，不能实现。
- `Ready`：需求已确认，可以实现。
- `Implemented`：执行智能体已完成实现并填写反馈。
- `Reviewed`：需求讨论窗口已审核。
- `Accepted`：审核通过，并已回写当前状态。

如果当前轮次状态不是 `Ready`，执行智能体必须停止实现，并说明原因。

## 实现边界

- 只实现当前 `Ready` 轮次明确要求的内容。
- 不主动实现 `docs/requirements/backlog.md` 中的想法，除非当前轮次明确引用。
- 不直接改写 `docs/requirements/current_state.md`，除非用户明确要求。
- 完成实现后，把执行反馈写入当前轮次文档的“执行反馈”区域。

## 辅助记忆

- `.agent/README.md`：说明 `.agent/` 目录用途。
- `.agent/development.md`：详细开发规范、模块说明、验证和产品注意事项。
- `.agent/git.md`：Git 分支、提交信息和提交前检查规范。

## 当前产品注意事项

- 前端页面应从学习者视角出发。
- 当前阶段不应在学习者前端展示 skill、可复用生成流程、课程迁移生成流程等开发者内部概念。
- 已知问题包括：知识地图拥挤、详情面板生硬、交互较少、整体仍偏 demo。
