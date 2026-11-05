/**
 * 难度档位 / 题型 / 执行方 / 格子有效池 盘点。
 *
 * 三个维度分开看，别混：
 * - `[Q]`：题型（act 动作型 / ask 提问型）。飞行棋三种格子按题型分流：
 *   幸运时刻只出 act，意外陷阱与亲密追尾出 act 或 ask（由系统随机决定，执行者无选择权）。
 * - `[R]` / `[H]`：奖励向 / 惩罚向（来自手写包「奖惩卡池」），
 *   **不是**低烈度 / 高烈度。烈度由玩家选的包决定，包内不该混入别的烈度的题。
 * - `[M]` / `[F]` / `[both]`：执行方（男方执行 / 女方执行 / 两边都能）。
 *
 * 第二张表按 `pickTaskForRole` 的真实收窄顺序算出每种格子的**有效池**，
 * 用来判断「三格抽的是不是同一个池」；
 * 第三张表给「执行方池全集」——一局里该方可能被抽到的全部题目，
 * 这是判断「玩两局会不会重样」的正确口径（单方一局要抽 18~19 个题）。
 *
 * 用法：npx vite-node scripts/audit-level-dist.ts
 */
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { parseTaskTags, taskKindOf, type TaskKind } from '../src/utils/personalizeTask';
import { EVENT_KINDS, type TaskEventType } from '../src/utils/taskPicker';

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - s.length));

console.log('== 标签分布 ==');
console.log(pad('包名', 14), pad('总数', 6), pad('R', 5), pad('H', 5), pad('Q', 5), pad('F', 5), pad('M', 5), 'both');
console.log('-'.repeat(60));

for (const pack of COUPLE_DEFAULT_THEMES) {
  let r = 0, h = 0, q = 0, f = 0, m = 0, b = 0;
  for (const task of pack.tasks) {
    const tags = parseTaskTags(task).tags;
    if (tags.includes('R')) r++;
    if (tags.includes('H')) h++;
    if (tags.includes('Q')) q++;
    if (tags.includes('F')) f++;
    else if (tags.includes('M')) m++;
    else if (tags.includes('both')) b++;
  }
  console.log(
    pad(pack.name, 14),
    pad(String(pack.tasks.length), 6),
    pad(String(r), 5),
    pad(String(h), 5),
    pad(String(q), 5),
    pad(String(f), 5),
    pad(String(m), 5),
    String(b),
  );
}

/* ------------------------------------------------------------------ */
/* 格子有效池                                                            */
/* ------------------------------------------------------------------ */

/**
 * 复刻 `pickTaskForRole` 的收窄逻辑，返回某个 (事件, 执行方, 题型) 下的有效池题目。
 * 与运行时唯一的差别是题型由系统随机决定，这里把每种题型的池都算出来。
 */
function poolOf(
  tasks: string[],
  eventType: TaskEventType,
  executorRole: 'male' | 'female',
  kind: TaskKind,
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

function kindOptionsOf(tasks: string[], eventType: TaskEventType): TaskKind[] {
  const kinds = EVENT_KINDS[eventType].filter(k => tasks.some(t => taskKindOf(t) === k));
  return kinds.length > 0 ? kinds : ['act'];
}

/** 某格某方的所有可能池（题型随机，可能落到其中之一） */
function poolsOfCell(
  tasks: string[],
  eventType: TaskEventType,
  role: 'male' | 'female',
): string[][] {
  return kindOptionsOf(tasks, eventType).map(k => poolOf(tasks, eventType, role, k));
}

function cellLabel(pools: string[][]): string {
  const sizes = [...new Set(pools.map(p => p.length))].sort((a, b) => a - b);
  return sizes.length === 1 ? String(sizes[0]) : sizes.join('/');
}

console.log('\n== 格子有效池（男 | 女）==');
console.log('   数字 = 唯一池大小；a/b = 题型由系统随机决定，可能取到 a 或 b');
console.log(pad('包名', 14), pad('幸运时刻', 14), pad('意外陷阱', 16), pad('亲密追尾', 16), '三格同池');
console.log('-'.repeat(74));

let sameCount = 0;
const convertedIds = new Set<string>();
for (const pack of COUPLE_DEFAULT_THEMES) {
  const tasks = pack.tasks;
  const cells: string[] = [];
  const cellSets: string[][] = [];

  for (const event of EVENTS) {
    const perRole = (['male', 'female'] as const).map(role => poolsOfCell(tasks, event, role));
    cellSets.push(perRole.map(pools => pools.map(p => p.join('')).join('')).join(''));
    cells.push(perRole.map(pools => cellLabel(pools)).join(' | '));
  }

  const same = new Set(cellSets).size === 1;
  if (same) sameCount++;

  console.log(
    pad(pack.name, 14),
    pad(cells[0], 14),
    pad(cells[1], 16),
    pad(cells[2], 16),
    same ? '是' : '否',
  );
  void convertedIds;
}
console.log('-'.repeat(74));
console.log(`三格同池：${sameCount} / ${COUPLE_DEFAULT_THEMES.length} 个情侣包`);

/* ------------------------------------------------------------------ */
/* 执行方池全集                                                          */
/* ------------------------------------------------------------------ */

console.log('\n== 执行方池全集（一局内该方可能被抽到的全部题目）==');
console.log('   低于 37 = 单方一局抽 18~19 个题时，玩两局必然重样');
console.log('   执行方由 audience 决定：包的执行方永远是对方');
console.log('     audience=male   → 只有男方能选 → 女方执行');
console.log('     audience=female → 只有女方能选 → 男方执行');
console.log('     audience=common → 两边都能选 → 取较小的一侧');
console.log(pad('包名', 14), pad('执行方', 8), pad('执行方池', 9), '够两局不重复');
console.log('-'.repeat(60));

const shortPacks: string[] = [];
for (const pack of COUPLE_DEFAULT_THEMES) {
  const tasks = pack.tasks;
  const executorRoles: ('male' | 'female')[] =
    pack.audience === 'male' ? ['female'] : pack.audience === 'female' ? ['male'] : ['male', 'female'];

  const unionFor = (role: 'male' | 'female'): number => {
    const set = new Set<string>();
    for (const event of EVENTS) {
      for (const pool of poolsOfCell(tasks, event, role)) {
        for (const t of pool) set.add(t);
      }
    }
    return set.size;
  };

  const sizes = executorRoles.map(unionFor);
  const pool = Math.min(...sizes);
  const ok = pool >= 37;
  if (!ok) shortPacks.push(`${pack.name} ${pool}`);
  const roleLabel = executorRoles.length === 1 ? (executorRoles[0] === 'male' ? '男方' : '女方') : '双方';
  console.log(pad(pack.name, 14), pad(roleLabel, 8), pad(String(pool), 9), ok ? '够' : '不够');
}
console.log('-'.repeat(60));
console.log(`不够两局不重复的包：${shortPacks.length} 个 → ${shortPacks.join('、')}`);
