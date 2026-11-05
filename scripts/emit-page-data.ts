/**
 * 为可视化页面产出数据块。
 *
 * 页面里的 PACKS / POOLS 两张表如果手抄，改一次包就要改一次页面，
 * 迟早对不上。这里直接从运行期数据对象算出这两张表，打印成可直接粘进
 * `couple-flying-chess-content-inventory.html` 的 JS 字面量。
 *
 * 用法：npx vite-node scripts/emit-page-data.ts
 */
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../src/data/themes';
import { PACKS as TD_PACK_SPECS } from './td-pack-specs';
import { parseTaskTags, taskKindOf, type TaskKind } from '../src/utils/personalizeTask';
import { EVENT_KINDS, type TaskEventType } from '../src/utils/taskPicker';

/**
 * 包的三种来源，直接取自转换器的规格表，避免两处各写一遍：
 * - hand  手写包（含 11 个阶梯包 + 普通模式 5 个包）
 * - conv   场景包：一个 TD 主题 = 一个包，包内是该幻想的推进梯度
 * - tier   烈度包：同一个 TD 主题按烈度档拆开，一包只收一档
 */
const TIER_PACK_IDS = new Set(TD_PACK_SPECS.filter(s => s.tiers).map(s => s.id));
const CONVERTED_PACK_IDS = new Set(TD_PACK_SPECS.map(s => s.id));

function sourceOf(pack: { id: string; tasks: string[] }): 'hand' | 'conv' | 'tier' {
  if (!CONVERTED_PACK_IDS.has(pack.id)) return 'hand';
  return TIER_PACK_IDS.has(pack.id) ? 'tier' : 'conv';
}

const norm = (s: string) =>
  s.replace(/^(\[[^\]]+\]\s*)+/, '')
    .replace(/[\s\u3000]/g, '')
    .replace(/[，。！？、；：""''（）【】《》…—～·,.!?;:'"()[\]<>~`@#$%^&*_+=|-]/g, '')
    .toLowerCase();

// ─────────────────────────── PACKS 表 ───────────────────────────

interface PackRow {
  n: string;
  m: 'couple' | 'normal';
  a: string;
  t: number;
  M: number;
  F: number;
  B: number;
  Q: number;
  R: number;
  H: number;
  u: number;
  src: 'hand' | 'conv' | 'tier';
}

const rows: PackRow[] = [];

for (const pack of [...COUPLE_DEFAULT_THEMES, ...NORMAL_DEFAULT_THEMES]) {
  let M = 0, F = 0, B = 0, Q = 0, R = 0, H = 0;
  for (const task of pack.tasks) {
    const tags = parseTaskTags(task).tags;
    if (tags.includes('R')) R++;
    if (tags.includes('H')) H++;
    if (tags.includes('Q')) Q++;
    if (tags.includes('F')) F++;
    else if (tags.includes('M')) M++;
    else B++;
  }
  const uniq = new Set(pack.tasks.map(norm)).size;
  rows.push({
    n: pack.name,
    m: pack.mode === 'couple' ? 'couple' : 'normal',
    a: pack.audience,
    t: pack.tasks.length,
    M, F, B, Q, R, H,
    u: uniq,
    src: sourceOf(pack)
  });
}

// ─────────────────────────── POOLS 表 ───────────────────────────

function poolOf(
  tasks: string[],
  eventType: TaskEventType,
  executorRole: 'male' | 'female',
  kind: TaskKind
): string[] {
  const byKind = tasks.filter(t => taskKindOf(t) === kind);
  const byRole = byKind.filter(t => {
    const tags = parseTaskTags(t).tags;
    if (tags.includes('M') && executorRole !== 'male') return false;
    if (tags.includes('F') && executorRole !== 'female') return false;
    return true;
  });
  const rolePool = byRole.length > 0 ? byRole : byKind;
  const byEvent = rolePool.filter(t => {
    const { tags } = parseTaskTags(t);
    if (eventType === 'trap' && tags.includes('R')) return false;
    if (eventType === 'lucky' && tags.includes('H')) return false;
    if (eventType === 'collision' && (tags.includes('R') || tags.includes('H'))) return false;
    return true;
  });
  let pool = byEvent.length > 0 ? byEvent : rolePool;
  if (eventType === 'trap') {
    const hard = pool.filter(t => parseTaskTags(t).tags.includes('H'));
    if (hard.length > 0) pool = hard;
  } else if (eventType === 'lucky') {
    const reward = pool.filter(t => parseTaskTags(t).tags.includes('R'));
    if (reward.length > 0) pool = reward;
  }
  return pool;
}

const EVENTS: TaskEventType[] = ['lucky', 'trap', 'collision'];

function cellLabel(tasks: string[], event: TaskEventType, role: 'male' | 'female'): string {
  const kinds = EVENT_KINDS[event].filter(k => tasks.some(t => taskKindOf(t) === k));
  const options: TaskKind[] = kinds.length > 0 ? kinds : ['act'];
  const sizes = [...new Set(options.map(k => poolOf(tasks, event, role, k).length))].sort((a, b) => a - b);
  return sizes.join('/');
}

const pools = COUPLE_DEFAULT_THEMES.map(pack => {
  const cells: string[] = [];
  const sets: string[] = [];
  for (const event of EVENTS) {
    const perRole = (['male', 'female'] as const).map(r => cellLabel(pack.tasks, event, r));
    cells.push(perRole.join('|'));
    sets.push(perRole.join('|'));
  }
  return {
    n: pack.name,
    src: sourceOf(pack),
    l: cells[0],
    t: cells[1],
    c: cells[2],
    same: new Set(sets).size === 1
  };
});

// ─────────────────────────── 输出 ───────────────────────────

console.log('/* ===== 由 scripts/emit-page-data.ts 生成，勿手改 ===== */');
console.log('const PACKS = [');
for (const r of rows) {
  console.log(
    `  {n:${JSON.stringify(r.n)},m:${JSON.stringify(r.m)},a:${JSON.stringify(r.a)},` +
    `t:${r.t},M:${r.M},F:${r.F},B:${r.B},Q:${r.Q},R:${r.R},H:${r.H},u:${r.u},` +
    `src:${JSON.stringify(r.src)}},`
  );
}
console.log('];');
console.log('');
console.log('const POOLS = [');
for (const p of pools) {
  console.log(
    `  {n:${JSON.stringify(p.n)},src:${JSON.stringify(p.src)},` +
    `l:${JSON.stringify(p.l)},t:${JSON.stringify(p.t)},c:${JSON.stringify(p.c)},` +
    `same:${p.same}},`
  );
}
console.log('];');
console.log('');
console.log('// 汇总');
const coupleRows = rows.filter(r => r.m === 'couple');
const normalRows = rows.filter(r => r.m === 'normal');
const sum = (rs: PackRow[], k: keyof PackRow) => rs.reduce((a, r) => a + (r[k] as number), 0);
console.log(`// 飞行棋 ${rows.length} 包 / ${sum(rows, 't')} 题`);
console.log(`// 情侣 ${coupleRows.length} 包 / ${sum(coupleRows, 't')} 题（转换包 ${coupleRows.filter(r => r.src !== 'hand').length} 个 / ${sum(coupleRows.filter(r => r.src !== 'hand'), 't')} 题）`);
console.log(`//   其中场景包 ${coupleRows.filter(r => r.src === 'conv').length} 个 / 烈度包 ${coupleRows.filter(r => r.src === 'tier').length} 个`);
console.log(`// 普通 ${normalRows.length} 包 / ${sum(normalRows, 't')} 题`);
console.log(`// 提问型 [Q] ${sum(rows, 'Q')} 条 · 奖励向 [R] ${sum(rows, 'R')} 条 · 惩罚向 [H] ${sum(rows, 'H')} 条`);
console.log(`// 三格同池的包：${pools.filter(p => p.same).length} / ${pools.length}`);
