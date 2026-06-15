import { describe, it, expect } from 'vitest';
import { hasWebGL } from './webgl';

describe('hasWebGL', () => {
  it('能拿到 webgl context 时返回 true', () => {
    const fakeCanvas = { getContext: (k: string) => (k.includes('webgl') ? {} : null) };
    expect(hasWebGL(() => fakeCanvas as unknown as HTMLCanvasElement)).toBe(true);
  });

  it('拿不到 context 时返回 false', () => {
    const fakeCanvas = { getContext: () => null };
    expect(hasWebGL(() => fakeCanvas as unknown as HTMLCanvasElement)).toBe(false);
  });

  it('创建 canvas 抛错时返回 false（不崩溃）', () => {
    expect(
      hasWebGL(() => {
        throw new Error('no document');
      }),
    ).toBe(false);
  });
});
