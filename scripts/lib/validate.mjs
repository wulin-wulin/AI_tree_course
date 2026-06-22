export function validateOutput(index, points) {
  const errs = [];
  const clusterIds = new Set(index.clusters.map(c => c.id));
  const pointIds = new Set(index.points.map(p => p.id));
  for (const p of index.points) {
    if (!clusterIds.has(p.clusterId)) errs.push(`点 ${p.id} 指向不存在的簇 ${p.clusterId}`);
    if (!p.pos || p.pos.length !== 2) errs.push(`点 ${p.id} 缺坐标`);
  }
  for (const [id, full] of Object.entries(points)) {
    for (const pre of (full.prerequisites || [])) {
      if (!pointIds.has(pre)) errs.push(`点 ${id} 前置依赖悬空: ${pre}`);
    }
  }
  return errs;
}
