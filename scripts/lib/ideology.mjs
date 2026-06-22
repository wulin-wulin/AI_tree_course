import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function buildIdeologyPrompt(point) {
  return [
    '你是《人工智能原理》课程的思政设计助手。',
    '请为下面这个知识点撰写一条课程思政元素（80-150 字，1 段），',
    '要与该知识点强相关，可从科学精神、自主创新、工程伦理、社会责任、家国情怀等角度切入，避免空泛套话。',
    '',
    `知识点标题：${point.title}`,
    `所属知识簇：${point.clusterId}`,
    `核心思想：${point.coreIdea || ''}`,
    '',
    '只输出思政正文，不要加标题或前缀。',
  ].join('\n');
}

export async function generateIdeology(point, { llmCall, cacheDir }) {
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  const cacheFile = join(cacheDir, `${point.id}.txt`);
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf8');
  const text = (await llmCall(buildIdeologyPrompt(point))).trim();
  writeFileSync(cacheFile, text);
  return text;
}
