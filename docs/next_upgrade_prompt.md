# Next Upgrade Prompt

你是本项目的执行智能体。请按照本文件指向的需求轮次进行实现。

## 首次执行前必须阅读

1. `docs/requirements/README.md`
2. `docs/requirements/AGENT_PROTOCOL.md`
3. `docs/requirements/current_state.md`
4. `docs/requirements/rounds/R014_forest_label_legend_chrome_polish.md`

## 当前执行轮次

`R014`（状态：`Ready`，**可实现**）

> R001–R013 已结束并归档为 `Accepted`。**R014：只聚焦 `/ai` 森林页 UI polish**——优化知识点名称标签显示方案；把左下知识簇导览窗口做成可拖动、可隐藏/恢复；将顶部栏与知识簇导览窗口改为与首页更协调的白色/浅色 UI。不要改数据、布局算法、相机交互、阅读页、首页或 R013 的天空/地面/树形场景本体。详见轮次文档。

## 实现完成后请自检视觉（UI 改动适用）

涉及界面/视觉的改动，完成后请用项目 Playwright 截图工作流截取相关页面（本轮为 `/#/ai` 的默认全景、知识点标签近景/悬停、导览窗拖动与隐藏/恢复状态），**自己查看截图核对效果**，按需微调迭代后再报告完成。详见 `docs/requirements/AGENT_PROTOCOL.md` 执行流程。

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
