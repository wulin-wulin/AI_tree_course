import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed } from './prng';

describe('mulberry32', () => {
  it('同种子产生相同序列（确定性）', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('不同种子产生不同序列', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toEqual(b());
  });

  it('输出落在 [0,1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('hashSeed', () => {
  it('字符串转稳定数值种子', () => {
    expect(hashSeed('intro-history')).toEqual(hashSeed('intro-history'));
    expect(hashSeed('a')).not.toEqual(hashSeed('b'));
  });
});
