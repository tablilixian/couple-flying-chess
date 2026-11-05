/**
 * TD 题库「未被飞行棋包接管」的题目盘点。
 *
 * 背景：TD 情侣库有 1961 条（14 个主题），转换器只接管了 9 个主题，
 * 剩下 5 个主题（sweet / spicy / roleplay / kinky / bdsm）的题目从未进过任何包。
 * 这一脚本查清：
 * 1. 14 个主题各自的题量与难度分布，标出哪些被接管、哪些是遗留
 * 2. 遗留题目与现有飞行棋包（手写 11 + 转换 9）的内容重叠
 * 3. 遗留题目与普通模式题库、TD 惩罚库的重叠
 *
 * 用法：npx vite-node scripts/audit-td-leftover.ts
 */
import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes';
import { stripTaskTags } from '../src/utils/personalizeTask';
import type { TDTheme, TDDifficulty } from '../src/types';

/** 转换器已接管的 TD 主题 → 对应的飞行棋包 */
const CONVERTED: Record<TDTheme, string> = {
  exposure: '众目之下',
  home: '客厅禁区',
  confession: '深夜坦白',
  taboo: '底线之后',
  third: '三人世界',
  dirtytalk: '口无遮拦',
  cuckold: '易主之夜',
  swing: '互换之夜',
  slutwife: '风情妻子',
};

/** 归一化：剥标签、去标点空白、繁简与全半角统一，用于判重 */
function norm(s: string): string {
  return stripTaskTags(s)
    .replace(/[\s\u3000]/g, '')
    .replace(/[，。！？、；：""''（）【】《》…—～·,.!?;:'"()[\]<>~`@#$%^&*_+=|-]/g, '')
    .toLowerCase();
}

const ALL_THEMES: TDTheme[] = [
  'sweet', 'spicy', 'confession', 'roleplay', 'kinky', 'bdsm',
  'taboo', 'dirtytalk', 'slutwife', 'swing', 'exposure', 'cuckold', 'third', 'home',
];

const DIFFS: TDDifficulty[] = ['soft', 'hot', 'hard', 'extreme'];

/** 现有飞行棋包里已出现的题面（归一化后） */
const packTexts = new Map<string, string[]>();
for (const pack of COUPLE_DEFAULT_THEMES) {
  packTexts.set(pack.name, pack.tasks.map(t => norm(t)));
}
const allPackNorm = new Set<string>();
for (const list of packTexts.values()) for (const t of list) allPackNorm.add(t);

/** 包内去重（剥标签后同文）造成的丢弃量 */
let packDupDropped = 0;
for (const pack of COUPLE_DEFAULT_THEMES) {
  const seen = new Set<string>();
  for (const t of pack.tasks) {
    const key = norm(t);
    if (seen.has(key)) packDupDropped++;
    seen.add(key);
  }
}

console.log('== 14 个 TD 主题的接管情况 ==');
console.log(
  '主题'.padEnd(12), '状态'.padEnd(8), '总数'.padEnd(7),
  'soft'.padEnd(6), 'hot'.padEnd(6), 'hard'.padEnd(7), 'extreme'.padEnd(9), 'truth/dare',
);
console.log('-'.repeat(76));

const leftovers: { theme: TDTheme; text: string; difficulty: TDDifficulty; type: 'truth' | 'dare'; target: string }[] = [];
let convertedTotal = 0;
let leftoverTotal = 0;

for (const theme of ALL_THEMES) {
  const qs = COUPLE_QUESTIONS.filter(q => q.theme === theme);
  const byDiff = new Map<TDDifficulty, number>();
  for (const d of DIFFS) byDiff.set(d, 0);
  let truth = 0, dare = 0;
  for (const q of qs) {
    byDiff.set(q.difficulty, (byDiff.get(q.difficulty) ?? 0) + 1);
    if (q.type === 'truth') truth++; else dare++;
  }
  const isConv = theme in CONVERTED;
  if (isConv) convertedTotal += qs.length;
  else {
    leftoverTotal += qs.length;
    for (const q of qs) leftovers.push({ theme, text: q.text, difficulty: q.difficulty, type: q.type, target: q.target });
  }
  console.log(
    theme.padEnd(12),
    (isConv ? `已接管→${CONVERTED[theme]}` : '遗留').padEnd(8),
    String(qs.length).padEnd(7),
    String(byDiff.get('soft')).padEnd(6),
    String(byDiff.get('hot')).padEnd(6),
    String(byDiff.get('hard')).padEnd(7),
    String(byDiff.get('extreme')).padEnd(9),
    `${truth}/${dare}`,
  );
}
console.log('-'.repeat(76));
console.log(`已接管 ${convertedTotal} 条 / 遗留 ${leftoverTotal} 条 / 合计 ${COUPLE_QUESTIONS.length} 条`);

/* ------------------------------------------------------------------ */

console.log('\n== 遗留题目与现有飞行棋包的重叠 ==');
const overlapCounter = new Map<string, number>();
const overlapSamples = new Map<string, string[]>();
for (const item of leftovers) {
  const key = norm(item.text);
  for (const [packName, list] of packTexts) {
    if (list.includes(key)) {
      overlapCounter.set(packName, (overlapCounter.get(packName) ?? 0) + 1);
      if (!overlapSamples.has(packName)) overlapSamples.set(packName, []);
      const arr = overlapSamples.get(packName)!;
      if (arr.length < 3) arr.push(item.text);
    }
  }
}
if (overlapCounter.size === 0) {
  console.log('与所有飞行棋包无重叠');
} else {
  for (const [packName, n] of [...overlapCounter].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${packName}: ${n} 条  例：${overlapSamples.get(packName)!.map(s => `「${s}」`).join(' ')}`);
  }
}
console.log(`重叠合计 ${[...overlapCounter.values()].reduce((a, b) => a + b, 0)} 条`);

/* ------------------------------------------------------------------ */

console.log('\n== 遗留题目自身去重 ==');
const seen = new Set<string>();
let dupInLeftover = 0;
for (const item of leftovers) {
  const key = norm(item.text);
  if (seen.has(key)) dupInLeftover++;
  seen.add(key);
}
console.log(`遗留 ${leftoverTotal} 条 → 唯一 ${seen.size} 条（自身重复 ${dupInLeftover} 条）`);

/* ------------------------------------------------------------------ */

console.log('\n== 遗留题目按 主题 × 难度 分布（拆包依据）==');
const grid = new Map<string, Map<TDDifficulty, number>>();
for (const item of leftovers) {
  if (!grid.has(item.theme)) grid.set(item.theme, new Map());
  const row = grid.get(item.theme)!;
  row.set(item.difficulty, (row.get(item.difficulty) ?? 0) + 1);
}
console.log('主题'.padEnd(12), 'soft'.padEnd(6), 'hot'.padEnd(6), 'hard'.padEnd(7), 'extreme'.padEnd(9), '合计');
console.log('-'.repeat(52));
for (const [theme, row] of grid) {
  const cells = DIFFS.map(d => String(row.get(d) ?? 0));
  const total = cells.reduce((a, b) => a + Number(b), 0);
  console.log(theme.padEnd(12), ...cells.map(c => c.padEnd(theme === 'spicy' ? 6 : 6)), String(total));
}
console.log('-'.repeat(52));
console.log(`现有包内重复导致丢弃：${packDupDropped} 条`);
