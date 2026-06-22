import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const port = 5219;
const base = `http://127.0.0.1:${port}`;
const out = path.join(root, '.agents', 'artifacts', 'screenshots');

const server = spawn('npm', ['run', 'dev', '--', '--port', String(port)], { cwd: root, env: process.env, stdio: 'ignore' });

async function reachable() {
  try { return (await fetch(base, { method: 'HEAD' })).ok; } catch { return false; }
}
async function waitServer() {
  const t = Date.now();
  while (Date.now() - t < 25000) { if (await reachable()) return; await new Promise(r => setTimeout(r, 300)); }
  throw new Error('server timeout');
}

try {
  await waitServer();
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto(`${base}/#/ai`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const hasCanvas = await page.locator('canvas').count();
  await page.screenshot({ path: path.join(out, 'forest-overview.png') });

  // 点击画布中心，尝试命中一棵树 → 详情面板
  const box = await page.locator('.forest-3d-canvas').boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1200);
  }
  const panelVisible = await page.locator('.forest-detail-panel').count();
  const readmore = await page.locator('.forest-detail-readmore').count();
  await page.screenshot({ path: path.join(out, 'forest-clicked.png') });

  // 阅读页验证（手写点，应含图示）
  await page.goto(`${base}/#/ai/intro-history/turing-test`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const hasDetail = await page.locator('.detail-panel').count();
  const hasDiagram = await page.locator('.diagram-canvas').count();
  const dockItems = await page.locator('.dock-item').count();
  await page.screenshot({ path: path.join(out, 'reading-page.png') });

  console.log(JSON.stringify({ hasCanvas, panelVisible, readmore, hasDetail, hasDiagram, dockItems, errors }, null, 2));
  await browser.close();
} finally {
  server.kill('SIGINT');
}
