export function normalizeId(s) {
  return String(s)
    .replace(/^kp_/, '')
    .trim().toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-一-龥]/g, '')
    .replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function resolvePrereqs(point, idMap) {
  if (!Array.isArray(point.prerequisites)) return;
  point.prerequisites = point.prerequisites
    .map(id => idMap[id] || (idMap[`kp_${id}`] ?? null))
    .filter(Boolean);
}

export function dedupPoints(authored, mined) {
  const byId = new Map();
  const byTitle = new Map();
  for (const p of authored) { byId.set(p.id, p); byTitle.set(p.title, p); }
  const out = [...authored];
  for (const p of mined) {
    if (byId.has(p.id) || byTitle.has(p.title)) continue; // 冲突保留 authored
    byId.set(p.id, p); byTitle.set(p.title, p); out.push(p);
  }
  return out;
}
