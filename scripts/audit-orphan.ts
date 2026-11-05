import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { TDTheme } from '../src/types';
const ORPHAN: TDTheme[] = ['confession','taboo','third','dirtytalk','slutwife','cuckold','swing','exposure','home'];
const pool = COUPLE_QUESTIONS.filter(q => ORPHAN.includes(q.theme));
const truth = pool.filter(q => q.type === 'truth').length;
const dare = pool.filter(q => q.type === 'dare').length;
console.log(`孤儿题 ${pool.length} 条：truth ${truth} / dare ${dare}`);
// 适配飞行棋需要的 tag 分布
let both = 0, male = 0, female = 0;
for (const q of pool) { if (q.target === 'both') both++; else if (q.target === 'male') male++; else female++; }
console.log(`target: both ${both} / male ${male} / female ${female}`);
// 难度分布
const diff: Record<string, number> = {};
for (const q of pool) diff[q.difficulty] = (diff[q.difficulty] || 0) + 1;
console.log('难度:', Object.entries(diff).map(([k,v]) => `${k}:${v}`).join('  '));
// 按主题×难度出可用量（飞行棋一局约需 37 题，若按难度分档则每档需 ~37）
console.log('\n每主题 × 每难度 的可用量（<37 标记 ⚠️）：');
const byTd = new Map<string, number>();
for (const q of pool) {
  const k = `${q.theme}/${q.difficulty}`;
  byTd.set(k, (byTd.get(k) || 0) + 1);
}
for (const t of ORPHAN) {
  const parts = ['soft','hot','hard','extreme'].map(d => {
    const n = byTd.get(`${t}/${d}`) || 0;
    return `${d}:${n}${n < 37 ? '⚠️' : ''}`;
  });
  console.log(`  ${t.padEnd(12)} ${parts.join('  ')}`);
}
