import { chromium } from '@playwright/test';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://127.0.0.1:8899/web/index.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
await page.screenshot({ path: '.agents/artifacts/screenshots/REFERENCE-overview.png' });
console.log(JSON.stringify({ errors: errors.slice(0, 6) }, null, 2));
await browser.close();
