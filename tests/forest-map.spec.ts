import { test, expect } from '@playwright/test';

// 需先 `npm run dev`（或在 playwright.config 中配置 webServer）。默认 baseURL http://localhost:5173。
test('森林地图加载并能进入阅读页', async ({ page }) => {
  await page.goto('/#/ai');
  // Canvas 挂载
  await expect(page.locator('canvas')).toBeVisible();
  // 顶栏进度可见
  await expect(page.getByText(/已点亮 \d+\/\d+/)).toBeVisible();
  // 返回书架链接存在
  await expect(page.getByText('← 返回书架')).toBeVisible();
});
