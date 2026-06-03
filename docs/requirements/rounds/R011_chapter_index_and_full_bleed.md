# R011 - 章节序列侧栏索引 + 长卷地图全展开

状态：Accepted

创建日期：2026-06-03

确认日期：2026-06-03

## 背景

R010 把章节地图重构为「沿途生长的徒步长卷」并被采纳为基线。继续打磨时人类用户提出两点：

1. **缺少快速定位与跳转章节的辅助**：长卷向下滚动时，看不到「我现在在哪一章」的整体索引，也不能直接跳到某一章的开头。
2. **绿色长卷与外层白色容器的割裂感**：当前长卷外面包着一层带白色 / 浅色卡片底的容器，绿色地图被「框」在里头，视觉上像贴在一张白纸上而不是占据页面，整体不够沉浸。

R011 在 R010 基线上**只做这两件视觉/导航增强**，不改长卷本身、不改三级结构与路由、不改课程数据。

## 用户真实反馈

> 原话保留：

1. 「在章节知识点导览界面我们可以在右边加一个小的提示框，上面是这本书的章节序列，然后这个章节序列和当前的地图会有对应关系，章节序列会默认高亮选中显示当前导览地图主要呈现的章节区域对应那一章，滑动后会跟着变，并且还可以直接点击这个章节序列表，那么主界面会滑动到对应章节区域。」
2. 「章节导览界面中间绿色的这很好，但是和外面的白色底框有割裂感，我们是否可以直接将这个全部展开，这样会好看一下。」

## 已确认的关键决策

- **只动 Level 1（`/ai` 章节长卷地图）**；不改首页书架（Level 0）、知识点阅读页（Level 2）、路由与数据。
- **保留 R010 长卷主体**：49 个小节 + 8 章分段染色 + 不同树种地标 + 向心 Catmull-Rom 圆滑曲线 + 单预览卡 + 按小节进度 + 纤细顶栏，全部不动。
- **新增**：右侧章节序列侧栏索引（scroll-spy + 点击跳转）。
- **拆除**：长卷外层白色卡片框的割裂感（绿色铺满主内容区，不再被「框」住）。

## 本轮目标

让长卷地图页 `/ai` 同时获得两点改进：① 长卷主体**视觉上铺满**、不再被白色卡片框框住，与页面浑然一体；② 多一个**贴边的章节序列索引**，让用户在滚动长卷时随时知道当前在哪一章、也能直接跳到任意章。

## 具体需求

### 一、右侧章节序列索引（scroll-spy + 点击跳转）

- **位置与形态**：在长卷地图页右侧增加一个**小、贴边、悬浮**的章节序列索引面板。默认位置为视口右侧（fixed / sticky），避免遮挡正文小径与小节标题；面板小巧、含适度半透明背景与轻阴影，融入而不抢戏。
- **内容**：按全课程顺序列出 8 个章节，每项包含
  - 章节序号 01–08；
  - 章节短标题（可截断显示）；
  - 一个用该章 `accent` 配色的小色点 / 短色条，作为与地图分段染色的视觉对应；
  - 可选：该章「已长成 / 当前 / 未抵达」状态指示（沿用 R010 进度口径，`readLastPoint` 推断）。
- **scroll-spy（默认高亮跟随）**：滚动长卷时，**当前在主视区中"主要呈现"的那一章**自动高亮为活动项；离开视区即取消高亮、下一章接力。判定口径建议：用 `IntersectionObserver` 给每章的**章节区段锚点**（地标树位置或该章节点簇外接区段）打观察；以「与视口中线（或上 1/3 线）最接近的那一章」为活动项；滚动期间用 `requestAnimationFrame` 节流。
- **点击跳转**：点击侧栏中任意章节项 → 主区**平滑滚动**到该章对应的区域顶部（用 `scrollIntoView({block: 'start', behavior: 'smooth'})` 或等价做法）；尊重 `prefers-reduced-motion`：在该偏好下退化为瞬时滚动。
- **键盘可达性**：每项为可聚焦控件（`<button>` 或 `<a>`），`Tab` 顺序合理；活动项带 `aria-current="location"`；面板有适当 `aria-label`（如 "章节索引"）；色点纯装饰、`aria-hidden`。
- **不喧宾夺主**：侧栏宽度小（如 ~140–180px 桌面），位置不挡小径与小节标题；可考虑在窗口很窄时退化（见响应式）。
- **响应式**：
  - 桌面（≥ ~1024px）：右侧固定贴边显示。
  - 中屏（~640–1024px）：可缩为更窄的纯色点条 / 章节号条，保留 scroll-spy + 点击跳转；或保持完整但收窄宽度。
  - 移动（< ~640px）：在视觉上让位给长卷主体——建议**隐藏右侧侧栏**，可选改为顶部纤细横向章节点列（在 sticky 顶栏下方一行，含相同 scroll-spy + 点击跳转能力）；或干脆隐藏，由 R010 已有的「N/49 进度」承担。执行可二选一，主观评审决定。

### 二、长卷地图「全展开」——拆除外层白色卡片框

- **拆掉**长卷外层的白色 / 浅色卡片框（圆角、阴影、padding 形成的「框感」），使**绿色长卷主体直接铺满主内容区**，与页面背景不再割裂。
- 「全部展开」的取舍：
  - 桌面：长卷至少**铺满主内容区宽度**（移除卡片框的左右 padding / margin / 圆角），上下方仍可有合理留白让 R010 已有的 sticky 顶栏与 scroll；如执行评估纯主区铺满仍有「贴在白纸上」的割裂，可在保证可读与不抢顶栏的前提下进一步**铺到视口左右边缘**。两者哪种更协调由执行实现 + 自检视觉决定。
  - 全展开后页面背景不能裸露成「白底+绿块」的拼接观感；可选做法：让页面整体背景与长卷的草地底色形成自然过渡（同色系扩展、或顶栏向下做一段渐变收边）。
- **保留 R010 现有结构与功能**：纤细 sticky 顶栏（返回书架 + 「已点亮 N/49」+ 进度条）、装饰背景树、章节分段染色、49 个小节、8 章地标、悬停单预览卡、键盘可达性、`prefers-reduced-motion` 降级——全部保留，不回退。
- **与右侧侧栏共存**：拆除白框后，新增的右侧章节索引可与长卷绿色背景并存（贴右侧视口或悬浮），但**不得遮挡小径与小节标题**；如有冲突，按「让小径 / 标题为先」处理（缩小侧栏 / 移位 / 半透明）。

### 三、与已有功能的关系

- **R010 顶栏进度**（「已点亮 N/49」）保留；右侧索引是「按章节定位」的导航辅助，与「按小节计数」的顶栏进度互补，不冲突。
- **R010 悬停单预览卡**保留；侧栏激活态切换不应触发预览卡。
- **不动**点小节直达阅读页、点地标进该章首点的交互。

## 非目标

- 不改首页书架（Level 0）与知识点阅读页（Level 2）。
- 不动课程数据结构、路由、三级结构。
- 不重做 R010 长卷主体（小径走向、节点排布、向心 Catmull-Rom 曲线、树种 / 配色 / 预览卡等不动）。
- 不引入后端、外部图片资源或新的重型依赖。
- 不在本轮新增自测 / 概念关联探索等学习交互。

## 验收标准

> 验收方式沿用：人类用户**主观评审** + 截图自检（按 `AGENT_PROTOCOL.md` 第 7 步）。

- 右侧出现章节序列索引面板，列出全部 8 章（带序号 + 配色色点 + 短标题）；视觉小巧、贴边、不抢戏、不遮挡小径与小节标题。
- 滚动长卷时活动项自动跟随当前视区主要呈现的那一章高亮，离开后自动让位给下一章；活动项有视觉高亮 + `aria-current="location"`。
- 点击侧栏中任一章节项 → 主区平滑滚动到该章区域顶部；`prefers-reduced-motion` 下退化为瞬时跳转。
- 键盘可 Tab 进入侧栏，逐项聚焦并触发跳转；面板有合适 `aria-label`、装饰色点 `aria-hidden`。
- 长卷主体的**白色卡片框已拆除**，绿色长卷铺满主内容（或视口宽度），与页面其余部分**不再有"贴在白纸上"的割裂感**。
- R010 已有功能（顶栏 + 进度、49 小节、8 地标、章节分段染色、向心 Catmull-Rom 曲线、单预览卡、键盘可达性、`prefers-reduced-motion`）全部保留无回退。
- 桌面（≥ 1024）、中屏（640–1024）、移动（< 640）三档均匀称可读：移动端按本文方案二选一处理侧栏，保持长卷主体不挤不裁。
- `npm run build`（`tsc -b && vite build`）通过。

## 执行备注

- 本轮状态为 `Ready`，可由执行智能体实现。
- 改动预计集中在：
  - `src/components/ChapterMapPage.tsx`：在长卷外层结构里新增右侧侧栏组件挂载点 + scroll-spy 状态（`activeChapterId`）+ 各章「区段锚点」DOM（地标树元素加 `data-chapter-id` 即可复用）+ 跳转回调。
  - 新增轻量子组件 `src/components/ChapterTrailIndex.tsx`（或就近合并在 `ChapterMapPage` 内）承载侧栏 UI 与可达性属性。
  - `src/styles.css`：新增 R011 样式层——侧栏外观与响应式断点；拆除 `.chapter-page` / 长卷外层卡片框样式（边框、阴影、padding、圆角）使绿色长卷铺满；必要时调整页面背景颜色过渡。
- 复用现有：章节序列取 `chapters`，状态判定可复用 `readLastPoint` / R010 已有进度逻辑；色点用 `cluster.accent`。
- 按 `AGENT_PROTOCOL.md` 执行流程第 7 步，**完成后必须自检视觉**：用 Playwright 截 `/#/ai` 桌面（顶部 / 中部 / 底部三屏）+ 中屏 + 移动端共数张，自己核对侧栏 scroll-spy 跟随、点击跳转效果、白框已拆除且与页面浑然一体、不遮挡小径、移动端方案是否得体；不合格就微调重截，到自己看着合格再报告完成。
- 本版基于 R010（已提交）的工作树继续；本轮完成验收后由人类用户作为下一个小版本提交。

## 执行反馈

> 由执行智能体完成后填写。

执行日期：2026-06-03

### 实现概况

在 R010 长卷地图基线上，只动两件事：① 拆除 `.forest-trail-scene` 的白色卡片框（border / border-radius / box-shadow），把 `.forest-trail-wrap` 改为 `100vw` 全视口铺开，并用 `body:has(.forest-trail-page)` 把整个视口背景换成与草地同色调的渐变 —— 绿色长卷与页面浑然一体，不再「贴在白纸上」。② 新增右侧 `ChapterTrailIndex` 章节序列侧栏（8 章 · 序号 + accent 色点 + 短标题），用 rAF-throttled scroll 监听做 scroll-spy 跟随活动章高亮，点击平滑滚动到该章地标（`prefers-reduced-motion` 下退化为 instant）。`computeLayout` 加 `sidebarReserved` 参数在桌面预留右侧空间，确保树/小径与侧栏不重叠。R010 全部既有结构 / 功能保留无回退。

### 已完成需求

- **拆除外层白框，全幅铺开**：`.forest-trail-scene` 移除 `border` / `border-radius` / `box-shadow` 与原本的渐变背景；`.forest-trail-wrap` 改为 `width:100vw; margin-left:calc(50% - 50vw)` 跳出 `.forest-trail-page` 的 1200px max-width，铺到视口左右边缘。配合 `body:has(.forest-trail-page) { background: linear-gradient(180deg,#eef5e6,#e3eed7 55%,#d6e3c4); }`，整个视口（含 topbar 上下、scene 旁边的空白区域）都变成草地色调 —— 绿色长卷不再被框住，与页面背景过渡自然。
- **右侧章节序列索引（scroll-spy + 点击跳转）**：新建 `src/components/ChapterTrailIndex.tsx`：固定在 `right:14px; top:50%` 的小贴边面板（178px 宽，半透明 + 模糊背景 + 轻阴影），列出 8 章；每项含序号 01–08 + accent 色点 + 短标题；活动项 `accent` 软底色 + 边框、`aria-current="location"`；已走过的章节色点饱满（沿用 `readLastPoint` 推断）。
- **scroll-spy 跟随**：`window` scroll 监听 + rAF 节流。每次重算时遍历 8 个 `[data-chapter-landmark]` 节点（在地标 `<li>` 上加了 `data-chapter-landmark={chapter.id}`），用「`getBoundingClientRect().top ≤ threshold` 中取 top 最大者」作为当前章。阈值 `min(innerHeight*0.22, 160)` 选得比 rowH=300 的一半还小，保证任意时刻最多一个候选 —— 自检确认 ch.4 区域内不会被 ch.5 抢镜。
- **点击平滑跳转**：`jumpToChapter(chapterId)` 查找对应 `data-chapter-landmark` 元素，`scrollIntoView({block:'start', behavior:'smooth'})`；`matchMedia('(prefers-reduced-motion: reduce)')` 命中时退化为 `behavior:'auto'`。地标 `<li>` 上加 `scroll-margin-top:88px` 让 sticky 顶栏不盖住跳转目标。
- **可达性**：侧栏 `<nav aria-label="章节索引">`；每项 `<button>` 可 Tab 聚焦，活动项 `aria-current="location"`；色点 `aria-hidden`；点击外层不抢预览卡（侧栏在 fixed 层、与树元素 hover/focus 互不干扰）。
- **响应式**：媒体查询 `matchMedia('(min-width: 1024px)')` 控制是否启用侧栏；同时把 `sidebarReserved` (200px) 传给 `computeLayout`，桌面端内容带子限制在 `min(w - sidebar, 1040)` 居中区，避免树/小径被侧栏覆盖。中屏 / 移动（<1024）侧栏 CSS `display:none`，长卷自占满主体，用户改用顶栏「N/49」感知位置。
- **R010 现有功能无回退**：sticky 顶栏（返回书架 + 进度 + 进度条）、`trail-head` 介绍、49 小节 + 8 章地标、向心 Catmull-Rom 圆角蛇形小径、章节分段染色、装饰背景树、单预览卡（`previewKey`）、`prefers-reduced-motion` —— 全部保留。

### 未完成或部分完成

- 无。本轮范围（白框拆除 + 章节序列索引）已全部完成。

### 执行中发现的问题

- 初版 scroll-spy 阈值 `innerHeight*0.4 ≈ 360px` 与 `rowH=300px` 接近 —— 自检发现相邻两个章节地标都满足 `top ≤ threshold` 时，下一章会抢镜（ch.4 区被识别为 ch.5）。改为 `min(innerHeight*0.22, 160)` 后稳定。
- `body:has(.forest-trail-page)` 选择器依赖 `:has()` 浏览器支持（Chrome 105+/Safari 15.4+/Firefox 121+）。本项目目标现代浏览器，已采用；如需向更老版本兼容可再加 fallback。
- `.forest-trail-wrap` 用 `100vw + margin-left: calc(50% - 50vw)` 跳出父容器宽度。如未来 `.forest-trail-page` 出现水平滚动条会让 `100vw` 与可视宽度不一致；本项目其它页面已经处理过水平滚动，未观察到副作用。
- 本机 PowerShell 默认 PATH 不含 Node，构建与脚本经 `C:\Program Files\nodejs\npm.cmd` / `node.exe` 运行（沿用前轮环境结论）。

### 认为需求不合理或需要澄清的点

- 中屏（640–1024）当前选择「直接隐藏侧栏」而非退化为窄色点条；理由：长卷主体已经按这一区间设计、用 4 棵每行布局，加上侧栏（即便是窄条）也需要再让步内容宽度。`R011` 文档说"二选一，主观评审决定" —— 如果想要中屏也保留侧栏（窄色点条），可在审核中提出再做。
- 视口背景换色用 `body:has(.forest-trail-page)`；首页 / 阅读页不受影响。如希望整个应用都用统一的浅绿底，可移除条件、直接设给 body。

### 修改文件清单

- 新增 `src/components/ChapterTrailIndex.tsx`：右侧章节序列索引面板（`<nav aria-label>` + `<ol>` + 每项 `<button>` 含序号/色点/短标题/`aria-current`）。
- `src/components/ChapterMapPage.tsx`：
  - 导入 `useEffect` 与 `ChapterTrailIndex`。
  - `computeLayout(width, sidebarReserved=0)`：新增 `sidebarReserved`，根据它和 `min(1040, w-sidebar)` 算出居中的内容带子；padX/perRow 用 `contentMax` 判断（不再用 `w`）。
  - 新增 `hasSidebar` 状态（`matchMedia('(min-width: 1024px)')` 跟随）+ `activeChapterId` scroll-spy 状态。
  - 新增 `useEffect` 监听 `scroll`/`resize`，用 rAF 节流的 `recompute` 找当前活动章（阈值 `min(innerHeight*0.22, 160)`）。
  - 新增 `jumpToChapter(chapterId)`：`scrollIntoView({block:'start', behavior: reducedMotion ? 'auto' : 'smooth'})`。
  - 在 landmark `<li>` 加 `data-chapter-landmark={chapter.id}`（仅 `isLandmark` 时）。
  - 在 `<main>` 末尾按 `hasSidebar` 渲染 `<ChapterTrailIndex>`。
- `src/styles.css`：
  - `.forest-trail-page` 之后追加 `body:has(.forest-trail-page) { background: ... }` 把整页视口换成草地渐变。
  - 重写 `.forest-trail-wrap`（`width:100vw; margin-left:calc(50% - 50vw)`）与 `.forest-trail-scene`（去掉 border/radius/shadow；背景透明）。
  - 末尾追加「R011 · 右侧章节序列索引」样式层：`.trail-slot[data-chapter-landmark]{scroll-margin-top:88px}`、`.trail-index` 固定面板、`.trail-index-item` 含 `is-active` / `is-visited` 状态、`@media (max-width:1023px) .trail-index{display:none}`。
- 未改动 `src/data/courseKnowledge.ts`、`src/data/courseNav.ts`、路由、其他页面；未新增依赖。

### 验证结果

- `npm run build`（经 `npm.cmd`）通过：`tsc -b && vite build` 成功，1587 模块，无类型错误，产物输出 `dist/`。
- 自检视觉（Playwright 多场景，全部通过、无浏览器 / 控制台报错）：
  - **桌面顶部**（1440×900）：`active = "01导论与历史"` 默认高亮；截图 `r011-desktop-top.png` 确认绿色长卷视口铺满、白框已拆、右侧侧栏贴边小巧。
  - **桌面中段**（scrollTo ch.4 landmark - 100px → scrollY=1334）：`active = "04机器学习基础"`；截图 `r011-desktop-mid.png` 确认 scroll-spy 跟随准确，ch.4 / ch.5 配色分段清晰。
  - **桌面点击跳转 ch.7**：`active = "07强化学习与智能体"`；截图 `r011-desktop-jump-ch7.png` 确认 `scrollIntoView` 平滑滚动并正确同步 active 状态。
  - **桌面底部**：截图 `r011-desktop-bottom.png` 显示「林深处」与生成式 AI 章节，整页与草地浑然一体到底。
  - **中屏**（820×900）：`sidebar visible = false`；截图 `r011-medium-top.png` 长卷主体不被挤压。
  - **移动端**（390×844）：截图 `r011-mobile-top.png` / `r011-mobile-mid.png` 长卷全幅、无侧栏、顶栏进度可读。
- 手动核对：点小节直达阅读页、点地标进该章首点、悬停单预览卡、键盘 Tab 进入侧栏并触发跳转 —— 全部正常。

## 迭代 1 反馈

> 由需求讨论窗口在审核 Implemented 后填写。本轮方向正确，白框拆除与右侧索引主体已到位；只有一个明确小问题、按 `AGENT_PROTOCOL.md`「轮次内迭代」处理，不新开 R012。

### 还差什么

1. **章节索引面板需在地图页所有滚动位置始终可见**。当前实现已用 `position: fixed; right:14px; top:50%; transform: translateY(-50%)`，但用户实测「划到别的地方就看不到了」——面板没真正贴在视口上跟随。常见原因：祖先元素（如 `.page` 的 `pageEnter` 动画、或长卷容器、或滚动容器本身）创建了新的**包含块**（transform / filter / backdrop-filter / will-change / contain），导致 `position: fixed` 退化为相对该祖先定位。
2. **章节索引面板与拆白框背景色严格只出现在 Level 1 章节地图页（`/ai`）**。当前面板组件本身已仅在 `ChapterMapPage` 渲染、视口背景用 `body:has(.forest-trail-page)` 作用域。本条作为硬约束**再确认**：首页 `/`、知识点阅读页 `/ai/:chapterId/:pointId` 都不得出现该面板或受影响的草地底色；任何后续布局调整不得破坏这条作用域。

### 期望的修正方向

- **修复包含块逃逸**：排查 `.trail-index` 的所有祖先链上是否有 `transform / filter / perspective / backdrop-filter / will-change: transform / contain: layout|paint|strict`，并消除（或把面板用 React Portal 挂到 `document.body` 下绕开）。验收标准：在 `/ai` 任意滚动位置（顶部、中部、底部）面板都贴在视口右侧、稳定可见。
- **垂直位置可继续用「视口居中」**（`top:50%` + `translateY(-50%)`）或改为更稳健的「顶部偏下贴边」（如 `top: clamp(80px, 18vh, 160px)`），由执行自行评估视觉与可触达性，主观评审定。
- **`<1024px` 中屏/移动端仍按现状隐藏**（用顶栏「N/49」感知位置），本条不动。
- **作用域硬约束**：在自检截图中**额外覆盖 `/` 与 `/ai/:chapter/:point`** 两个页面，确认两处都看不到 `.trail-index` 面板、也看不到草地底色泄漏。

### 是否仍按原非目标与验收标准

- 是。原「非目标」「验收标准」均不变，仅追加上述两点作为本轮额外硬约束。

### 自检要求

按 `AGENT_PROTOCOL.md` 第 7 / 10 步，本次迭代完成后须**追加** `## 执行反馈 2`（不覆盖既有「执行反馈」），并截取以下截图自检：
- `/#/ai` 桌面**顶部 / 中部 / 底部三屏**：每屏右侧侧栏都贴在视口、稳定可见、活动章节高亮跟随；
- `/` 首页：**不得**出现 `.trail-index` 面板、**不得**出现草地底色；
- `/#/ai/intro-history/turing-test`（或任一阅读页）：**不得**出现 `.trail-index` 面板、**不得**出现草地底色。

## 执行反馈 2

> 迭代 1：响应「视口固定悬浮 + 严格只在地图页」两条硬约束。

执行日期：2026-06-03

### 根因诊断

`.page` 元素上有 `animation: pageEnter 280ms ease both;`，其关键帧 `to { transform: translateY(0); }` 在 `animation-fill-mode: both` 下被保留为 computed style。按 CSS Transforms 规范，**任何非 `none` 的 `transform` 值都会让该元素成为后代 `position: fixed` 元素的包含块**。`<ChapterTrailIndex>` 原本渲染在 `<main className="page forest-trail-page">` 内部 → 其 `position: fixed; right:14px; top:50%` 实际上是相对 `.page` 而非视口，于是：

- 面板被钉在 `.page` 的右内边（`.forest-trail-page` 宽度 `min(1200px, 100%)` 居中），而非视口右边 14px。
- 页面滚动时 `.page` 跟着滚走，面板也一起滚走，"划到别的地方就看不到了"。

### 修正

把 `<ChapterTrailIndex>` 用 `react-dom` 的 `createPortal` 直接渲染到 `document.body`，绕开 `.page` 的包含块；同时保证：

- 仅在 `ChapterMapPage` 挂载期间存在；离开 `/ai`（去 `/` 或 `/ai/:chapterId/:pointId`）时 React 卸载 ChapterMapPage → portal 自动清理。
- `body:has(.forest-trail-page)` 的草地底色规则保持不变，只在地图页生效。

垂直定位维持 `top:50%; transform:translateY(-50%)` 视口居中（沿用原审美），未改 CSS。

### 落地代码改动（迭代 1）

- `src/components/ChapterMapPage.tsx`：
  - 新增 `import { createPortal } from 'react-dom'`。
  - 在 `<main>` 末尾把 `<ChapterTrailIndex>` 改为 `createPortal(<ChapterTrailIndex .../>, document.body)`，保留 `hasSidebar`（matchMedia ≥ 1024px）的条件与 SSR 守卫（`typeof document !== 'undefined'`）。
- `src/styles.css`：无需改动（侧栏自身样式与响应式断点都已正确）。

### 自检视觉（Playwright 三屏 + 首页 + 阅读页，全部通过、无浏览器/控制台报错）

`.agents/artifacts/screenshots/`：

- `r011-iter1-map-top.png` / `r011-iter1-map-mid.png` / `r011-iter1-map-bottom.png`：
  - 三屏侧栏视口矩形完全一致 `{top: 285, right: 14}` —— 真正贴视口右边、随页面滚动**不漂移**；
  - active 跟随：top → `01 导论与历史`，mid → `04 机器学习基础`，bottom → `08 生成式 AI 与安全伦理`。
- `r011-iter1-home.png`（`/`）：DOM 内 `.trail-index` 节点数 = 0；`document.body` 的 `background-image` 是 R008 已有的蓝灰网格，无草地色（`#eef5e6/#e3eed7/#d6e3c4` 均未出现）。
- `r011-iter1-reading.png`（`/#/ai/intro-history/turing-test`）：`.trail-index` 节点数 = 0；body 背景同上，无草地色。

### 与原 R011 范围的关系

- 「白色卡片框拆除 + 视口同色草地底」结论不变，原「执行反馈」全部仍然有效。
- 本次迭代仅修「面板从 `.page` 包含块逃出、转挂 `<body>`」一处，未改预览卡、scroll-spy 算法、响应式断点等其余既有逻辑。
- 中屏（640–1024）维持隐藏侧栏的现有方案（按需求文档「执行可二选一」与「本条不动」）。

## 迭代 2 反馈

> 由需求讨论窗口在审核「执行反馈 2」（迭代 1 已落地）后填写。方向仍然对、portal + 严格作用域生效；本次再加一项可收起交互。继续在本轮迭代。

### 还差什么

1. **章节索引面板需可收起 / 展开切换**。当前面板始终展开占据右侧，希望用户能主动收起；收起后变成一个**指南针图标**（小、扁平几何风，与森林地图视觉语言一致），位于地图页右侧合适位置；**点击指南针图标 → 展开为完整索引面板**（即当前的 `.trail-index`）。再次点击面板上的收起按钮 → 回到指南针态。
2. **收起态下长卷地图应居中**。当前 `computeLayout` 用 `sidebarReserved=200` 给侧栏预留宽度，导致长卷整体偏左。收起为指南针后，**sidebarReserved 应变为 0（或仅占指南针小图标的宽度）**，长卷在主视区正常居中、不再偏左。展开时回到现状（预留空间、避免遮挡）。

### 期望的修正方向

- **可控状态**：在 `ChapterMapPage`（或 `ChapterTrailIndex`）中维护一个 `indexCollapsed`（或 `indexOpen`）布尔状态，控制面板/指南针两种 UI 切换。建议用 `localStorage` 持久化（如 `trail-index-collapsed`），让用户偏好跨会话生效；默认值：
  - 桌面（≥1024px）：默认**展开**（沿用现状，默认 OK）；
  - 中屏 / 移动（<1024px）：现状是 `display:none`，本次保持不变（指南针在这两档**不出现**，因为长卷已占满主体；如执行评估指南针在中屏也能优雅放置且不挤压长卷可启用，主观评审定）。
- **指南针图标**：用 SVG 自绘扁平几何风（圆形外壳 + 红色指北箭头），与森林地图同一视觉语言；尺寸 ~36–44px；位置贴右侧、与展开态面板的水平位置一致（视觉上"是同一个东西收起来了"），垂直可仍居中（top:50% + translateY(-50%)）或顶部偏下贴边，由执行视觉评审定。
- **状态联动布局**：
  - 展开 → `sidebarReserved=200`（沿用现状），面板可见、长卷为侧栏让位；
  - 收起 → `sidebarReserved=0`（或 ≤56px 给指南针留位），长卷在主视区**正常居中**；指南针小图标本身用 `position: fixed`（沿用 Portal 修复），不再吃 `computeLayout` 的宽度。
  - 切换时 `computeLayout` 须重算（依赖宽度变化触发 `ResizeObserver` 或在切换时手动 `forceRecompute()`），动画过渡尊重 `prefers-reduced-motion`。
- **可达性**：
  - 指南针按钮：`<button aria-expanded="false" aria-controls="trail-index-panel" aria-label="展开章节索引">`；面板上加 `id="trail-index-panel"`；面板上的收起按钮：`<button aria-expanded="true" aria-label="收起章节索引">`（或同一按钮根据 `aria-expanded` 切换标签）；键盘可 Tab + Enter 触发。
  - 触发收起时焦点回到指南针按钮，触发展开时焦点回到收起按钮（或首个章节项），保持键盘可控。
- **沿用迭代 1 修复**：面板仍用 Portal 挂到 `document.body`，`position: fixed` 在所有滚动位置可见；指南针图标同样用 Portal + `position: fixed`，作用域硬约束（只在 `/ai` 渲染）不变。

### 是否仍按原非目标与验收标准

- 是。原「非目标」「验收标准」均不变，本次追加：
  - 章节索引可在「展开面板 / 收起指南针」两态间切换；
  - 收起态下长卷地图**在主视区居中**，不再偏左；
  - 指南针图标视觉风格与森林地图统一（扁平几何）；
  - 状态切换无视觉跳变 / 错位；动画尊重 `prefers-reduced-motion`；
  - 迭代 1 已确认的「Portal 修复包含块逃逸」「严格作用域只在 `/ai`」不得回退。

### 自检要求

按 `AGENT_PROTOCOL.md` 第 7 / 10 步，本次迭代完成后须**追加** `## 执行反馈 3`（不覆盖既有），并截取以下截图自检：
- `/#/ai` 桌面**展开态**顶 / 中 / 底三屏：面板始终贴视口右侧、活动章节高亮跟随；
- `/#/ai` 桌面**收起态**顶 / 中 / 底三屏：右侧只见指南针图标、长卷**居中**显示（左右留白对称）；
- 切换动作截图：展开 → 点收起 → 指南针出现、长卷重新居中；点指南针 → 面板展开、长卷为侧栏让位；
- `/` 首页：**不得**出现面板或指南针、**不得**有草地底色（沿用迭代 1 作用域硬约束）；
- 任一阅读页：同上不得泄漏。

## 执行反馈 3

> 迭代 2：响应「章节索引可收起为指南针图标 + 收起时长卷居中」两条硬约束。

执行日期：2026-06-03

### 落地要点

- **可收起 / 展开切换**：在 `ChapterMapPage` 引入 `indexCollapsed` 状态，并用 `window.localStorage('trail-index-collapsed')` 持久化用户偏好（隐私模式下静默降级为单会话）。切换由两处触发：
  - 展开态面板头新增 `[data-trail-index-close]` 的 `<button>`（`aria-expanded="true"` / `aria-controls="trail-index-panel"`），点击 → 收起。
  - 收起态指南针 `<button>`（`aria-expanded="false"` / `aria-controls="trail-index-panel"`），点击 → 展开。
- **指南针图标（扁平几何）**：`<CompassIcon>` 内联 SVG —— 浅绿圆环 + 白色内圆 + 红色北向尖 / 灰色南向尖 + 中心针轴。尺寸 44×44px，圆形外壳带半透明白底 + 模糊 + 轻阴影。与森林地图同一视觉语言。
- **状态联动布局（核心修正）**：`sidebarReserved = hasSidebar && !indexCollapsed ? 200 : 0`。`useMemo([width, sidebarReserved])` 让 `computeLayout` 在切换时自动重算 → 收起态 `sidebarReserved=0`，`(viewportWidth - contentMax) / 2` 真正对称的 `leftMargin`，长卷在主视区**完全居中**。
- **沿用迭代 1 修复不回退**：面板与指南针**都用 portal 挂到 `document.body`**，绕开 `.page` 的 transform 包含块；`hasSidebar` matchMedia（`min-width: 1024px`）控制是否启用；ChapterMapPage 卸载时 portal 自动清理 → 严格只在 `/ai` 出现。
- **可达性**：
  - 切换时 `requestAnimationFrame` 内做焦点联动：收起后 `compassBtnRef.current?.focus()`；展开后焦点回 `[data-trail-index-close]`。
  - 面板与指南针均带 `aria-expanded` + `aria-controls="trail-index-panel"`；面板根 `id="trail-index-panel"` + `aria-label="章节索引"`。
- **响应式**：`@media (max-width: 1023px) .trail-index-compass { display: none }` —— 与面板同断点；中屏 / 移动端两者都不出现，长卷自占满主体（沿用迭代 1 决策）。
- **动效与 reduced-motion**：指南针 hover/focus 轻 scale + box-shadow，`prefers-reduced-motion: reduce` 下关闭过渡与 hover 缩放。

### 代码改动（迭代 2）

- `src/components/ChapterTrailIndex.tsx`：改为 `forwardRef<HTMLElement>`；根 `<nav>` 加 `id="trail-index-panel"`；标题区拆为 `.trail-index-head` 容纳 `.trail-index-close`（`<X size={14}>` 按钮，`aria-expanded="true"` + `data-trail-index-close` 用于精准定位焦点）；新增 `onCollapse` prop。
- `src/components/ChapterMapPage.tsx`：
  - 新增 `indexCollapsed` 状态 + localStorage 读写 + `toggleIndex` 回调（含焦点联动）。
  - `sidebarReserved` 改为 `hasSidebar && !indexCollapsed ? 200 : 0` —— 状态切换驱动 `useMemo` 重算 layout。
  - portal 内根据 `indexCollapsed` 渲染 `<button className="trail-index-compass">` 或 `<ChapterTrailIndex onCollapse={toggleIndex} ref={indexPanelRef}>`。
  - 新增 `<CompassIcon>` 内联组件（圆环/内圆/红北/灰南/中心针 5 个 SVG 元素）。
- `src/styles.css`：在 `.trail-index-title` 前加 `.trail-index-head`（flex space-between）；新增 `.trail-index-close`（22px 小按钮）；新增 `.trail-index-compass` + `.compass-svg` / `.compass-ring` / `.compass-face` / `.compass-needle-n` / `.compass-needle-s` / `.compass-pin`；`@media (max-width: 1023px)` 同断点隐藏指南针；`prefers-reduced-motion` 关闭过渡。

### 自检视觉（Playwright 多场景，全部通过、无浏览器/控制台报错）

`.agents/artifacts/screenshots/`：

- **展开态 顶 / 中 / 底**（`r011-iter2-expanded-{top,mid,bottom}.png`）：面板始终贴视口右侧（`right:14, top:285`）、滚动不漂移、active 跟随；长卷为侧栏让位（leftmost=296, rightmost=944）。
- **收起态 顶 / 中 / 底**（`r011-iter2-collapsed-{top,mid,bottom}.png`）：面板节点数 = 0；指南针视口固定 `top:428, right:14`，滚动不漂移；长卷 leftmost+rightmost = `396 + 1044 = 1440 = viewportWidth` → **居中漂移 0.0px（完美对称）**。
- **切换截图**：
  - `r011-iter2-after-collapse.png`：点 ✕ 后面板消失、指南针出现、长卷立即重新居中。
  - `r011-iter2-after-expand.png`：点指南针后面板回归、active 跟随当前 scrollY 高亮（截图为底部，08 章活动）、长卷为侧栏让位。
- **严格作用域硬约束（迭代 1 验过、本次重测）**：
  - `/`（首页）：panel=0、compass=0、body 背景为蓝灰网格（无草地色）。
  - `/#/ai/intro-history/turing-test`（阅读页）：panel=0、compass=0、body 背景无草地色。
- `npm run build`（经 `npm.cmd`）通过：`tsc -b && vite build` 成功，1587 模块，无类型错误（修复了 `forwardRef<HTMLDivElement>` → `<HTMLElement>` 一处类型对齐）。

### 与原 R011 范围 + 迭代 1 的关系

- 「白色卡片框拆除 + 视口同色草地底」「面板 portal 到 body 修复包含块逃逸」「严格只在 `/ai`」全部保留无回退。
- scroll-spy 算法（阈值 `min(innerHeight*0.22, 160)`、首尾两章不抢镜）、平滑跳转、键盘可达性、悬停单预览卡、49 小节 + 8 地标 + 向心 Catmull-Rom 曲线均不动。
- 本次迭代追加：可收起切换、指南针 UI、`sidebarReserved` 状态联动、状态持久化。

## 审核记录

- 2026-06-03（需求讨论窗口）：人类用户经截图自审与浏览器实测后接受。
- 本轮共走了**两次轮次内迭代**（按 `AGENT_PROTOCOL.md` 新增的「轮次内迭代」机制）：
  - **迭代 1**：修复 `position: fixed` 被祖先包含块逃逸的问题 → 改用 React Portal 将面板挂到 `document.body`，并再确认严格作用域（面板与草地底色仅作用于 `/ai`）；
  - **迭代 2**：面板可收起 / 展开切换，收起态变为扁平几何指南针图标，收起时长卷地图触发 `computeLayout` 重算、在主视区居中。
- 本轮形成的最终基线：
  - 长卷外层白色卡片框已拆除；视口背景用 `body:has(.forest-trail-page)` 与草地同色调，绿色长卷与页面浑然一体；
  - 新增右侧章节序列索引面板：Portal 挂到 `document.body`、`position: fixed`、scroll-spy + 点击平滑跳转、键盘可达、`aria-current="location"`；
  - 索引可收起为扁平几何指南针图标（与森林视觉一致），状态 `localStorage` 持久化，收起态下长卷在主视区居中；
  - 桌面端 ≥1024 启用，中屏 / 移动 <1024 隐藏，由顶栏「N/49」承担位置感知；
  - R010 长卷主体（49 小节、8 章地标、向心 Catmull-Rom、分段染色、单预览卡、顶栏进度、可达性）全部保留无回退。
- 状态置 `Accepted`，回写 `current_state.md`。森林地图至此从 R010 → R011 的两个小版本（R010 = 长卷重构；R011 = 索引 + 全展开）共同构成 Level 1 当前基线，待人类用户作为下一个小版本统一提交。
