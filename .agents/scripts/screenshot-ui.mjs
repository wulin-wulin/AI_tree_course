import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const rootDir = process.cwd();
const port = Number(process.env.UI_REVIEW_PORT ?? 5173);
const baseUrl = process.env.UI_REVIEW_URL ?? `http://127.0.0.1:${port}/`;
const outputDir = path.join(rootDir, '.agents', 'artifacts', 'screenshots');
const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];

let serverProcess;

async function isReachable(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

function startServer() {
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  serverProcess = child;
}

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < 20_000) {
    if (await isReachable(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function capture() {
  await mkdir(outputDir, { recursive: true });

  const shouldStartServer = !(await isReachable(baseUrl));
  if (shouldStartServer) {
    startServer();
    await waitForServer(baseUrl);
  }

  const browser = await chromium.launch();
  const pageErrors = [];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      page.on('console', (message) => {
        if (message.type() === 'error') {
          pageErrors.push(`${viewport.name}: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => {
        pageErrors.push(`${viewport.name}: ${error.message}`);
      });

      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(outputDir, `${viewport.name}.png`),
        fullPage: true,
      });
      await page.close();
    }
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill('SIGINT');
    }
  }

  if (pageErrors.length) {
    console.error('Browser console errors:');
    for (const error of pageErrors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
  }

  console.log(`Screenshots written to ${path.relative(rootDir, outputDir)}`);
}

capture().catch((error) => {
  if (serverProcess) {
    serverProcess.kill('SIGINT');
  }
  console.error(error);
  process.exit(1);
});
