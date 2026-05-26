# Git Guidelines

本文件保存项目 Git 使用规范。除非用户明确要求，执行智能体不要主动创建提交。

## 提交信息格式

采用常见的 Conventional Commits 风格：

```text
<type>(<scope>): <subject>
```

示例：

```text
docs(agent): add project memory guidelines
feat(atlas): improve knowledge cluster navigation
fix(detail): keep selected knowledge point in sync
refactor(data): normalize course knowledge fields
```

## 常用 type

- `feat`：新增用户可见功能。
- `fix`：修复 bug。
- `docs`：文档变更。
- `style`：不影响逻辑的格式、样式或排版调整。
- `refactor`：不改变行为的代码重构。
- `perf`：性能优化。
- `test`：测试相关变更。
- `build`：构建系统或依赖相关变更。
- `ci`：CI 配置相关变更。
- `chore`：杂项维护。
- `revert`：回滚提交。

## scope 建议

scope 使用小写短词，优先表达变更影响范围：

- `agent`：智能体长期记忆或 `.agent/` 规范。
- `docs`：项目文档。
- `requirements`：需求流程文档。
- `atlas`：知识地图和知识簇导航。
- `detail`：知识详情面板。
- `data`：课程知识数据。
- `animation`：动画组件。
- `style`：全局样式。
- `build`：构建配置和依赖。

## subject 规范

- 使用英文祈使句或简短动词短语。
- 首字母小写。
- 不以句号结尾。
- 尽量控制在 72 个字符以内。
- 一次提交只描述一个清晰目的。

推荐：

```text
docs(agent): add git commit guidelines
fix(atlas): prevent cluster nodes from overlapping
```

不推荐：

```text
update files
fix bug.
WIP
```

## 提交前检查

提交前至少确认：

- `git status --short` 中只包含本次任务相关文件。
- 没有误提交 `node_modules/`、`dist/`、日志文件或本地临时文件。
- 普通代码改动后优先运行 `npm run build`。
- 文档-only 改动可以不运行构建，但最终说明中要注明未运行构建的原因。
- 如果存在用户或其他工具造成的未关联修改，不要擅自回滚；只提交本次任务范围内的文件。

## 分支命名建议

如需创建分支，默认使用 `codex/` 前缀：

```text
codex/<short-task-name>
```

示例：

```text
codex/agent-memory-docs
codex/remove-skill-copy
codex/atlas-layout-polish
```
