# Next Upgrade Prompt

你是本项目的执行智能体。请按照本文件指向的需求轮次进行实现。

## 首次执行前必须阅读

1. `docs/requirements/README.md`
2. `docs/requirements/AGENT_PROTOCOL.md`
3. `docs/requirements/current_state.md`
4. `docs/requirements/rounds/R014_forest_label_legend_chrome_polish.md`
5. `docs/requirements/rounds/R015_forest_label_occlusion_and_camera_height.md`
6. `docs/requirements/rounds/R016_reading_content_and_domain_learning_path.md`
7. `docs/requirements/rounds/R017_forest_view_restore_and_showcase_points.md`

## 当前执行轮次

`R017`（状态：`Ready`，**可实现**）

> R001–R013 已结束并归档为 `Accepted`；R014 已 `Reviewed` 但未单独验收，其问题由 R015 修正并并入当前基线；R015 已 `Accepted`；R016 已 `Implemented`、待需求窗口审核。**R017：森林视图返回恢复 + 录屏展示级知识点打磨**——①从森林页进入知识点阅读页后，点击阅读页“切换章节”返回森林时恢复进入前的相机视图位置，而不是回默认视角；②精选 4-6 个适合客户录屏展示的知识点，做样板级内容与展示重构，图文并茂，公式美观，尽量有动画。不要接后端/数据库/外部 LLM，不要回退 R014/R015/R016 已实现能力。详见轮次文档。

## 实现完成后请自检视觉（UI 改动适用）

涉及界面/视觉的改动，完成后请用项目 Playwright 截图工作流截取相关页面（本轮至少包含：森林进入前视图、阅读页返回后恢复视图、每个精选知识点阅读页、至少一个动画/公式特写），**自己查看截图核对效果**，按需微调迭代后再报告完成。详见 `docs/requirements/AGENT_PROTOCOL.md` 执行流程。

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
