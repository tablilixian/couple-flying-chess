import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { COUPLE_DEFAULT_THEMES } from '../src/data/themes/index';
import { TDTheme } from '../src/types';

// 飞行棋 11 个情侣主题包
const fcThemes = COUPLE_DEFAULT_THEMES.filter(t => t.mode === 'couple');

// 语义映射：飞行棋主题 ← TD 题库主题（人工判定语义覆盖关系）
const SEMANTIC: Record<string, string[]> = {
  '心动序章': [],            // 无对应 TD 主题（原创叙事）
  '甜蜜日常': ['sweet'],
  '暧昧升温': ['spicy'],
  '干柴烈火': ['spicy'],
  '极度诱惑': ['spicy', 'kinky'],
  '灵肉合一': ['kinky', 'bdsm'],
  '情境扮演': ['roleplay'],
  '奖惩卡池': [],            // 原创机制主题
  '主控调教': ['kinky'],
  '女王支配': ['kinky'],
  '契约情侣': [],            // 原创叙事
};

const byTheme = new Map<TDTheme, { n: number; truth: number; dare: number; both: number; male: number; female: number }>();
for (const q of COUPLE_QUESTIONS) {
  const e = byTheme.get(q.theme) || { n: 0, truth: 0, dare: 0, both: 0, male: 0, female: 0 };
  e.n++;
  if (q.type === 'truth') e.truth++; else e.dare++;
  e[q.target]++;
  byTheme.set(q.theme, e);
}

console.log('════════ 真心话题 TD 题库 · 按主题 ════════');
console.log('主题        题量   truth/dare   both/male/female');
const covered = new Set<string>();
for (const [k, v] of byTheme) {
  console.log(
    `${k.padEnd(12)} ${String(v.n).padStart(4)}   ${String(v.truth).padStart(4)}/${String(v.dare).padStart(4)}      ` +
    `${String(v.both).padStart(3)}/${String(v.male).padStart(3)}/${String(v.female).padStart(3)}`
  );
}
for (const list of Object.values(SEMANTIC)) list.forEach(t => covered.add(t));

console.log('\n════════ 飞行棋 ↔ 真心话题 交叉映射 ════════');
console.log('飞行棋主题      题量   对应TD主题(题量)                        合计   覆盖度');
let orphanTotal = 0;
const orphanThemes: string[] = [];
for (const fc of fcThemes) {
  const list = SEMANTIC[fc.name] || [];
  const detail = list.map(t => `${t}(${byTheme.get(t as TDTheme)?.n ?? 0})`).join(' + ') || '—';
  const sum = list.reduce((a, t) => a + (byTheme.get(t as TDTheme)?.n ?? 0), 0);
  const need = 74;
  console.log(
    `${fc.name.padEnd(12)} ${String(fc.tasks.length).padStart(4)}   ${detail.padEnd(38)} ${String(sum).padStart(5)}   ` +
    `${sum >= need ? '✅' : '⚠️'} 需${need}，缺${Math.max(0, need - sum)}`
  );
}
console.log('\n—— 无飞行棋对应包的 TD 主题（现成存量）——');
for (const [k, v] of byTheme) {
  if (!covered.has(k)) {
    orphanTotal += v.n;
    orphanThemes.push(`${k}(${v.n})`);
  }
}
console.log(`孤儿 TD 题: ${orphanTotal} 条，分布于 ${orphanThemes.length} 个主题`);
console.log(orphanThemes.join(', '));

console.log('\n════════ 有效题池测算（两人各选一包）════════');
const rolePool = (tasks: string[], role: 'male' | 'female') => {
  let n = 0;
  for (const t of tasks) {
    const m = t.match(/^\[(M|F|both|H|R)\]\s*/);
    const tag = m?.[1];
    if (tag === 'M') { if (role === 'male') n++; }
    else if (tag === 'F') { if (role === 'female') n++; }
    else n++;
  }
  return n;
};
console.log('场景A 两人选同一包（最坏情况）：');
for (const fc of fcThemes) {
  const m = rolePool(fc.tasks, 'male'), f = rolePool(fc.tasks, 'female');
  const worst = Math.min(m, f);
  console.log(`  ${fc.name.padEnd(12)} 总${String(fc.tasks.length).padStart(3)}  男可执行${String(m).padStart(3)}  女可执行${String(f).padStart(3)}  ` +
    `${worst >= 37 ? '✅够' : '⚠️不足'}（单局约需37）`);
}
console.log('\n场景B 两人选不同包（取题量最大的两包组合，最充裕）：');
const sorted = [...fcThemes].sort((a, b) => b.tasks.length - a.tasks.length);
const big = sorted[0], small = sorted[1];
console.log(`  例：${big.name}(${big.tasks.length}) + ${small.name}(${small.tasks.length})`);
for (const role of ['male', 'female'] as const) {
  const n = rolePool([...big.tasks, ...small.tasks], role);
  console.log(`  ${role} 可执行池 ${n} → ${n >= 74 ? '✅ 够两局' : '⚠️ 不足两局'}`);
}
