export function mapDifficulty(d) {
  if (typeof d !== 'number' || Number.isNaN(d)) return '中等';
  if (d < 0.34) return '基础';
  if (d < 0.67) return '中等';
  return '进阶';
}

export function buildComparisons(comparisonValues) {
  if (!comparisonValues || typeof comparisonValues !== 'object') return [];
  return Object.entries(comparisonValues).map(([k, v]) => `${k}: ${v}`);
}

export function pickShortSummary(facets = {}) {
  const raw = (facets.intuition || facets.definition || '').trim();
  if (raw.length <= 120) return raw;
  return raw.slice(0, 120) + '…';
}

export function mapKeyTerms(facets = {}, tags = []) {
  const all = [...(facets.keywords || []), ...(tags || [])];
  const seen = new Set();
  const out = [];
  for (const t of all) {
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out.slice(0, 8);
}

export function mapKpToPoint(kp, clusterId) {
  const f = kp.facets || {};
  const point = {
    id: kp.id,
    title: kp.name_zh,
    clusterId,
    shortSummary: pickShortSummary(f),
    coreIdea: f.core_content || f.definition || '',
    principles: splitPrinciples(f),
    keyTerms: mapKeyTerms(f, kp.tags),
    applications: Array.isArray(f.applications) ? f.applications : [],
    difficulty: mapDifficulty(f.difficulty),
    importance: typeof kp.importance === 'number' ? kp.importance : 0.5,
  };
  const comparisons = buildComparisons(f.comparison_values);
  if (comparisons.length) point.comparisons = comparisons;
  if (f.formalization && f.formalization.trim()) point.formula = f.formalization.trim();
  if (Array.isArray(kp.aliases) && kp.aliases.length) point.aliases = kp.aliases;
  // 可选增强字段（spec §4.2）
  if (f.intuition) point.intuition = f.intuition;
  if (Array.isArray(f.common_misconceptions) && f.common_misconceptions.length) point.misconceptions = f.common_misconceptions;
  if (f.history) point.history = f.history;
  if (kp.year_introduced || f.year_introduced) point.yearIntroduced = kp.year_introduced || f.year_introduced;
  if (f.pros_cons) point.prosCons = f.pros_cons;
  if (Array.isArray(f.qa) && f.qa.length) point.qa = f.qa;
  return point;
}

function splitPrinciples(f) {
  const out = [];
  const core = (f.core_content || '').split(/[。\n]/).map(s => s.trim()).filter(Boolean);
  out.push(...core.slice(0, 4));
  for (const t of (f.teaching_tips || [])) out.push(t);
  return out.slice(0, 6);
}
