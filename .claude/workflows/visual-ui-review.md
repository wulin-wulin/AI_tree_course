# Visual UI Review Workflow

本工作流用于在 UI 开发后自动截图，并让执行智能体基于截图继续调整界面。

## 适用场景

- 调整页面布局、颜色、层次、字体、动效或响应式体验。
- 需要检查桌面和移动端首屏是否拥挤、溢出、遮挡或视觉不协调。
- 需要给后续人工审查提供截图证据。

## 命令

```bash
npm run visual:review
```

脚本会：

1. 检查 `http://127.0.0.1:5173/` 是否可访问。
2. 如果不可访问，自动启动 `npm run dev -- --port 5173`。
3. 使用 Playwright Chromium 截取桌面图和移动图。
4. 输出截图到 `.claude/artifacts/screenshots/`。
5. 如果浏览器 console 有错误，以非零状态退出。

## 输出文件

```text
.claude/artifacts/screenshots/
  desktop.png
  mobile.png
```

## 调整闭环

执行智能体在 UI 改动后应：

1. 运行 `npm run build`。
2. 运行 `npm run visual:review`。
3. 查看 `desktop.png` 和 `mobile.png`。
4. 根据截图检查：
   - 首屏是否过于拥挤。
   - 内容是否溢出或被裁切。
   - 知识地图节点是否重叠。
   - 详情面板是否有清晰的信息层次。
   - 移动端是否有横向滚动的合理兜底。
   - 焦点态、hover 态、动画是否符合 Web Interface Guidelines。
5. 继续调整 UI，直到截图表现稳定。

## 环境变量

- `UI_REVIEW_PORT`：覆盖默认端口 `5173`。
- `UI_REVIEW_URL`：直接指定要截图的 URL。

示例：

```bash
UI_REVIEW_URL=http://localhost:5174/ npm run visual:review
```
