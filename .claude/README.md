# .claude

本目录用于保存项目级长期记忆的辅助材料、协作约定、安装到项目内的 skills，以及后续智能体运行所需的项目内资料。

当前长期记忆入口是仓库根目录的 `CLAUDE.md`。智能体进入项目时应先读 `CLAUDE.md`，再按需要阅读本目录中的细分文档。

## 文件

- `development.md`：详细开发规范、模块说明、验证建议和产品注意事项。
- `git.md`：Git 分支、提交信息和提交前检查规范。
- `workflows/visual-ui-review.md`：UI 截图审查闭环。
- `scripts/screenshot-ui.mjs`：Playwright 截图脚本。
- `skills/`：通过 `npx skills add` 安装到项目内的 skills。
- `settings.json`：Claude Code 项目级配置（启用插件等）。

## 约定

- `.claude/` 可以保存项目内的提示词模板、执行检查清单、工作流说明和 skill 设计草稿。
- 正式需求轮次、验收标准和执行反馈仍放在 `docs/requirements/`。
- 如果未来设计正式可复用 skill，应把 `.claude/` 中除 `skills/` 以外的内容视为草稿或项目内参考；`skills/` 中的内容是安装到本项目的 agent skills。
