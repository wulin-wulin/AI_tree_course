# Next Upgrade Prompt

你是本项目的执行智能体。请按照本文件指向的需求轮次进行实现。

## 首次执行前必须阅读

1. `docs/requirements/README.md`
2. `docs/requirements/AGENT_PROTOCOL.md`
3. `docs/requirements/current_state.md`
4. `docs/requirements/rounds/R009_fix_multi_preview_card_bug.md`

## 当前执行轮次

`R009`（状态：`Ready`，**可实现**）

> R001–R008 已 `Accepted`。R008 留下一个 bug：章节地图页 `/ai` 可能同时显示两张悬浮预览小卡（点击树 → 关方框后焦点回到树并保持其 `:focus` 触发的预览卡 + 再悬停另一棵树）。R009 专修这个 bug：让任意时刻最多只显示一张预览卡（推荐把触发选择器从 `:focus` 改为 `:focus-visible` + 方框打开期间隐藏全部预览卡），保留键盘可达性，不破坏 R008 其他功能。验收以需求讨论窗口主观评审 + 复现路径验证为准。

## 实现完成后请自检视觉（UI 改动适用）

涉及界面/视觉的改动，完成后请用项目 Playwright 截图工作流截取相关页面（本轮为 `/#/ai`），**自己查看截图核对效果**，按需微调迭代后再报告完成。详见 `docs/requirements/AGENT_PROTOCOL.md` 执行流程。

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
