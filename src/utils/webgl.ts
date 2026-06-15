// WebGL 能力探测。makeCanvas 可注入，便于单测。
export function hasWebGL(
  makeCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): boolean {
  try {
    const canvas = makeCanvas();
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return Boolean(gl);
  } catch {
    return false;
  }
}
