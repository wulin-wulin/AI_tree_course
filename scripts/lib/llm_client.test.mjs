import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeLlmCall } from './llm_client.mjs';

test('构造请求并解析 content', async () => {
  let captured;
  const fakeFetch = async (url, opts) => {
    captured = { url, body: JSON.parse(opts.body), headers: opts.headers };
    return { ok: true, json: async () => ({ choices: [{ message: { content: '答复' } }] }) };
  };
  const call = makeLlmCall({ base_url: 'https://x/v1', model: 'm', temperature: 0.5 },
    { fetchImpl: fakeFetch, apiKey: 'KEY' });
  const r = await call('你好');
  assert.equal(r, '答复');
  assert.equal(captured.url, 'https://x/v1/chat/completions');
  assert.equal(captured.body.model, 'm');
  assert.match(captured.headers.Authorization, /KEY/);
});

test('非 ok 抛错', async () => {
  const call = makeLlmCall({ base_url: 'https://x/v1', model: 'm' },
    { fetchImpl: async () => ({ ok: false, status: 500, text: async () => 'err' }), apiKey: 'K' });
  await assert.rejects(() => call('hi'), /500/);
});
