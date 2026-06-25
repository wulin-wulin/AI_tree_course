// R011 相机交互自检：初始/最佳视角、右键转视角、左键平移限位、重置。
// 前置：dev server 已在 5219 端口运行。
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const base = 'http://127.0.0.1:5219';
const out = path.join(root, '.agents', 'artifacts', 'screenshots');

await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`${base}/#/ai`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
const canvasBox = await page.locator('#forest-canvas-container').boundingBox();
await page.screenshot({ path: path.join(out, 'cam-1-best.png') });

const cx = canvasBox.x + canvasBox.width / 2;
const cy = canvasBox.y + canvasBox.height / 2;

// 纯水平右键拖（dy=0）：只改水平朝向（朝北→朝西），其余不变
await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'right' });
await page.mouse.move(cx + 300, cy, { steps: 16 });
await page.mouse.up({ button: 'right' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'cam-2-rotate-heading.png') });

// 继续纯水平右键拖，朝向继续转一圈（验证不被夹住）
await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'right' });
await page.mouse.move(cx + 600, cy, { steps: 24 });
await page.mouse.up({ button: 'right' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'cam-2b-heading-more.png') });

// 回最佳视角后，纯竖直右键拖（dx=0）：只改俯仰（上滑拉低视角）
await page.locator('.forest-reset').click();
await page.waitForTimeout(400);
await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'right' });
await page.mouse.move(cx, cy - 260, { steps: 16 });
await page.mouse.up({ button: 'right' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'cam-2c-pitch.png') });

// 左键大幅平移（尝试把森林拖飞，应被限位挡住）
await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'left' });
await page.mouse.move(cx + 1200, cy + 900, { steps: 15 });
await page.mouse.up({ button: 'left' });
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(out, 'cam-3-pan-clamped.png') });

// 重置回最佳视角（应与 cam-1 一致）
await page.locator('.forest-reset').click();
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(out, 'cam-4-reset.png') });

// 转向后平移跟手验证：先右键转 ~90°，截基线；再左键向右拖，内容应朝屏幕左移（跟手）
await page.locator('.forest-reset').click();
await page.waitForTimeout(300);
await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'right' });
await page.mouse.move(cx + 400, cy, { steps: 16 });
await page.mouse.up({ button: 'right' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'cam-5a-rotated-base.png') });

await page.mouse.move(cx, cy);
await page.mouse.down({ button: 'left' });
await page.mouse.move(cx + 350, cy, { steps: 16 });
await page.mouse.up({ button: 'left' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'cam-5b-pan-after-rotate.png') });

// 知识簇跳转验证：抽查几个簇（含此前失效的），点图例后截图，相机应框住该簇范围
const clustersToCheck = ['导论与历史', '卷积神经网络', '大语言模型', '语音技术'];
const jumped = {};
for (const name of clustersToCheck) {
  await page.locator('.forest-reset').click();
  await page.waitForTimeout(300);
  const beforeShot = await page.locator('#forest-canvas-container').screenshot();
  const btn = page.locator('.forest-legend-item', { hasText: name }).first();
  await btn.click();
  await page.waitForTimeout(600);
  const afterShot = await page.locator('#forest-canvas-container').screenshot();
  jumped[name] = Buffer.compare(beforeShot, afterShot) !== 0; // 画面是否变化（相机是否动）
  const safe = name.replace(/[^\w一-龥]/g, '');
  await page.screenshot({ path: path.join(out, `cam-cluster-${safe}.png`) });
}

// 悬停验证：默认视角(无树标签)下把鼠标移到中部某棵树，应单独冒出它的标签
await page.locator('.forest-reset').click();
await page.waitForTimeout(400);
let hoverFound = false;
outer:
for (const oy of [-40, 0, 40, 80]) {
  for (const ox of [-120, -40, 40, 120, 200]) {
    await page.mouse.move(cx + ox, cy + oy);
    await page.waitForTimeout(120);
    if (await page.locator('#forest-canvas-container').evaluate(() => false).catch(() => false)) break;
    const cursor = await page.locator('#forest-canvas-container').evaluate((el) => el.style.cursor);
    if (cursor === 'pointer') { hoverFound = true; break outer; }
  }
}
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(out, 'cam-hover-label.png') });

console.log(JSON.stringify({ canvasBox, jumped, hoverFound, errors }, null, 2));
await browser.close();
