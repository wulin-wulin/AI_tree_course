import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildIdeologyPrompt, generateIdeology } from './ideology.mjs';

test('prompt 含标题与簇', () => {
  const p = buildIdeologyPrompt({ title: '决策树', coreIdea: '递归划分', clusterId: 'ml-basics' });
  assert.match(p, /决策树/);
  assert.match(p, /ml-basics/);
});

test('缓存命中不调用 llm', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ideo-'));
  writeFileSync(join(dir, 'x.txt'), '缓存内容');
  let called = false;
  const r = await generateIdeology({ id: 'x', title: 't', clusterId: 'c' },
    { llmCall: async () => { called = true; return 'new'; }, cacheDir: dir });
  assert.equal(r, '缓存内容');
  assert.equal(called, false);
  rmSync(dir, { recursive: true, force: true });
});

test('未命中调用 llm 并落盘', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ideo-'));
  const r = await generateIdeology({ id: 'y', title: 't', clusterId: 'c' },
    { llmCall: async () => '生成结果', cacheDir: dir });
  assert.equal(r, '生成结果');
  const again = await generateIdeology({ id: 'y', title: 't', clusterId: 'c' },
    { llmCall: async () => { throw new Error('不该调用'); }, cacheDir: dir });
  assert.equal(again, '生成结果');
  rmSync(dir, { recursive: true, force: true });
});
