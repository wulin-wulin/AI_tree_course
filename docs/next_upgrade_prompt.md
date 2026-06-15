# Next Upgrade Prompt

你是本项目的执行智能体。请按照本文件指向的需求轮次进行实现。

## 首次执行前必须阅读

1. `docs/requirements/README.md`
2. `docs/requirements/AGENT_PROTOCOL.md`
3. `docs/requirements/current_state.md`
4. `docs/requirements/rounds/R015_forest3d_brighten_and_depth.md`（当前轮次）

## 当前执行轮次

**R015 — 3D 森林地图：调亮通透 + 增强立体感**（状态 `Ready`）。

> 在 `3DMap` 分支已把 Level 1（`/ai`）切换为真实 3D 森林地图（Three.js + r3f + drei）的基础上，R015 修复「最里层 3D 视图太暗 + 跨机器颜色不一致」（根因为 r3f 默认 `ACESFilmicToneMapping` 压暗 + 光照保守），并增强立体感（放开相机有限度旋转）。目标观感为「明亮通透绘本风」。详见 R015 轮次文档。
>
> 历史背景：R013/R014（阅读页教材级加厚）已 `Implemented` 但审核记录尚空；3D 地图工作此前无轮次文档。这些历史欠账将在 R015 验收时连同回写 `current_state.md`，本轮执行智能体只需实现 R015 自身需求。

## 实现完成后请自检视觉（UI 改动适用）

涉及界面/视觉的改动，完成后请用项目 Playwright 截图工作流截取相关页面（本轮为 `/#/ai`，需覆盖桌面 + 移动并滚动走查整条长路），**自己查看截图核对效果**，按需微调迭代后再报告完成。详见 `docs/requirements/AGENT_PROTOCOL.md` 执行流程。

## 执行规则

- 只执行当前轮次文档中状态为 `Ready` 的需求。
- 如果当前轮次仍是 `Draft`，请停止实现，并说明需求尚未进入可执行状态。
- 不要直接改写 `docs/requirements/current_state.md`。
- 实现时优先遵循项目已有代码结构和设计风格。
- 不要扩大需求范围；遇到不明确或不合理的点，请记录到当前轮次的“执行反馈”区域。
- 执行完成后，请在当前轮次文档的“执行反馈”区域填写结果。

## 执行完成后必须反馈

请在当前轮次文档中补充：

- 实现概况
- 已完成需求
- 未完成或部分完成
- 执行中发现的问题
- 认为需求不合理或需要澄清的点
- 修改文件清单
- 验证结果

## 验证要求

优先运行：

```bash
npm run build
```

如果无法运行，请在执行反馈中说明原因。
