/**
 * 情侣飞行棋 · 主题包内容审计（只读脚本，不改任何数据）
 * 运行：node -r sucrase/register/ts scripts/audit-couple-content.ts
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { parseTaskTags } from '../src/utils/personalizeTask';

const TAG_RE = /^\[(M|F|both|H|R)\]\s*/;

interface ThemeStat {
  id: string;
  name: string;
  desc: string;
  audience: string;
  total: number;
  male: number;
  female: number;
  both: number;
  hard: number;
  reward: number;
  untagged: number;
  // 各事件类型下的可用题量（复刻 useGameState.checkTile 的过滤逻辑）
  evt: { collision: number; lucky: number; trap: number };
  // 以「执行者角色」为视角的可用量
  asMale: { collision: number; lucky: number; trap: number };
  asFemale: { collision: number; lucky: number; trap: number };
}

function roleOf(tags: string[]): 'male' | 'female' | 'both' {
  if (tags.includes('M')) return 'male';
  if (tags.includes('F')) return 'female';
  return 'both';
}

function eligible(task: string, executorRole: 'male' | 'female', evt: 'collision' | 'lucky' | 'trap'): boolean {
  const { tags } = parseTaskTags(task);
  const roleTag = roleOf(tags);
  if (roleTag === 'male' && executorRole !== 'male') return false;
  if (roleTag === 'female' && executorRole !== 'female') return false;
  if (evt === 'trap' && tags.includes('R')) return false;
  if (evt === 'lucky' && tags.includes('H')) return false;
  if (evt === 'collision' && (tags.includes('R') || tags.includes('H'))) return false;
  return true;
}

/** 复刻 pickTaskForRole：先按角色+事件过滤，再按 H/R 二次收窄 */
function poolSize(tasks: string[], executorRole: 'male' | 'female', evt: 'collision' | 'lucky' | 'trap'): number {
  const base = tasks.filter(t => eligible(t, executorRole, evt));
  let pool = base;
  if (evt === 'trap') {
    const hard = pool.filter(t => parseTaskTags(t).tags.includes('H'));
    if (hard.length > 0) pool = hard;
  } else if (evt === 'lucky') {
    const reward = pool.filter(t => parseTaskTags(t).tags.includes('R'));
    if (reward.length > 0) pool = reward;
  }
  return pool.length;
}

const stats: ThemeStat[] = COUPLE_DEFAULT_THEMES.map(theme => {
  const tasks = theme.tasks;
  let male = 0, female = 0, both = 0, hard = 0, reward = 0, untagged = 0;
  for (const t of tasks) {
    const { tags } = parseTaskTags(t);
    if (tags.includes('M')) male++;
    else if (tags.includes('F')) female++;
    else both++;
    if (tags.includes('H')) hard++;
    if (tags.includes('R')) reward++;
    if (tags.length === 0) untagged++;
  }
  return {
    id: theme.id,
    name: theme.name,
    desc: theme.desc,
    audience: theme.audience,
    total: tasks.length,
    male, female, both, hard, reward, untagged,
    evt: {
      collision: poolSize(tasks, 'male', 'collision') + poolSize(tasks, 'female', 'collision'),
      lucky: poolSize(tasks, 'male', 'lucky') + poolSize(tasks, 'female', 'lucky'),
      trap: poolSize(tasks, 'male', 'trap') + poolSize(tasks, 'female', 'trap'),
    },
    asMale: {
      collision: poolSize(tasks, 'male', 'collision'),
      lucky: poolSize(tasks, 'male', 'lucky'),
      trap: poolSize(tasks, 'male', 'trap'),
    },
    asFemale: {
      collision: poolSize(tasks, 'female', 'collision'),
      lucky: poolSize(tasks, 'female', 'lucky'),
      trap: poolSize(tasks, 'female', 'trap'),
    },
  };
});

console.log('════════ 情侣主题包 · 总量 ════════');
console.log('主题数:', stats.length);
console.log('任务总数:', stats.reduce((a, s) => a + s.total, 0));
console.log('状态池数量:', COUPLE_DEFAULT_THEMES.filter(t => t.actionStates || t.conditionStates).length);

console.log('\n════════ 逐主题明细 ════════');
const pad = (s: string | number, n: number) => String(s).padEnd(n);
console.log(
  pad('主题', 14), pad('题量', 6), pad('男', 5), pad('女', 5), pad('通用', 6),
  pad('H', 5), pad('R', 5), pad('无标签', 7), pad('撞', 6), pad('运', 6), pad('陷', 6),
  pad('男执行', 8), pad('女执行', 8)
);
for (const s of stats) {
  console.log(
    pad(s.name, 14), pad(s.total, 6), pad(s.male, 5), pad(s.female, 5), pad(s.both, 6),
    pad(s.hard, 5), pad(s.reward, 5), pad(s.untagged, 7),
    pad(s.evt.collision, 6), pad(s.evt.lucky, 6), pad(s.evt.trap, 6),
    pad(`${s.asMale.collision}/${s.asMale.lucky}/${s.asMale.trap}`, 8),
    pad(`${s.asFemale.collision}/${s.asFemale.lucky}/${s.asFemale.trap}`, 8)
  );
}

console.log('\n════════ 事件类型可用量 < 6 的主题（会重复抽到同一题）════════');
for (const s of stats) {
  const bad: string[] = [];
  for (const [k, v] of Object.entries(s.evt)) if (v < 6) bad.push(`${k}=${v}`);
  for (const role of ['asMale', 'asFemale'] as const) {
    for (const [k, v] of Object.entries(s[role])) if (v < 4) bad.push(`${role}.${k}=${v}`);
  }
  if (bad.length) console.log(`  ${s.name} (${s.total}题): ${bad.join('  ')}`);
}

console.log('\n════════ 全局重复题（同一主题内）════════');
let dupTotal = 0;
for (const theme of COUPLE_DEFAULT_THEMES) {
  const seen = new Map<string, number>();
  for (const t of theme.tasks) {
    const key = t.replace(TAG_RE, '').trim();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const dups = [...seen.entries()].filter(([, n]) => n > 1);
  if (dups.length) {
    dupTotal += dups.length;
    console.log(`  ${theme.name}: ${dups.length} 组重复`);
    dups.slice(0, 3).forEach(([k, n]) => console.log(`     ×${n}  ${k.slice(0, 42)}`));
  }
}
console.log('重复组合计:', dupTotal);

console.log('\n════════ 跨主题重复题 ════════');
const globalSeen = new Map<string, string[]>();
for (const theme of COUPLE_DEFAULT_THEMES) {
  for (const t of theme.tasks) {
    const key = t.replace(TAG_RE, '').trim();
    const arr = globalSeen.get(key) ?? [];
    arr.push(theme.name);
    globalSeen.set(key, arr);
  }
}
const cross = [...globalSeen.entries()].filter(([, v]) => new Set(v).size > 1);
console.log('跨主题重复文案数:', cross.length);
cross.slice(0, 8).forEach(([k, v]) => {
  console.log(`  ${[...new Set(v)].join(' / ')}: ${k.slice(0, 40)}`);
});

console.log('\n════════ 文案长度分布（判断是否太短/太长）════════');
const lens = COUPLE_DEFAULT_THEMES.flatMap(t => t.tasks.map(x => x.replace(TAG_RE, '').length));
lens.sort((a, b) => a - b);
const q = (p: number) => lens[Math.floor(lens.length * p)];
console.log(`n=${lens.length} 最短=${lens[0]} P25=${q(0.25)} 中位=${q(0.5)} P75=${q(0.75)} 最长=${lens[lens.length - 1]}`);
console.log('≤12字的短题:', lens.filter(l => l <= 12).length);
console.log('≥40字的长题:', lens.filter(l => l >= 40).length);

console.log('\n════════ 描述里的等级暗示 ════════');
for (const s of stats) {
  const m = s.desc.match(/Level\s*(\d+)/);
  console.log(`  ${pad(s.name, 14)} ${pad(s.audience, 8)} ${m ? 'Level ' + m[1] : '—'}  ${s.desc.slice(0, 40)}`);
}
