# R012 - 森林导览页：修复图例/下拉跳转簇 + 默认视角再放平

状态：Accepted

创建日期：2026-06-23

## 背景

R011 完成森林导览页相机交互改进（右键转视角 / 平移限位 / 最佳视角）后，用户继续体验发现两个问题：左侧知识簇图例点击跳转「时灵时不灵」；默认最佳视角的仰角想再放平一点。本轮只聚焦 `/ai` 森林导览页，不动数据、布局、阅读页与首页。

> 本轮承接 R011（已 Accepted）的相机实现继续打磨。

## 用户真实反馈

逐字记录：

1. 「左边知识簇导览的框，点一下能移动到对应知识点范围视图的功能时灵时不灵，写到需求中要进行修复。」
2. 「最佳默认视角的仰角可以再拉低一点。」（追加澄清：要**更平 / 更侧面**——相机更贴近地平线、从侧面看森林、树的立体感/纵深更强；即延续 R011「放平」趋势，俯仰角 `phi` 继续调大。）

## 根因分析（需求 1，已从代码定位）

调用链：左侧图例 `#forest-legend` 的每个簇按钮 `onClick={() => sceneRef.current?.flyTo(c.id)}`（`ForestMapPage.tsx` 约行 123）与顶部「跳到知识簇」下拉 `onChange` 同样调 `flyTo(c.id)`（约行 107），传入的都是**簇 id**（`clusterId`）。

`flyTo(kpId)`（`scene3d.js` 约行 423）的逻辑：

1. 先 `this.treeMeta.find(m => m.id === kpId)` —— 但 `treeMeta` 的 id 是**知识点 id**，不是簇 id。
2. 找不到才 `this.layout.categories.find(c => c.id === kpId)` —— 而适配器 `forestAdapter.ts:18` 里 `categories: []` 是**空数组**，永远找不到。

实测后果（`index.json`：23 簇 / 603 点）：

- 23 个簇 id 里只有 **`cnn`、`transformer` 这 2 个**恰好也是某个知识点 id，于是这 2 个簇点击时 `treeMeta` 命中、相机会动（但飞到的是那**单棵树**、`r=800`，并非「簇的知识点范围」）→ 表现为「灵」。
- 其余 **21 个簇**落到空的 `categories` → `flyTo` **什么都不做**、静默失败 → 「不灵」。

这就是「时灵时不灵」：**2/23 偶然能动（且行为不对），21/23 完全无效**。

注：当前 `flyTo` 的唯一调用方是图例与下拉，**都只传簇 id**（搜索结果走 `navigate` 进阅读页，不调 `flyTo`）。所以「知识点 id 优先匹配」这条分支对现有 UI 而言基本是会误伤的死逻辑。

## 本轮目标

让左侧图例与顶部下拉点击任一知识簇，都能**稳定地把视图移动并框住该簇的知识点范围**；并把默认/重置的最佳视角仰角再放平一点。

## 具体需求

### 需求 1：修复图例 / 下拉点击跳转到知识簇（23 个都要稳）

- `flyTo` 收到**簇 id**时，必须可靠地把相机移动到并**框住该簇的知识点范围**（对全部 23 个簇都生效，不再只有 2 个）。
- 推荐实现：按该簇的知识点集合算包围盒——可用 `data.kpsByCat[clusterId]`（适配器已按 `clusterId` 建好，`forestAdapter.ts:28`）拿到该簇的点，再到 `layout.points` 取这些点的 `pos`，求 min/max 包围盒：
  - `target` = 包围盒质心。
  - `r` = 按相机 FOV 反算到「恰好框住该簇 + 留少量边距」（可复用 `_computeBestView` 里同样的 FOV 反算思路，只是范围换成单簇）。
  - 仍经 `_clampTarget` 夹紧、设 `_needsVisRefresh = true`、调 `_updateCamera()`。
  - 俯仰 `phi`/朝向 `theta`：建议沿用当前/最佳视角的角度，保持观感一致（不要每次跳转就翻转角度）。
- 必须修掉「知识点 id 优先匹配」把 `cnn`/`transformer` 误判成单棵树的问题：当调用语义是「跳到簇」时，应按簇解析（可新增 `flyToCluster(clusterId)` 给图例/下拉用，或在 `flyTo` 内先判定 id 是否为簇 id 再决定分支）。
- 退一步可用 `layout.domains` 里已填好的 `label_pos`（`forestAdapter.ts:11`，23 簇都有）+ polygon 作为 target/范围来源；但**优先按知识点包围盒**，更贴合用户说的「知识点范围视图」。
- 图例与下拉两个入口走同一套逻辑，行为一致。

### 需求 2：默认 / 重置最佳视角的仰角再放平（更平、更侧面）

- 把 `_computeBestView()`（`scene3d.js` 约行 494）里 `_best.phi` 从当前的 `1.0` **调大一点**（更贴近地平线、更侧面、更有 3D 纵深），建议先试 `1.1 ~ 1.2`，**必须落在 `phi` 夹紧范围 `[0.35, 1.30]` 内**。
- 因为初始加载与 `⟳` 重置共用同一组 `_best` 参数，本改动会同时作用于两者（符合预期，保持一致）。
- 放平后注意 `r`（框住范围）可能需要随之微调，避免顶行树被顶部栏遮挡或底部过空——执行者按观感调。
- 「好看 / 放平程度」是主观标准：执行者必须按 `AGENT_PROTOCOL.md` 截图自检 `/#/ai`，对比 R011 的 `phi=1.0` 再放平到自己看着舒服为止，并在反馈里附截图与最终 `phi`/`r`。

## 非目标

- 不改森林布局算法、`index.json` 数据、簇着色、LOD / 密度可见性逻辑。
- 不改右键转视角 / 左键平移限位 / 滚轮缩放等 R011 已验收的交互（除需求 2 仅调默认 `phi`）。
- 不改阅读页、首页、搜索框逻辑。
- 不引入新依赖；沿用现有自写球面相机控制。
- 不做移动端触摸手势。

## 验收标准

- `npm run build`（`tsc -b && vite build`）通过。
- 左侧图例点击**任一**知识簇（含此前失效的 21 个）都能稳定把视图移动并框住该簇知识点范围；顶部「跳到知识簇」下拉同样稳定生效；`cnn`/`transformer` 不再错飞到单棵树。
- 默认加载与 `⟳` 重置的视角比 R011 更平 / 更侧面（`phi` 调大且在 `[0.35,1.30]` 内），整体仍框住森林、居中、不被顶部栏遮挡。
- 按 `AGENT_PROTOCOL.md` 截图自检 `/#/ai`：至少抽查 3~4 个不同知识簇的跳转效果 + 默认视角，附图与最终参数说明。

## 执行备注

- 主要改动文件：`src/forest/vendor/scene3d.js`（`flyTo()` 约行 423、`_computeBestView()` 约行 494 的 `_best.phi`；可能新增 `flyToCluster`）。如改 `flyTo` 签名/新增方法，注意 `ForestMapPage.tsx` 图例（约行 123）与下拉（约行 107）的调用同步。
- 簇→点映射现成可用：`forestAdapter.ts` 的 `kpsByCat[clusterId]`（行 28）；点坐标在 `layout.points`（`{id,pos,scale}`，行 16）。`layout.domains[].label_pos` / polygon 也可用（行 7-12）。
- 相机模型见 R011 文档：球面相机 `theta(朝向)/phi(俯仰)/r(距离)/target(注视点)`，`phi` 已是用户可控独立状态，夹紧 `[0.35,1.30]`；平移限位框 `_panBox`、夹紧函数 `_clampTarget`、最佳视角 `_computeBestView` 均已存在，本轮复用。
- 渲染是持续 RAF（`ForestMapPage` 约行 54），相机状态一改下一帧即反映。
- 验证 PATH 提示：本机 PowerShell 默认不含 Node，需手动指向 `C:\Program Files\nodejs`（或用 `npm.cmd`，spawn 子进程也要用 `npm.cmd`）；属本机 shell 环境问题，非构建失败。

## 执行反馈

> 由执行智能体完成后填写。

### 实现概况

按 R012 两项需求改动,只动 `/ai` 森林导览页相机:`scene3d.js` 新增 `flyToCluster()` + 抽出 `_frameRadius()` 复用 FOV 反算、`_best.phi` 放平;`ForestMapPage.tsx` 图例与下拉改调 `flyToCluster`。未碰数据/布局/着色/LOD、阅读页/首页/搜索、以及 R011 已验收的右键转视角 / 左键平移限位 / 滚轮缩放。

### 已完成需求

- **需求 1（修复簇跳转,23 簇都稳）**:新增 `flyToCluster(clusterId)`——用 `treeMeta.filter(m => m.catId === clusterId)` 取该簇全部知识点的世界坐标,求包围盒 → `target=` 质心、`r=_frameRadius(spanX,spanY,1.6)` 夹在 `[900, 整片森林 _best.r]`,经 `_clampTarget` 夹紧后 `_updateCamera()`;俯仰/朝向沿用当前视角(不翻转,观感一致)。图例(`ForestMapPage` 约行 123)与顶部下拉(约行 107)都改调 `flyToCluster`,走同一套逻辑。**彻底绕开原 `flyTo` 的「知识点 id 优先匹配 + categories 空数组」死逻辑**:`cnn`/`transformer` 不再错飞到单棵树,其余 21 个簇不再静默失败。兜底:若某簇无成员(理论不会),回退到 `categories`/`domains` 的 `label_pos`。
- **需求 2（默认/重置视角再放平）**:`_computeBestView()` 的 `_best.phi` 由 R011 的 `1.0` 调到 **`1.18`**(更平、更侧面、更强 3D 纵深,在夹紧 `[0.35,1.30]` 内);因放平后 FOV 框选需更大距离,`r` 留边距系数由 `1.02` 调到 `1.12`,使顶行树仍避开顶部栏、底部不过空。初始加载与 `⟳` 重置共用 `_best`,二者一致。

### 未完成或部分完成

- 无。两项需求均完成。
- 观感说明:因默认视角放平,簇跳转(沿用当前角度)时该簇会偏屏幕中下方而非正中——这是平视角的几何特性(注视点在画面中下、内容向上纵深),簇范围仍完整框住,符合「框住该簇知识点范围」。

### 执行中发现的问题

- 簇→点映射直接用 `treeMeta`(已含每点 `catId` 与世界 `pos`)即可,无需再查 `kpsByCat`+`layout.points`,更省一次映射。
- `_frameRadius` 的 FOV 反算是按正俯视推导;平视角下会偏小,故簇跳转用 1.6、整片森林用 1.12 的经验系数 + 截图校准。

### 认为需求不合理或需要澄清的点

- 无。

### 修改文件清单

- 修改:`src/forest/vendor/scene3d.js`(新增 `flyToCluster()`、抽出 `_frameRadius()`、`_computeBestView` 改用 `_frameRadius` 且 `phi=1.18`/`r×1.12`)。
- 修改:`src/components/ForestMapPage.tsx`(图例 + 下拉改调 `flyToCluster`;`sceneRef` 类型补 `flyToCluster`)。
- 自检工具:`.agents/scripts/shot-camera.mjs`(追加 4 个知识簇跳转抽查 + 画面变化检测)。

### 验证结果

- `npm run build`(`tsc -b && vite build`)通过。
- `npm run test:forest`:4 个单测全过(本轮未触及被测模块,作回归)。
- **截图自检 `/#/ai`(1440×1000,无控制台错误)**:
  - 簇跳转抽查 `导论与历史 / 卷积神经网络 / 大语言模型 / 语音技术`(含此前 21 个失效之二 + 行为错误的 cnn),脚本 `jumped` 全部 `true`(相机均移动);`cam-cluster-卷积神经网络` 清楚框住整片 CNN 簇(ResNet/DenseNet/VGGNet/U-Net…),**不再错飞到单棵树**;其余三簇也各自框住其点范围。
  - `cam-1-best`:默认视角比 R011(`phi=1.0`)明显更平 / 更侧面、3D 纵深更强,整片森林仍框住、居中、顶行避开顶部栏。
  - `cam-4-reset`:`⟳` 与初始视角一致。

## 审核记录

审核人：需求讨论窗口　审核日期：2026-06-23　结论：**通过（Accepted）**

用户已自行体验确认「R12 可以了」；讨论窗口另核对代码 + 自检截图 + 构建。

- **需求 1（簇跳转修复）通过**：新增 `flyToCluster(clusterId)`（`scene3d.js` 行 524）用 `treeMeta.filter(m => m.catId === clusterId)` 取该簇全部点的世界坐标算包围盒 → `target=` 质心、`r=_frameRadius(...,1.6)` 夹在 `[900, _best.r]`、经 `_clampTarget`，俯仰/朝向沿用当前视角；无成员时回退 `categories`/`domains` 的 `label_pos`。图例（`ForestMapPage` 行 131）与下拉（行 115）均改调 `flyToCluster`，**彻底绕开原 `flyTo` 的「知识点 id 优先 + categories 空数组」死逻辑**。截图 `cam-cluster-卷积神经网络` 框住整片 CNN 簇、不再错飞单棵树；`cam-cluster-导论与历史`（原 21 个失效簇之一）正确框住。
- **需求 2（默认视角再放平）通过**：`_computeBestView()`（行 511）`_best.phi` 由 1.0 调到 **1.18**（在夹紧 `[0.35,1.30]` 内）、留边距系数 `r×1.12`；初始与重置共用 `_best`。簇跳转截图可见明显更平/更侧面的纵深。
- **构建**：`npm run build` 通过；`test:forest` 4 测全过。主 bundle 1.1MB 警告为 R010 起的已知项，非本轮回归。
- 实现增益（不越界）：抽出 `_frameRadius()` 复用 FOV 反算；簇→点映射直接用 `treeMeta`（含 `catId`+`pos`）省一次映射。合理。
- 备注：默认视角放平后，簇跳转（沿用当前角度）时该簇会偏屏幕中下方而非正中——平视角几何特性，簇范围仍完整框住，符合「框住该簇知识点范围」，可接受。
- 真实状态已回写 `current_state.md`（对应确认轮次更新为 R012）。
