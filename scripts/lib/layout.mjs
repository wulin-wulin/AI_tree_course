function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const CANVAS_W = 4000, CANVAS_H = 3000;

function convexHull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  lower.pop(); upper.pop();
  return lower.concat(upper);
}

// 由簇内点生成区域多边形：凸包外扩 padding；点太少时退化为外扩包围盒（保证 >=4 点）。
function regionPolygon(clusterPts, padding = 70) {
  const xs = clusterPts.map((p) => p[0]);
  const ys = clusterPts.map((p) => p[1]);
  const cx = xs.reduce((a, b) => a + b, 0) / clusterPts.length;
  const cy = ys.reduce((a, b) => a + b, 0) / clusterPts.length;
  const hull = convexHull(clusterPts);
  if (hull.length >= 3) {
    return hull.map(([x, y]) => {
      const dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy) || 1;
      return [Math.round(x + (dx / d) * padding), Math.round(y + (dy / d) * padding)];
    });
  }
  const minX = Math.min(...xs) - padding, maxX = Math.max(...xs) + padding;
  const minY = Math.min(...ys) - padding, maxY = Math.max(...ys) + padding;
  return [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]].map(([x, y]) => [Math.round(x), Math.round(y)]);
}

export function layoutByCluster(points, opts = {}) {
  const rand = seeded(opts.seed ?? 12345);
  const byCluster = new Map();
  for (const p of points) {
    if (!byCluster.has(p.clusterId)) byCluster.set(p.clusterId, []);
    byCluster.get(p.clusterId).push(p);
  }
  const clusterIds = [...byCluster.keys()];
  const N = clusterIds.length;
  const cx0 = CANVAS_W / 2, cy0 = CANVAS_H / 2;

  // 1) 簇锚点：黄金角螺旋紧凑铺排（非网格），簇与簇靠近 → 点云交错
  const anchors = {};
  const Rmax = Math.min(CANVAS_W, CANVAS_H) * 0.46;
  clusterIds.forEach((cid, i) => {
    const t = i + 0.5;
    const r = Math.sqrt(t / N) * Rmax;
    const a = t * 2.399963229728653; // 黄金角
    anchors[cid] = [cx0 + r * Math.cos(a), cy0 + r * Math.sin(a)];
  });

  // 2) 初始化：每簇点在锚点周围按半径 ∝ sqrt(count) 的圆盘内散布（相邻簇会重叠）
  const pos = {};
  for (const cid of clusterIds) {
    const kps = byCluster.get(cid);
    const R = 90 + Math.sqrt(kps.length) * 78;
    for (const kp of kps) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand()) * R;
      pos[kp.id] = [anchors[cid][0] + Math.cos(a) * rr, anchors[cid][1] + Math.sin(a) * rr];
    }
  }

  // 3) 全局力：局部斥力（防重叠、跨簇交错）+ 向本簇锚点的弱内聚
  const all = points;
  const n = all.length;
  const minSep = 86, sep2 = minSep * minSep;
  const maxStep = 36;
  for (let it = 0; it < 140; it++) {
    const f = {};
    for (const p of all) f[p.id] = [0, 0];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pos[all[i].id], b = pos[all[j].id];
        const dx = a[0] - b[0], dy = a[1] - b[1];
        const d2 = dx * dx + dy * dy;
        if (d2 >= sep2 || d2 === 0) continue;
        const d = Math.sqrt(d2) || 1;
        const force = (minSep - d) / d * 0.5;
        const fx = dx * force, fy = dy * force;
        f[all[i].id][0] += fx; f[all[i].id][1] += fy;
        f[all[j].id][0] -= fx; f[all[j].id][1] -= fy;
      }
    }
    for (const p of all) {
      const an = anchors[p.clusterId];
      f[p.id][0] += (an[0] - pos[p.id][0]) * 0.018;
      f[p.id][1] += (an[1] - pos[p.id][1]) * 0.018;
    }
    for (const p of all) {
      let fx = f[p.id][0], fy = f[p.id][1];
      const m = Math.hypot(fx, fy);
      if (m > maxStep) { fx = fx / m * maxStep; fy = fy / m * maxStep; }
      pos[p.id][0] += fx; pos[p.id][1] += fy;
    }
  }

  // 输出位置 + scale
  const result = new Map();
  for (const p of all) {
    const imp = typeof p.importance === 'number' ? p.importance : 0.5;
    result.set(p.id, {
      pos: [Math.round(pos[p.id][0] * 10) / 10, Math.round(pos[p.id][1] * 10) / 10],
      scale: Math.round((0.6 + imp * 1.4) * 100) / 100,
    });
  }

  // 区域多边形（凸包，相邻簇会交错重叠）+ 标签位（质心）
  const regions = {};
  for (const cid of clusterIds) {
    const cpts = byCluster.get(cid).map((kp) => pos[kp.id]);
    const polygon = regionPolygon(cpts);
    const cx = cpts.reduce((a, p) => a + p[0], 0) / cpts.length;
    const cy = cpts.reduce((a, p) => a + p[1], 0) / cpts.length;
    regions[cid] = { polygon, labelPos: [Math.round(cx), Math.round(cy)] };
  }

  return { positions: result, regions };
}
