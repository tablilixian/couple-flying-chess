import { COUPLE_QUESTIONS } from '../src/data/truthDare';
import { COUPLE_DEFAULT_THEMES, NORMAL_DEFAULT_THEMES } from '../src/data/themes/index';

// 现有手写飞行棋任务 → 按 desc 里的 Level 映射 difficulty
const LEVEL_MAP: Record<string, 'soft'|'hot'|'hard'|'extreme'> = {
  'Level 0': 'soft', 'Level 1': 'soft', 'Level 2': 'hot',
  'Level 3': 'hard', 'Level 4': 'extreme', 'Level 5': 'extreme',
};
const fc = COUPLE_DEFAULT_THEMES.filter(t=>t.mode==='couple');
const hand: Record<string, number> = { soft:0, hot:0, hard:0, extreme:0, unknown:0 };
for (const th of fc) {
  const m = th.desc.match(/Level\s*(\d)/);
  const key = m ? LEVEL_MAP[`Level ${m[1]}`] : 'unknown';
  hand[key] += th.tasks.length;
}
console.log('════════ 手写 489 条按 Level 映射难度 ════════');
console.log(hand);

console.log('\n════════ 融合后总池（情侣）════════');
const tdTruth = COUPLE_QUESTIONS.filter(q=>q.type==='truth').length;
const tdDare  = COUPLE_QUESTIONS.filter(q=>q.type==='dare').length;
console.log(`dare 池: 手写 ${fc.reduce((a,t)=>a+t.tasks.length,0)} + TD ${tdDare} = ${fc.reduce((a,t)=>a+t.tasks.length,0)+tdDare}`);
console.log(`truth 池: 手写 ~7 + TD ${tdTruth} = ${tdTruth+7}`);
console.log(`总计 ${fc.reduce((a,t)=>a+t.tasks.length,0)+tdTruth+tdDare+7} 条（当前 489）`);

console.log('\n════════ 融合后各烈度档 × 题型 的可用量（情侣）════════');
console.log('档位    hand_dare  td_dare  dare合计 | td_truth  truth合计');
for (const d of ['soft','hot','hard','extreme'] as const) {
  const tdD = COUPLE_QUESTIONS.filter(q=>q.type==='dare'&&q.difficulty===d).length;
  const tdT = COUPLE_QUESTIONS.filter(q=>q.type==='truth'&&q.difficulty===d).length;
  const h = hand[d] ?? 0;
  console.log(`${d.padEnd(8)} ${String(h).padStart(8)} ${String(tdD).padStart(8)} ${String(h+tdD).padStart(9)} | ${String(tdT).padStart(7)} ${String(tdT+7).padStart(9)}`);
}

console.log('\n════════ 普通模式侧 ════════');
const nm = NORMAL_DEFAULT_THEMES;
console.log(`普通飞行棋包 ${nm.length} 个 / ${nm.reduce((a,t)=>a+t.tasks.length,0)} 题，单局约需 37 → 两局 74`);
console.log(`普通 TD 题库 NORMAL_QUESTIONS 条数与结构需单独确认`);
