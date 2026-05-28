# R009 - 修复章节地图悬浮预览卡多个同时显示的 bug

状态：Implemented

创建日期：2026-05-28

确认日期：2026-05-28

## 背景

R008 把章节树由 `<Link>` 改为 `<button>` 并接入「点击树打开本章预览方框」后，章节地图页 `/ai` 出现 bug：**可能同时显示两张（或多张）悬浮预览小卡**。

R009 专门修这一 bug，范围最小化、只动相关交互/样式，不引入其他改动。

## 用户真实反馈与现象

> 原话保留：

- 现在这版本很好，但是章节导览页面会出现两个悬浮框的 bug。

**复现路径（截图佐证由人类用户提供）：**

1. 进 `/ai` 页面。
2. 点击任一棵章节树 → 弹出该章节预览方框。
3. 关闭方框（ESC / X / 点方框外）。
4. **此时焦点回到刚才被点的那棵树**，它的悬浮预览小卡持续显示。
5. 鼠标再去悬停另一棵树 → 那棵树的预览小卡也显示出来。
6. 结果：**两张预览小卡同时出现在地图上**（与用户截图一致：03「知识表示与推理」与 04「机器学习基础」的预览卡同时浮出）。

## 已确认的关键决策（成因分析）

- R007 时章节节点是 `<a>` 链接，点击立即跳路由，焦点不会在地图上停留，所以单一预览卡自然成立。
- R008 把节点改为 `<button>` + 弹方框关闭后焦点回到触发树，导致 **`:focus` 状态触发的预览卡持续显示**；再叠加另一棵树被鼠标悬停（`:hover`）的预览卡，就出现两张同时显示。
- 修复方向：**保证森林地图上任意时刻最多只有一张悬浮预览小卡**；同时保留键盘可达性（键盘 Tab 聚焦时仍可看到该树的预览卡）。

## 本轮目标

让章节地图页的悬浮预览小卡在任意时刻**最多只显示一张**，无论鼠标 / 键盘 / 弹方框流程如何切换，都不会出现两张及以上同时浮出的情况；同时不丢失键盘可达性。

## 具体需求

- **任意时刻最多一张预览卡可见**：森林地图上的章节树预览小卡互斥显示。
- **修复点击 → 关闭方框后焦点残留导致预览卡留存的问题**。可选实现方向（执行按最干净的方案选）：
  - 把触发预览卡的选择器从 `:hover, :focus`（或 `:focus-within`）改为 `:hover, :focus-visible`，让鼠标点击产生的焦点不再触发预览卡（鼠标用户只在悬停时看到预览，键盘 Tab 聚焦时仍能看到）。
  - 或用 JS 维护一个 `previewedChapterId` 状态，按 `pointerenter / pointerleave` + `focusvisible` 显式控制，确保单点显示；其他树的预览强制隐藏。
  - 或在 `ChapterPreviewDialog` 关闭并把焦点还回触发树时，立即 `blur()` 该树以消除残留焦点态（保留焦点的可达性意义在于用户能继续 Tab，但若预览卡只用 `:focus-visible` 触发，鼠标点击关闭后的程序化 `focus()` 不会显示预览卡，问题自然消失——优先此路）。
- **方框打开期间不显示预览卡**：方框打开时（`aria-expanded="true"` 或方框可见），地图上**任何**章节树的悬浮预览卡应隐藏，避免方框 + 预览卡叠加视觉干扰。
- **保留键盘可达性**：键盘 Tab 聚焦到一棵树（`:focus-visible`）时仍能看到该树的预览卡；切换 Tab 到下一棵时，前一棵的预览卡立即消失。
- **不破坏 R008 主要功能**：方框、虚线连接、点知识点跳路由、ESC/外部/X/切树关闭与切换、ARIA 与焦点陷阱均不回退。
- **不引入新依赖**，不动数据、路由与三级结构。

## 非目标

- 不重做 R008 方框与首页/地图比例。
- 不重做 R007 森林地图。
- 不调整阅读页（Level 2）。

## 验收标准

> 验收方式沿用既往：人类用户**主观评审** + 截图自检；并按下方复现路径验证 bug 不再发生。

- 按上述复现路径操作，章节地图页**任意时刻最多只有一张**悬浮预览小卡可见；不再出现两张及以上同时显示。
- 鼠标悬停一棵树 → 仅该树预览卡；移开 → 预览卡消失。
- 键盘 Tab 聚焦一棵树 → 仅该树预览卡；Tab 到下一棵 → 切换显示，不残留。
- 方框打开期间，地图上所有预览卡都隐藏；关闭后回到上述常态。
- R008 已有功能（方框、虚线、知识点点击跳路由、关闭与切换、ARIA、焦点陷阱、动效）全部无回退。
- 桌面与移动端表现一致、无新 bug 引入。
- `npm run build` 通过。

## 执行备注

- 本轮状态为 `Ready`，可由执行智能体实现。
- 改动预计集中在 `src/components/ChapterMapPage.tsx`（必要时一两行 JS 控制 + 关闭方框后 `blur()` 触发树，或维护 `previewedChapterId` 状态）与 `src/styles.css`（把预览卡触发选择器从 `:focus` 改为 `:focus-visible`）。范围最小化、不做无关重构。
- 按 `AGENT_PROTOCOL.md` 执行流程第 7 步，**完成后必须自检视觉**：用 Playwright 截图复现「点击一棵树 → 关闭方框 → 悬停另一棵树」流程，自己截图核对**只显示一张预览卡**；不合格就微调重截，到自己看着合格再报告完成。
- 本版基于 R008 工作树继续；验收通过后作为下一个小版本提交。

## 执行反馈

> 由执行智能体完成后填写。

执行日期：2026-05-28

### 实现概况

把章节地图悬浮预览卡的显示来源从「CSS 多选择器（`:hover` + `:focus-visible` + `:focus-within`）」改为「JS 维护的单一 `previewedChapterId` 状态」，并在方框关闭把焦点还回触发树之前设一个短暂 `suppressFocusPreview` 标志位，吞掉那次自动焦点带来的预览。结果：任意时刻最多一张预览卡可见，鼠标 / 键盘 / 弹方框流程互不打架，键盘可达性无损。

### 已完成需求

- **任意时刻最多一张预览卡**：把 `.tree-card` 的显示触发由 CSS 多源（`:hover` / `:focus-visible` / `:focus-within`）改为单一类 `.forest-tree.is-previewed`。该类由 `ChapterMapPage` 的 `previewedChapterId` 状态唯一驱动，结构上保证不会有两张同时显示。
- **修复点击 → 关闭方框后焦点残留导致预览卡留存**：自检确认原 bug 复现路径就是「ESC 关闭让浏览器进入键盘模式 → 焦点还回触发树后 `:focus-visible` 命中 → 旧卡残留」。新增 `suppressFocusPreviewRef`：`closeDialog` 时把它置 `true`、`requestAnimationFrame` 里把焦点还回触发树、随后 `setTimeout(..., 60)` 把标志放开。这次自动焦点的 `onFocus` 看到标志为真直接 return，旧卡不再出现；后续真实的键盘 Tab 聚焦仍能正常显示预览卡。
- **方框打开期间不显示任何预览卡**：`ChapterMapPage` 在 `openChapterId` 存在时给 `.forest-scene` 加 `dialog-open` 类，CSS `.forest-scene.dialog-open .tree-card { opacity:0!important; visibility:hidden; pointer-events:none; }` 强制隐藏，作为安全网。
- **保留键盘可达性**：键盘 Tab 聚焦树时 `onFocus` 命中且 `suppressFocusPreview` 为假 → 显示预览卡；Tab 到下一棵 → 前者 `onBlur` 清状态、后者 `onFocus` 设状态 → 切换显示，不残留。
- **不破坏 R008 主要功能**：方框、虚线连接、点知识点跳路由、ESC/外部/X/切树关闭与切换、ARIA、焦点陷阱、动效全部不动。
- **不新增依赖、不动数据 / 路由 / 三级结构**：仅在 `ChapterMapPage.tsx` 加状态与四个回调；CSS 替换一处选择器、保留方框打开期隐藏卡的兜底规则。

### 未完成或部分完成

- 无。

### 执行中发现的问题

- 初版只去掉 CSS 中的 `:focus-within` 不足以修 bug：因为 ESC 是键盘事件，会把浏览器置于「键盘交互」模式，紧接着的程序化 `triggerRef.current?.focus()` 仍会让 `:focus-visible` 命中。所以必须从 CSS-only 升级到 JS 状态驱动 + 关闭瞬间的焦点预览抑制，才能彻底覆盖各路径。
- 本机 PowerShell 默认 PATH 不含 Node，构建与脚本经 `C:\Program Files\nodejs\npm.cmd` / `node.exe` 运行（沿用前轮环境结论）。

### 认为需求不合理或需要澄清的点

- 抑制焦点预览的时间窗用 `setTimeout(..., 60)`：足以覆盖 `requestAnimationFrame` 与 `focus` 事件链，又不会影响后续真实交互。如对该时长敏感可调整。

### 修改文件清单

- `src/components/ChapterMapPage.tsx`：
  - 新增 `previewedChapterId` 状态与 `suppressFocusPreviewRef`；
  - 新增 `handlePreviewEnter / handlePreviewLeave / handleTreeFocus` 三个回调；
  - 修改 `handleTreeClick` 与 `closeDialog`：点击时清预览；关闭方框时清预览 + 设抑制标志 + 焦点还回后短延迟放开；
  - 每棵章节树 `<button>` 加 `is-previewed` 类与 `onPointerEnter / onPointerLeave / onFocus / onBlur` 处理；
  - `.forest-scene` 在 `openChapterId` 存在时加 `dialog-open` 类。
- `src/styles.css`：把 `.forest-tree:hover .tree-card, :focus-visible .tree-card, :focus-within .tree-card { opacity:1 }` 替换为 `.forest-tree.is-previewed .tree-card { opacity:1; transform:translate(-50%,0) }`；保留 `.forest-scene.dialog-open .tree-card { opacity:0!important; visibility:hidden; pointer-events:none }` 安全网。

### 验证结果

- `npm run build`（经 `npm.cmd`）通过：`tsc -b && vite build` 成功，1587 模块，无类型错误，产物输出 `dist/`。
- 自检（Playwright 5 个场景，全部通过、无浏览器/控制台报错）：
  - **repro-esc**（bug 复现路径，ESC 关闭）：点击第 3 章 → ESC → 鼠标移开 → 悬停第 4 章 → 可见预览卡数 = **1**（修复前为 2）。
  - **repro-outside**（鼠标点外部关闭）：点击第 3 章 → 点页面左上角空白 → 悬停第 4 章 → 可见预览卡数 = **1**。
  - **hover-only**（常态悬停）：悬停第 5 章 → 可见预览卡数 = **1**。
  - **hover-leave**（离开无残留）：悬停第 5 章 → 鼠标移到角落 → 可见预览卡数 = **0**。
  - **keyboard-focus**（键盘可达性）：Tab 聚焦到第 1 章按钮 → 可见预览卡数 = **1**。
- 截图 `.agents/artifacts/screenshots/r009-after-esc-then-hover.png` 视觉确认：仅第 4 章预览卡浮出，第 3 章无残留。

## 审核记录

> 由需求讨论窗口审核后填写。
