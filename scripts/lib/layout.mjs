function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const CANVAS_W = 4000, CANVAS_H = 3000;

export function layoutByCluster(points, opts = {}) {
  const rand = seeded(opts.seed ?? 12345);
  const byCluster = new Map();
  for (const p of points) {
    if (!byCluster.has(p.clusterId)) byCluster.set(p.clusterId, []);
    byCluster.get(p.clusterId).push(p);
  }
  const clusterIds = [...byCluster.keys()];
  const cols = Math.ceil(Math.sqrt(clusterIds.length));
  const rows = Math.ceil(clusterIds.length / cols);
  const cellW = CANVAS_W / cols, cellH = CANVAS_H / rows;

  const result = new Map();
  const regions = {};
  clusterIds.forEach((cid, ci) => {
    const col = ci % cols, row = Math.floor(ci / cols);
    const ox = col * cellW, oy = row * cellH;
    const pad = Math.min(cellW, cellH) * 0.04;
    regions[cid] = {
      polygon: [
        [ox + pad, oy + pad], [ox + cellW - pad, oy + pad],
        [ox + cellW - pad, oy + cellH - pad], [ox + pad, oy + cellH - pad],
      ],
      labelPos: [ox + cellW / 2, oy + cellH * 0.16],
    };
    const kps = byCluster.get(cid);
    const n = kps.length;
    // 初始网格散布 + 抖动
    const gc = Math.max(1, Math.ceil(Math.sqrt(n)));
    const pos = {};
    kps.forEach((kp, i) => {
      const gx = i % gc, gy = Math.floor(i / gc);
      const px = ox + cellW * 0.1 + (gx + 0.5) / gc * cellW * 0.8 + (rand() - 0.5) * 20;
      const py = oy + cellH * 0.1 + (gy + 0.5) / gc * cellH * 0.8 + (rand() - 0.5) * 20;
      pos[kp.id] = [px, py];
    });
    // 简易斥力迭代防重叠
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = pos[kps[i].id], b = pos[kps[j].id];
        let dx = a[0] - b[0], dy = a[1] - b[1];
        let d = Math.hypot(dx, dy) || 0.01;
        if (d < 40) {
          const f = (40 - d) / 2;
          dx /= d; dy /= d;
          a[0] += dx * f; a[1] += dy * f; b[0] -= dx * f; b[1] -= dy * f;
        }
      }
    }
    kps.forEach(kp => {
      const imp = typeof kp.importance === 'number' ? kp.importance : 0.5;
      result.set(kp.id, {
        pos: [Math.round(pos[kp.id][0] * 10) / 10, Math.round(pos[kp.id][1] * 10) / 10],
        scale: Math.round((0.6 + imp * 1.4) * 100) / 100,
      });
    });
  });
  return { positions: result, regions };
}
